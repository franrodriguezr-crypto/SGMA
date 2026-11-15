
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from backend.database import obtener_conexion


app = FastAPI(title="SGMA - Sistema de Gestión de Mantenimiento")


@app.get("/")
def inicio():
    return {
        "mensaje": "Bienvenido al sistema SGMA",
        "estado": "Funcionando correctamente"
    }


@app.get("/api/maquinas")
def listar_maquinas():
    with obtener_conexion() as conexion:
        with conexion.cursor() as cursor:
            cursor.execute("""
                SELECT id_maquina, codigo, nombre, ubicacion, estado
                FROM maquinas
                ORDER BY id_maquina
            """)

            columnas = [columna.name for columna in cursor.description]
            registros = cursor.fetchall()

            maquinas = [
                dict(zip(columnas, registro))
                for registro in registros
            ]

    return maquinas



# Datos que recibiremos al reportar una falla
class ReporteFalla(BaseModel):
    id_maquina: int
    descripcion: str = Field(min_length=1, max_length=500)


@app.post("/api/reportes-fallas", status_code=201)
def reportar_falla(reporte: ReporteFalla):

    descripcion = reporte.descripcion.strip()

    if not descripcion:
        raise HTTPException(
            status_code=400,
            detail="La descripción no puede estar vacía"
        )

    with obtener_conexion() as conexion:
        with conexion.cursor() as cursor:

            # Comprobar que la máquina exista
            cursor.execute(
                "SELECT id_maquina FROM maquinas WHERE id_maquina = %s",
                (reporte.id_maquina,)
            )

            if cursor.fetchone() is None:
                raise HTTPException(
                    status_code=404,
                    detail="La máquina no existe"
                )

            # Guardar el reporte en PostgreSQL
            cursor.execute("""
                INSERT INTO tickets_fallas (id_maquina, descripcion)
                VALUES (%s, %s)
                RETURNING id_ticket, estado, fecha_creacion
            """, (reporte.id_maquina, descripcion))

            ticket = cursor.fetchone()

    return {
        "mensaje": "Falla reportada correctamente",
        "id_ticket": ticket[0],
        "estado": ticket[1],
        "fecha_creacion": ticket[2]
    }



@app.get("/api/reportes-fallas")
def listar_reportes():

    with obtener_conexion() as conexion:
        with conexion.cursor() as cursor:

            cursor.execute("""
                SELECT
                    t.id_ticket,
                    m.codigo AS codigo_maquina,
                    m.nombre AS maquina,
                    t.descripcion,
                    t.estado,
                    t.fecha_creacion
                FROM tickets_fallas t
                INNER JOIN maquinas m
                    ON t.id_maquina = m.id_maquina
                ORDER BY t.fecha_creacion DESC, t.id_ticket DESC
            """)

            columnas = [columna.name for columna in cursor.description]
            registros = cursor.fetchall()

            reportes = [
                dict(zip(columnas, registro))
                for registro in registros
            ]

    return reportes



class NuevaOrdenTrabajo(BaseModel):
    id_maquina: int
    id_tecnico: int
    prioridad: str


@app.post("/api/ordenes-trabajo", status_code=201)
def crear_orden_trabajo(orden: NuevaOrdenTrabajo):

    prioridades_validas = ["Baja", "Media", "Alta", "Crítica"]

    if orden.prioridad not in prioridades_validas:
        raise HTTPException(
            status_code=400,
            detail="La prioridad debe ser Baja, Media, Alta o Crítica"
        )

    with obtener_conexion() as conexion:
        with conexion.cursor() as cursor:

            # Verificar que la máquina exista
            cursor.execute(
                "SELECT id_maquina FROM maquinas WHERE id_maquina = %s",
                (orden.id_maquina,)
            )

            if cursor.fetchone() is None:
                raise HTTPException(
                    status_code=404,
                    detail="La máquina no existe"
                )

            # Verificar que el usuario sea un técnico activo
            cursor.execute("""
                SELECT id_usuario
                FROM usuarios
                WHERE id_usuario = %s
                  AND rol = 'Tecnico'
                  AND estado = 'Activo'
            """, (orden.id_tecnico,))

            if cursor.fetchone() is None:
                raise HTTPException(
                    status_code=400,
                    detail="El técnico no existe o no está activo"
                )

            # Crear la orden de trabajo
            cursor.execute("""
                INSERT INTO ordenes_trabajo (
                    id_maquina,
                    id_tecnico,
                    prioridad
                )
                VALUES (%s, %s, %s)
                RETURNING id_orden, estado, fecha_creacion
            """, (
                orden.id_maquina,
                orden.id_tecnico,
                orden.prioridad
            ))

            resultado = cursor.fetchone()

    return {
        "mensaje": "Orden de trabajo creada correctamente",
        "id_orden": resultado[0],
        "estado": resultado[1],
        "fecha_creacion": resultado[2]
    }



@app.get("/api/ordenes-trabajo/pendientes")
def listar_trabajos_pendientes():

    with obtener_conexion() as conexion:
        with conexion.cursor() as cursor:

            cursor.execute("""
                SELECT
                    ot.id_orden,
                    m.codigo AS codigo_maquina,
                    m.nombre AS maquina,
                    u.nombre AS tecnico,
                    ot.prioridad,
                    ot.estado,
                    ot.fecha_creacion
                FROM ordenes_trabajo ot
                INNER JOIN maquinas m
                    ON ot.id_maquina = m.id_maquina
                INNER JOIN usuarios u
                    ON ot.id_tecnico = u.id_usuario
                WHERE ot.estado IN ('Asignada', 'En proceso')
                ORDER BY
                    CASE ot.prioridad
                        WHEN 'Crítica' THEN 1
                        WHEN 'Alta' THEN 2
                        WHEN 'Media' THEN 3
                        WHEN 'Baja' THEN 4
                    END,
                    ot.fecha_creacion ASC
            """)

            columnas = [columna.name for columna in cursor.description]
            registros = cursor.fetchall()

            trabajos = [
                dict(zip(columnas, registro))
                for registro in registros
            ]

    return trabajos

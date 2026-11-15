
import { useEffect, useState } from "react";

const API_URL = "http://127.0.0.1:8000";

function TrabajosPendientes() {
  const [trabajos, setTrabajos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  async function cargarTrabajos() {
    setCargando(true);
    setError("");

    try {
      const respuesta = await fetch(
        `${API_URL}/api/ordenes-trabajo/pendientes`
      );

      if (!respuesta.ok) {
        throw new Error("No se pudieron cargar los trabajos");
      }

      const datos = await respuesta.json();
      setTrabajos(datos);
    } catch (err) {
      setError(err.message || "Error al consultar los trabajos.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarTrabajos();
  }, []);

  return (
    <main className="contenido contenido-ancho">
      <div className="titulo">
        <span className="etiqueta">MANTENIMIENTO</span>
        <h1>Trabajos pendientes</h1>
        <p>
          Consulta las órdenes de mantenimiento
          que requieren atención.
        </p>
      </div>

      <div className="barra-trabajos">
        <strong>Órdenes pendientes: {trabajos.length}</strong>

        <button type="button" onClick={cargarTrabajos}>
          Actualizar
        </button>
      </div>

      {cargando && <p>Cargando trabajos...</p>}

      {error && (
        <p className="mensaje-error" role="alert">
          {error}
        </p>
      )}

      {!cargando && !error && trabajos.length === 0 && (
        <p>No hay órdenes de trabajo pendientes.</p>
      )}

      {!cargando && !error && (
        <div className="lista-trabajos">
          {trabajos.map((trabajo) => (
            <article
              key={trabajo.id_orden}
              className={`tarjeta-trabajo ${
                trabajo.prioridad === "Crítica"
                  ? "trabajo-critico"
                  : ""
              }`}
            >
              <div className="cabecera-trabajo">
                <strong>Orden N° {trabajo.id_orden}</strong>

                <span
                  className={`prioridad prioridad-${trabajo.prioridad}`}
                >
                  {trabajo.prioridad}
                </span>
              </div>

              <h3>{trabajo.maquina}</h3>

              <p>
                <strong>Código:</strong> {trabajo.codigo_maquina}
              </p>

              <p>
                <strong>Técnico:</strong> {trabajo.tecnico}
              </p>

              <p>
                <strong>Estado:</strong> {trabajo.estado}
              </p>

              <p className="fecha-trabajo">
                Creada:{" "}
                {new Date(trabajo.fecha_creacion).toLocaleString("es-CL")}
              </p>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

export default TrabajosPendientes;


import { useEffect, useState } from "react";

const API_URL = "http://127.0.0.1:8000";

function CrearOrden() {
  const [maquinas, setMaquinas] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);

  const [maquina, setMaquina] = useState("");
  const [tecnico, setTecnico] = useState("");
  const [prioridad, setPrioridad] = useState("");

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    async function cargarDatos() {
      try {
        const [respuestaMaquinas, respuestaTecnicos] =
          await Promise.all([
            fetch(`${API_URL}/api/maquinas`),
            fetch(`${API_URL}/api/tecnicos`)
          ]);

        if (!respuestaMaquinas.ok || !respuestaTecnicos.ok) {
          throw new Error("No se pudieron cargar los datos");
        }

        setMaquinas(await respuestaMaquinas.json());
        setTecnicos(await respuestaTecnicos.json());
      } catch {
        setError("No se pudieron cargar las máquinas o los técnicos.");
      }
    }

    cargarDatos();
  }, []);

  async function enviarOrden(evento) {
    evento.preventDefault();

    setMensaje("");
    setError("");
    setEnviando(true);

    try {
      const respuesta = await fetch(
        `${API_URL}/api/ordenes-trabajo`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            id_maquina: Number(maquina),
            id_tecnico: Number(tecnico),
            prioridad: prioridad
          })
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          typeof datos.detail === "string"
            ? datos.detail
            : "No se pudo crear la orden"
        );
      }

      setMensaje(
        `¡Orden de trabajo N° ${datos.id_orden} creada correctamente!`
      );

      setMaquina("");
      setTecnico("");
      setPrioridad("");
    } catch (err) {
      setError(err.message || "Error al crear la orden.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="contenido">
      <div className="titulo">
        <span className="etiqueta">SUPERVISOR</span>
        <h1>Crear orden de trabajo</h1>
        <p>Asigna una tarea de mantenimiento a un técnico.</p>
      </div>

      <form className="formulario" onSubmit={enviarOrden}>
        <label htmlFor="orden-maquina">Máquina</label>
        <select
          id="orden-maquina"
          value={maquina}
          onChange={(e) => setMaquina(e.target.value)}
          required
        >
          <option value="">Selecciona una máquina</option>
          {maquinas.map((equipo) => (
            <option
              key={equipo.id_maquina}
              value={equipo.id_maquina}
            >
              {equipo.codigo} - {equipo.nombre}
            </option>
          ))}
        </select>

        <label htmlFor="orden-tecnico">Técnico responsable</label>
        <select
          id="orden-tecnico"
          value={tecnico}
          onChange={(e) => setTecnico(e.target.value)}
          required
        >
          <option value="">Selecciona un técnico</option>
          {tecnicos.map((usuario) => (
            <option
              key={usuario.id_usuario}
              value={usuario.id_usuario}
            >
              {usuario.nombre}
            </option>
          ))}
        </select>

        <label htmlFor="orden-prioridad">Prioridad</label>
        <select
          id="orden-prioridad"
          value={prioridad}
          onChange={(e) => setPrioridad(e.target.value)}
          required
        >
          <option value="">Selecciona una prioridad</option>
          <option value="Baja">Baja</option>
          <option value="Media">Media</option>
          <option value="Alta">Alta</option>
          <option value="Crítica">Crítica</option>
        </select>

        {mensaje && (
          <p className="mensaje-exito" role="status">
            {mensaje}
          </p>
        )}

        {error && (
          <p className="mensaje-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" disabled={enviando}>
          {enviando ? "Creando orden..." : "Crear orden de trabajo"}
        </button>
      </form>
    </main>
  );
}

export default CrearOrden;

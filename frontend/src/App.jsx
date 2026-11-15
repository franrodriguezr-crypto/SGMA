import { useEffect, useState } from "react";
import "./App.css";
import CrearOrden from "./components/CrearOrden";
import TrabajosPendientes from "./components/TrabajosPendientes";

const API_URL = "http://127.0.0.1:8000";

function App() {
  const [maquinas, setMaquinas] = useState([]);
  const [maquina, setMaquina] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [pantalla, setPantalla] = useState("reportar");

  // Obtener las máquinas desde PostgreSQL mediante FastAPI
  useEffect(() => {
    async function cargarMaquinas() {
      try {
        const respuesta = await fetch(`${API_URL}/api/maquinas`);

        if (!respuesta.ok) {
          throw new Error("No se pudieron cargar las máquinas");
        }

        const datos = await respuesta.json();
        setMaquinas(datos);
      } catch (err) {
        setError("No se pudo conectar con el servidor.");
      }
    }

    cargarMaquinas();
  }, []);

  // Enviar un nuevo reporte de falla
  async function enviarReporte(evento) {
    evento.preventDefault();

    setMensaje("");
    setError("");

    if (!descripcion.trim()) {
      setError("Debes escribir una descripción de la falla.");
      return;
    }

    setEnviando(true);

    try {
      const respuesta = await fetch(`${API_URL}/api/reportes-fallas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_maquina: Number(maquina),
          descripcion: descripcion.trim(),
        }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          typeof datos.detail === "string"
            ? datos.detail
            : "No se pudo registrar la falla",
        );
      }

      setMensaje(
        `¡Reporte registrado correctamente! Ticket N° ${datos.id_ticket}`,
      );

      setMaquina("");
      setDescripcion("");
    } catch (err) {
      setError(err.message || "Error al enviar el reporte.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="pagina">
      <header className="encabezado">
        <div className="logo">SGMA</div>
        <span>Sistema de Gestión de Mantenimiento de Activos</span>
      </header>

      {/* Menú de navegación */}
      <nav className="navegacion">
        <button
          type="button"
          className={pantalla === "reportar" ? "activo" : ""}
          onClick={() => setPantalla("reportar")}
        >
          Reportar falla
        </button>

        <button
          type="button"
          className={pantalla === "orden" ? "activo" : ""}
          onClick={() => setPantalla("orden")}
        >
          Crear orden de trabajo
        </button>

        <button
          type="button"
          className={pantalla === "pendientes" ? "activo" : ""}
          onClick={() => setPantalla("pendientes")}
        >
          Trabajos pendientes
        </button>
      </nav>

      {/* Mostrar la pantalla seleccionada */}
      {pantalla === "reportar" ? (
        <main className="contenido">
          <div className="titulo">
            <span className="etiqueta">OPERARIO</span>
            <h1>Reportar falla</h1>
            <p>Registra una anomalía detectada en los equipos de la planta.</p>
          </div>

          <form className="formulario" onSubmit={enviarReporte}>
            <label htmlFor="maquina">Máquina</label>

            <select
              id="maquina"
              value={maquina}
              onChange={(e) => setMaquina(e.target.value)}
              required
            >
              <option value="">Selecciona una máquina</option>

              {maquinas.map((equipo) => (
                <option key={equipo.id_maquina} value={equipo.id_maquina}>
                  {equipo.codigo} - {equipo.nombre}
                </option>
              ))}
            </select>

            <label htmlFor="descripcion">Descripción de la falla</label>

            <textarea
              id="descripcion"
              placeholder="Describe el problema detectado..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              maxLength={500}
              required
            />

            <p className="contador">{descripcion.length}/500 caracteres</p>

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
              {enviando ? "Enviando..." : "Enviar reporte"}
            </button>
          </form>
        </main>
      ) : pantalla === "orden" ? (
        <CrearOrden />
      ) : (
        <TrabajosPendientes />
      )}
    </div>
  );
}

export default App;

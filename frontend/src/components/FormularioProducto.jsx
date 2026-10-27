
import { useEffect, useState } from "react";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

const MAX_IMAGEN_BYTES = 5 * 1024 * 1024;
const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];

function FormularioProducto({ usuario, token, onProductoRegistrado }) {
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [categoria, setCategoria] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [imagenUrl, setImagenUrl] = useState("");
  const [stock, setStock] = useState("0");

  const [archivoImagen, setArchivoImagen] = useState(null);
  const [vistaPrevia, setVistaPrevia] = useState("");
  const [reiniciarArchivo, setReiniciarArchivo] = useState(0);

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [imagenFallida, setImagenFallida] = useState(false);

  const esAdmin = usuario?.rol === "admin" && Boolean(token);

  // Crear y liberar la vista previa de la imagen local.
  useEffect(() => {
    if (!archivoImagen) {
      setVistaPrevia("");
      return;
    }

    const urlTemporal = URL.createObjectURL(archivoImagen);
    setVistaPrevia(urlTemporal);

    return () => {
      URL.revokeObjectURL(urlTemporal);
    };
  }, [archivoImagen]);

  const seleccionarImagen = (e) => {
    const archivo = e.target.files?.[0] || null;

    setError("");
    setMensaje("");

    if (!archivo) {
      setArchivoImagen(null);
      return;
    }

    if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
      setError("Solo se permiten fotografías JPG, PNG o WEBP.");
      setArchivoImagen(null);
      setReiniciarArchivo((valor) => valor + 1);
      return;
    }

    if (archivo.size > MAX_IMAGEN_BYTES) {
      setError("La fotografía no puede superar los 5 MB.");
      setArchivoImagen(null);
      setReiniciarArchivo((valor) => valor + 1);
      return;
    }

    setArchivoImagen(archivo);
    setImagenFallida(false);
  };

  const registrarProducto = async (e) => {
    e.preventDefault();

    setMensaje("");
    setError("");

    if (!esAdmin) {
      setError("No tienes permisos para registrar productos.");
      return;
    }

    const precioNumero = Number(precio);
    const stockNumero = Number(stock);

    if (
      nombre.trim().length < 3 ||
      nombre.trim().length > 120 ||
      !categoria.trim() ||
      !Number.isFinite(precioNumero) ||
      precioNumero <= 0
    ) {
      setError(
        "Ingresa un nombre de 3 a 120 caracteres, una categoría y un precio mayor a cero."
      );
      return;
    }

    if (!Number.isSafeInteger(stockNumero) || stockNumero < 0) {
      setError("El stock debe ser un número entero mayor o igual a cero.");
      return;
    }

    if (
      marca.length > 100 ||
      modelo.length > 100 ||
      descripcion.length > 2000
    ) {
      setError("Revisa la longitud de la marca, modelo o descripción.");
      return;
    }

    if (imagenUrl.trim()) {
      try {
        const url = new URL(imagenUrl.trim());

        if (!["http:", "https:"].includes(url.protocol)) {
          throw new Error("Protocolo no permitido");
        }
      } catch {
        setError("Ingresa una URL válida para la imagen.");
        return;
      }
    }

    if (
      archivoImagen &&
      (!TIPOS_PERMITIDOS.includes(archivoImagen.type) ||
        archivoImagen.size > MAX_IMAGEN_BYTES)
    ) {
      setError("La fotografía seleccionada no es válida.");
      return;
    }

    let productoCreado = null;

    try {
      setGuardando(true);

      // PASO 1: Registrar los datos del producto.
      const respuesta = await fetch(`${API_URL}/api/productos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          nombre: nombre.trim(),
          precio: precioNumero,
          categoria: categoria.trim(),
          marca: marca.trim(),
          modelo: modelo.trim(),
          descripcion: descripcion.trim(),
          imagenUrl: imagenUrl.trim(),
          stock: stockNumero
        })
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.mensaje || "Error al registrar el producto."
        );
      }

      productoCreado = datos.producto;

      if (!productoCreado?.id) {
        throw new Error(
          "El servidor no devolvió el ID del producto registrado."
        );
      }

      // PASO 2: Guardar la fotografía en PostgreSQL.
      if (archivoImagen) {
        const formularioImagen = new FormData();
        formularioImagen.append("imagen", archivoImagen);

        const respuestaImagen = await fetch(
          `${API_URL}/api/productos/${productoCreado.id}/imagen`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`
            },
            body: formularioImagen
          }
        );

        const datosImagen = await respuestaImagen.json();

        if (!respuestaImagen.ok) {
          throw new Error(
            datosImagen.mensaje ||
              "El producto se registró, pero no se pudo guardar su fotografía."
          );
        }
      }

      setMensaje(
        archivoImagen
          ? "Producto y fotografía guardados correctamente en PostgreSQL."
          : "Producto registrado correctamente."
      );

      setNombre("");
      setPrecio("");
      setCategoria("");
      setMarca("");
      setModelo("");
      setDescripcion("");
      setImagenUrl("");
      setStock("0");
      setArchivoImagen(null);
      setVistaPrevia("");
      setReiniciarArchivo((valor) => valor + 1);
      setImagenFallida(false);

      if (onProductoRegistrado) {
        onProductoRegistrado();
      }
    } catch (err) {
      if (productoCreado?.id) {
        setError(
          `El producto #${productoCreado.id} se registró, pero hubo un problema al guardar la fotografía: ${
            err.message || "Error desconocido"
          }. No vuelvas a registrar el producto; podremos subir su fotografía después.`
        );

        if (onProductoRegistrado) {
          onProductoRegistrado();
        }
      } else {
        setError(err.message || "No se pudo registrar el producto.");
      }
    } finally {
      setGuardando(false);
    }
  };

  if (!esAdmin) {
    return null;
  }

  return (
    <section className="formulario-producto">
      <h2>Registrar producto</h2>

      <form onSubmit={registrarProducto}>
        <input
          type="text"
          placeholder="Nombre del producto"
          aria-label="Nombre del producto"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          minLength={3}
          maxLength={120}
          required
        />

        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          aria-label="Categoría del producto"
          required
        >
          <option value="">Selecciona una categoría</option>
          <option value="Motocicletas">Motocicletas</option>
          <option value="Repuestos">Repuestos</option>
          <option value="Accesorios">Accesorios</option>
        </select>

        <input
          type="text"
          placeholder="Marca (Ej. Honda, Yamaha, Suzuki)"
          aria-label="Marca"
          value={marca}
          onChange={(e) => setMarca(e.target.value)}
          maxLength={100}
        />

        <input
          type="text"
          placeholder="Modelo (Ej. CBR 600 F3)"
          aria-label="Modelo"
          value={modelo}
          onChange={(e) => setModelo(e.target.value)}
          maxLength={100}
        />

        <input
          type="number"
          placeholder="Precio en Bs."
          aria-label="Precio en bolivianos"
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
          min="0.01"
          step="0.01"
          required
        />

        <input
          type="number"
          placeholder="Cantidad disponible en stock"
          aria-label="Stock disponible"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          min="0"
          step="1"
          required
        />

        <textarea
          placeholder="Descripción del producto"
          aria-label="Descripción del producto"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          maxLength={2000}
          rows={4}
        />

        <div style={{ marginBottom: "15px" }}>
          <label
            htmlFor="fotografia-producto"
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "bold"
            }}
          >
            Fotografía del producto
          </label>

          <input
            key={reiniciarArchivo}
            id="fotografia-producto"
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            onChange={seleccionarImagen}
            disabled={guardando}
            style={{ width: "100%" }}
          />

          <small style={{ display: "block", marginTop: "6px" }}>
            Selecciona una imagen JPG, PNG o WEBP de hasta 5 MB.
          </small>
        </div>

        {vistaPrevia && (
          <div style={{ marginBottom: "15px", textAlign: "center" }}>
            <p>Vista previa de la fotografía:</p>

            <img
              src={vistaPrevia}
              alt="Vista previa de la fotografía seleccionada"
              style={{
                width: "100%",
                maxWidth: "260px",
                height: "180px",
                objectFit: "contain",
                borderRadius: "10px"
              }}
            />

            <p style={{ fontSize: "13px" }}>
              {archivoImagen?.name}
            </p>
          </div>
        )}

        <input
          type="url"
          placeholder="URL de imagen (opcional)"
          aria-label="URL alternativa de la imagen"
          value={imagenUrl}
          onChange={(e) => {
            setImagenUrl(e.target.value);
            setImagenFallida(false);
          }}
          maxLength={2048}
          disabled={guardando}
        />

        {!archivoImagen && imagenUrl.trim() && !imagenFallida && (
          <div style={{ marginBottom: "15px", textAlign: "center" }}>
            <p>Vista previa de la URL:</p>

            <img
              src={imagenUrl.trim()}
              alt="Vista previa del producto"
              onError={() => setImagenFallida(true)}
              style={{
                width: "100%",
                maxWidth: "260px",
                height: "180px",
                objectFit: "contain",
                borderRadius: "10px"
              }}
            />
          </div>
        )}

        {!archivoImagen && imagenUrl.trim() && imagenFallida && (
          <p style={{ color: "#ff4d6d" }}>
            No se pudo cargar la imagen. Revisa el enlace.
          </p>
        )}

        <button type="submit" disabled={guardando}>
          {guardando ? "Guardando..." : "Registrar producto"}
        </button>
      </form>

      {mensaje && (
        <p style={{ color: "#4ade80" }} role="status">
          {mensaje}
        </p>
      )}

      {error && (
        <p style={{ color: "#ff4d6d" }} role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

export default FormularioProducto;

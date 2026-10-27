
import { useEffect, useState } from "react";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

const MAX_IMAGEN_BYTES = 5 * 1024 * 1024;
const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];

const formatoPrecio = new Intl.NumberFormat("es-BO", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

function obtenerImagenProducto(producto, version = 0) {
  if (producto.imagenTipo) {
    return `${API_URL}/api/productos/${producto.id}/imagen?v=${version}`;
  }

  return producto.imagenUrl || "";
}

function Productos({ usuario, token }) {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [editando, setEditando] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [versionImagen, setVersionImagen] = useState(0);

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
  const [imagenFallida, setImagenFallida] = useState(false);

  const esAdmin = usuario?.rol === "admin" && Boolean(token);

  useEffect(() => {
    if (!archivoImagen) {
      setVistaPrevia("");
      return;
    }

    const urlTemporal = URL.createObjectURL(archivoImagen);
    setVistaPrevia(urlTemporal);

    return () => URL.revokeObjectURL(urlTemporal);
  }, [archivoImagen]);

  const limpiarFormulario = () => {
    setEditando(null);
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
  };

  const cargarProductos = async () => {
    try {
      setError("");

      const respuesta = await fetch(`${API_URL}/api/productos`);

      if (!respuesta.ok) {
        throw new Error("No se pudieron cargar los productos");
      }

      const datos = await respuesta.json();

      if (!Array.isArray(datos)) {
        throw new Error("La respuesta del catálogo no es válida");
      }

      setProductos(datos);
    } catch (err) {
      setError(err.message || "Error al cargar productos");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  useEffect(() => {
    if (!esAdmin) {
      limpiarFormulario();
    }
  }, [esAdmin]);

  const seleccionarImagen = (e) => {
    const archivo = e.target.files?.[0] || null;

    setError("");

    if (!archivo) {
      setArchivoImagen(null);
      return;
    }

    if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
      setError("Solo se permiten imágenes JPG, PNG o WEBP.");
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

  const iniciarEdicion = (producto) => {
    if (!esAdmin) return;

    setEditando(producto.id);
    setNombre(producto.nombre ?? "");
    setPrecio(String(producto.precio ?? ""));
    setCategoria(producto.categoria ?? "");
    setMarca(producto.marca ?? "");
    setModelo(producto.modelo ?? "");
    setDescripcion(producto.descripcion ?? "");
    setImagenUrl(producto.imagenUrl ?? "");
    setStock(String(producto.stock ?? 0));
    setArchivoImagen(null);
    setReiniciarArchivo((valor) => valor + 1);
    setImagenFallida(false);
    setMensaje("");
    setError("");
  };

  const cancelarEdicion = () => {
    limpiarFormulario();
  };

  const guardarCambios = async (e) => {
    e.preventDefault();

    if (!esAdmin) {
      setError("Debes iniciar sesión como administrador.");
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
        "Ingresa un nombre de 3 a 120 caracteres, una categoría y un precio válido."
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

    if (imagenUrl.length > 2048) {
      setError("La URL de la imagen es demasiado larga.");
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

    let datosActualizados = false;

    try {
      setProcesando(true);
      setError("");
      setMensaje("");

      // PASO 1: Actualizar los datos del producto.
      const respuesta = await fetch(
        `${API_URL}/api/productos/${editando}`,
        {
          method: "PUT",
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
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.mensaje || "Error al actualizar el producto"
        );
      }

      datosActualizados = true;

      // PASO 2: Si se seleccionó una fotografía nueva,
      // guardarla en PostgreSQL.
      if (archivoImagen) {
        const formularioImagen = new FormData();
        formularioImagen.append("imagen", archivoImagen);

        const respuestaImagen = await fetch(
          `${API_URL}/api/productos/${editando}/imagen`,
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
              "No se pudo actualizar la fotografía."
          );
        }

        setVersionImagen((valor) => valor + 1);
      }

      cancelarEdicion();
      await cargarProductos();

      setMensaje(
        archivoImagen
          ? "Producto y fotografía actualizados correctamente."
          : "Producto actualizado correctamente."
      );
    } catch (err) {
      if (datosActualizados) {
        setError(
          `Los datos del producto se actualizaron, pero hubo un problema con la fotografía: ${
            err.message || "Error desconocido"
          }`
        );
        await cargarProductos();
      } else {
        setError(err.message || "No se pudo actualizar el producto.");
      }
    } finally {
      setProcesando(false);
    }
  };

  const eliminarProducto = async (id) => {
    if (!esAdmin) {
      setError("Debes iniciar sesión como administrador.");
      return;
    }

    const confirmar = window.confirm(
      "¿Estás seguro de que deseas eliminar este producto?"
    );

    if (!confirmar) return;

    try {
      setProcesando(true);
      setError("");
      setMensaje("");

      const respuesta = await fetch(
        `${API_URL}/api/productos/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.mensaje || "Error al eliminar el producto"
        );
      }

      if (editando === id) {
        cancelarEdicion();
      }

      await cargarProductos();
      setMensaje("Producto eliminado correctamente.");
    } catch (err) {
      setError(err.message || "No se pudo eliminar el producto.");
    } finally {
      setProcesando(false);
    }
  };

  return (
    <section id="productos">
      <h2>Nuestros productos</h2>

      {esAdmin && (
        <p>Modo administrador: puedes editar y eliminar productos.</p>
      )}

      {cargando && <p>Cargando productos...</p>}

      {error && (
        <p style={{ color: "#ff4d6d" }} role="alert">
          {error}
        </p>
      )}

      {mensaje && (
        <p style={{ color: "#4ade80" }} role="status">
          {mensaje}
        </p>
      )}

      {!cargando && !error && productos.length === 0 && (
        <p>No hay productos registrados todavía.</p>
      )}

      {!cargando && productos.length > 0 && (
        <div className="lista-productos">
          {productos.map((producto) => (
            <div className="producto" key={producto.id}>
              {esAdmin && editando === producto.id ? (
                <form onSubmit={guardarCambios}>
                  <h3>Editar producto</h3>

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
                    aria-label="Categoría"
                    required
                  >
                    <option value="">Selecciona una categoría</option>
                    <option value="Motocicletas">Motocicletas</option>
                    <option value="Repuestos">Repuestos</option>
                    <option value="Accesorios">Accesorios</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Marca (Ej. Honda)"
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
                    placeholder="Stock disponible"
                    aria-label="Stock disponible"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    min="0"
                    step="1"
                    required
                  />

                  <textarea
                    placeholder="Descripción del producto"
                    aria-label="Descripción"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    maxLength={2000}
                    rows={4}
                  />

                  <div style={{ margin: "12px 0" }}>
                    <label
                      htmlFor="editar-fotografia-producto"
                      style={{
                        display: "block",
                        marginBottom: "8px",
                        fontWeight: "bold"
                      }}
                    >
                      Cambiar fotografía del producto
                    </label>

                    <input
                      key={reiniciarArchivo}
                      id="editar-fotografia-producto"
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                      onChange={seleccionarImagen}
                      disabled={procesando}
                      style={{ width: "100%" }}
                    />

                    <small>
                      JPG, PNG o WEBP. Máximo 5 MB.
                    </small>
                  </div>

                  {vistaPrevia && (
                    <div
                      style={{
                        margin: "12px 0",
                        textAlign: "center"
                      }}
                    >
                      <p>Vista previa de la nueva fotografía:</p>

                      <img
                        src={vistaPrevia}
                        alt="Vista previa de la fotografía"
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

                  <input
                    type="url"
                    placeholder="URL de imagen (opcional)"
                    aria-label="URL de la imagen"
                    value={imagenUrl}
                    onChange={(e) => {
                      setImagenUrl(e.target.value);
                      setImagenFallida(false);
                    }}
                    maxLength={2048}
                  />

                  {!archivoImagen &&
                    imagenUrl.trim() &&
                    !imagenFallida && (
                      <div
                        style={{
                          margin: "12px 0",
                          textAlign: "center"
                        }}
                      >
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

                  {!archivoImagen &&
                    imagenUrl.trim() &&
                    imagenFallida && (
                      <p style={{ color: "#ff4d6d" }}>
                        No se pudo cargar la imagen.
                      </p>
                    )}

                  <div className="acciones-producto">
                    <button type="submit" disabled={procesando}>
                      {procesando
                        ? "Guardando..."
                        : "Guardar cambios"}
                    </button>

                    <button
                      type="button"
                      onClick={cancelarEdicion}
                      disabled={procesando}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  {(producto.imagenTipo || producto.imagenUrl) && (
                    <img
                      src={obtenerImagenProducto(
                        producto,
                        versionImagen
                      )}
                      alt={producto.nombre}
                      loading="lazy"
                      style={{
                        width: "100%",
                        height: "200px",
                        objectFit: "contain",
                        borderRadius: "10px",
                        marginBottom: "12px"
                      }}
                    />
                  )}

                  <h3>{producto.nombre}</h3>

                  <p>
                    Categoría: {producto.categoria}
                  </p>

                  {producto.marca && (
                    <p>
                      <strong>Marca:</strong> {producto.marca}
                    </p>
                  )}

                  {producto.modelo && (
                    <p>
                      <strong>Modelo:</strong> {producto.modelo}
                    </p>
                  )}

                  {producto.descripcion && (
                    <p>{producto.descripcion}</p>
                  )}

                  <p>
                    <strong>
                      Precio: Bs.{" "}
                      {formatoPrecio.format(producto.precio)}
                    </strong>
                  </p>

                  <p>
                    <strong>Stock:</strong>{" "}
                    {producto.stock ?? 0} unidades
                  </p>

                  {producto.stock === 0 && (
                    <p style={{ color: "#ff4d6d" }}>
                      Sin stock disponible
                    </p>
                  )}

                  {esAdmin && (
                    <div className="acciones-producto">
                      <button
                        type="button"
                        onClick={() => iniciarEdicion(producto)}
                        disabled={procesando}
                      >
                        ✏️ Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => eliminarProducto(producto.id)}
                        disabled={procesando}
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default Productos;


const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const TIPOS_PERMITIDOS = {
  "image/jpeg": "image/jpeg",
  "image/png": "image/png",
  "image/webp": "image/webp",
};

const MAX_IMAGEN_BYTES = 5 * 1024 * 1024;

function detectarTipoImagen(buffer) {
  if (!Buffer.isBuffer(buffer)) return null;

  // JPEG
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }

  // PNG
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
    )
  ) {
    return "image/png";
  }

  // WEBP
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}

// Subir o reemplazar la imagen de un producto.
async function subirImagenProducto(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        mensaje: "El ID del producto no es válido.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        mensaje: "Debes seleccionar una imagen.",
      });
    }

    if (req.file.size > MAX_IMAGEN_BYTES) {
      return res.status(413).json({
        mensaje: "La imagen no puede superar los 5 MB.",
      });
    }

    const tipoDetectado = detectarTipoImagen(req.file.buffer);

    if (
      !tipoDetectado ||
      !TIPOS_PERMITIDOS[req.file.mimetype] ||
      tipoDetectado !== req.file.mimetype
    ) {
      return res.status(400).json({
        mensaje: "Solo se permiten imágenes JPG, PNG o WEBP válidas.",
      });
    }

    const producto = await prisma.producto.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!producto) {
      return res.status(404).json({
        mensaje: "Producto no encontrado.",
      });
    }

    await prisma.producto.update({
      where: { id },
      data: {
        imagen: req.file.buffer,
        imagenTipo: tipoDetectado,
      },
    });

    return res.status(200).json({
      mensaje: "Imagen guardada correctamente en PostgreSQL.",
      productoId: id,
      imagenUrl: `/api/productos/${id}/imagen`,
    });
  } catch (error) {
    console.error("Error al subir imagen:", error);

    return res.status(500).json({
      mensaje: "No se pudo guardar la imagen del producto.",
    });
  }
}

// Mostrar la imagen guardada en PostgreSQL.
async function obtenerImagenProducto(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        mensaje: "El ID del producto no es válido.",
      });
    }

    const producto = await prisma.producto.findUnique({
      where: { id },
      select: {
        imagen: true,
        imagenTipo: true,
      },
    });

    if (!producto || !producto.imagen || !producto.imagenTipo) {
      return res.status(404).json({
        mensaje: "Imagen no encontrada.",
      });
    }

    if (!TIPOS_PERMITIDOS[producto.imagenTipo]) {
      return res.status(415).json({
        mensaje: "Formato de imagen no admitido.",
      });
    }

    res.setHeader("Content-Type", producto.imagenTipo);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "no-store");

    return res.status(200).send(Buffer.from(producto.imagen));
  } catch (error) {
    console.error("Error al obtener imagen:", error);

    return res.status(500).json({
      mensaje: "No se pudo obtener la imagen del producto.",
    });
  }
}

module.exports = {
  subirImagenProducto,
  obtenerImagenProducto,
};


const multer = require("multer");

// Tamaño máximo permitido: 5 MB
const MAX_IMAGEN_BYTES = 5 * 1024 * 1024;

// Guardamos temporalmente la imagen en memoria.
// Después, el controlador la almacena en PostgreSQL.
const almacenamiento = multer.memoryStorage();

// Formatos de imagen permitidos.
const tiposPermitidos = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const uploadImagen = multer({
  storage: almacenamiento,

  limits: {
    fileSize: MAX_IMAGEN_BYTES,
    files: 1,
  },

  fileFilter: (req, file, callback) => {
    if (!tiposPermitidos.includes(file.mimetype)) {
      return callback(
        new Error("Solo se permiten imágenes JPG, PNG o WEBP.")
      );
    }

    callback(null, true);
  },
});

// Middleware para recibir una sola imagen.
// El nombre del campo debe ser "imagen".
function recibirImagenProducto(req, res, next) {
  uploadImagen.single("imagen")(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
          mensaje: "La imagen no puede superar los 5 MB.",
        });
      }

      return res.status(400).json({
        mensaje: "Error al recibir la imagen: " + error.message,
      });
    }

    if (error) {
      return res.status(400).json({
        mensaje: error.message,
      });
    }

    next();
  });
}

module.exports = {
  recibirImagenProducto,
};

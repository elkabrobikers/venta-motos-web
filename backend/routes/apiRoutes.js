
const express = require("express");
const router = express.Router();

const productosController = require("../controllers/productosController");
const authController = require("../controllers/authController");

// Controlador para guardar y mostrar imágenes en PostgreSQL
const imagenesController = require("../controllers/imagenesController");

// Middleware para recibir imágenes desde la computadora
const {
    recibirImagenProducto
} = require("../middlewares/uploadImagenMiddleware");

// Seguridad y permisos
const {
    verificarToken,
    permitirRoles
} = require("../middlewares/authMiddleware");

// ========================================
// INFORMACIÓN GENERAL DE LA API
// ========================================

router.get("/", (req, res) => {
    res.json({
        mensaje: "API funcionando correctamente",
        curso: "Tecnología Web II",
        estado: "activo"
    });
});

// ========================================
// AUTENTICACIÓN
// ========================================

router.post("/auth/registro", authController.registro);

router.post("/auth/login", authController.login);

// ========================================
// PRODUCTOS - CONSULTAS PÚBLICAS
// ========================================

router.get("/productos", productosController.listarProductos);

// Obtener la fotografía de un producto desde PostgreSQL
router.get(
    "/productos/:id/imagen",
    imagenesController.obtenerImagenProducto
);

router.get(
    "/productos/:id",
    productosController.obtenerProductoPorId
);

// ========================================
// PRODUCTOS - SOLO ADMINISTRADOR
// ========================================

router.post(
    "/productos",
    verificarToken,
    permitirRoles("admin"),
    productosController.registrarProducto
);

router.put(
    "/productos/:id",
    verificarToken,
    permitirRoles("admin"),
    productosController.actualizarProducto
);

router.delete(
    "/productos/:id",
    verificarToken,
    permitirRoles("admin"),
    productosController.eliminarProducto
);

// ========================================
// IMÁGENES - SOLO ADMINISTRADOR
// ========================================

// Recibir una fotografía desde la computadora
// y guardarla directamente en PostgreSQL.
router.post(
    "/productos/:id/imagen",
    verificarToken,
    permitirRoles("admin"),
    recibirImagenProducto,
    imagenesController.subirImagenProducto
);

module.exports = router;


const productosService = require("../services/productosService");

const validarId = (id) => {
    return Number.isSafeInteger(id) && id > 0;
};

const validarProducto = (datos) => {
    const {
        nombre,
        precio,
        categoria,
        marca = "",
        modelo = "",
        descripcion = "",
        imagenUrl = "",
        stock = 0
    } = datos;

    if (
        typeof nombre !== "string" ||
        nombre.trim().length < 3 ||
        nombre.trim().length > 120
    ) {
        return "El nombre debe tener entre 3 y 120 caracteres";
    }

    if (
        typeof precio !== "number" ||
        !Number.isFinite(precio) ||
        precio <= 0
    ) {
        return "El precio debe ser un número positivo";
    }

    if (
        typeof categoria !== "string" ||
        categoria.trim() === ""
    ) {
        return "La categoría es obligatoria";
    }

    if (
        typeof marca !== "string" ||
        marca.length > 100
    ) {
        return "La marca debe tener máximo 100 caracteres";
    }

    if (
        typeof modelo !== "string" ||
        modelo.length > 100
    ) {
        return "El modelo debe tener máximo 100 caracteres";
    }

    if (
        typeof descripcion !== "string" ||
        descripcion.length > 2000
    ) {
        return "La descripción debe tener máximo 2000 caracteres";
    }

    if (typeof imagenUrl !== "string" || imagenUrl.length > 2048) {
        return "La URL de la imagen no es válida";
    }

    if (imagenUrl.trim() !== "") {
        try {
            const url = new URL(imagenUrl.trim());

            if (!["https:", "http:"].includes(url.protocol)) {
                return "La imagen debe utilizar una URL HTTP o HTTPS";
            }
        } catch {
            return "La URL de la imagen no es válida";
        }
    }

    if (
        !Number.isSafeInteger(stock) ||
        stock < 0
    ) {
        return "El stock debe ser un número entero mayor o igual a cero";
    }

    return null;
};

const prepararProducto = (datos) => {
    return {
        nombre: datos.nombre.trim(),
        precio: datos.precio,
        categoria: datos.categoria.trim(),
        marca: (datos.marca ?? "").trim(),
        modelo: (datos.modelo ?? "").trim(),
        descripcion: (datos.descripcion ?? "").trim(),
        imagenUrl: (datos.imagenUrl ?? "").trim(),
        stock: datos.stock ?? 0
    };
};

const manejarError = (error, res) => {
    console.error("Error en productos:", error);

    return res.status(500).json({
        mensaje: "Error interno del servidor"
    });
};

const listarProductos = async (req, res) => {
    try {
        const productos = await productosService.listarProductos();

        return res.status(200).json(productos);
    } catch (error) {
        return manejarError(error, res);
    }
};

const obtenerProductoPorId = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!validarId(id)) {
            return res.status(400).json({
                mensaje: "El ID debe ser un número entero positivo"
            });
        }

        const producto = await productosService.obtenerProductoPorId(id);

        if (!producto) {
            return res.status(404).json({
                mensaje: "Producto no encontrado"
            });
        }

        return res.status(200).json(producto);
    } catch (error) {
        return manejarError(error, res);
    }
};

const registrarProducto = async (req, res) => {
    try {
        const datos = req.body || {};
        const errorValidacion = validarProducto(datos);

        if (errorValidacion) {
            return res.status(400).json({
                mensaje: errorValidacion
            });
        }

        const nuevoProducto = await productosService.registrarProducto(
            prepararProducto(datos)
        );

        return res.status(201).json({
            mensaje: "Producto registrado correctamente",
            producto: nuevoProducto
        });
    } catch (error) {
        return manejarError(error, res);
    }
};

const actualizarProducto = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const datos = req.body || {};

        if (!validarId(id)) {
            return res.status(400).json({
                mensaje: "El ID debe ser un número entero positivo"
            });
        }

        const errorValidacion = validarProducto(datos);

        if (errorValidacion) {
            return res.status(400).json({
                mensaje: errorValidacion
            });
        }

        const productoActualizado =
            await productosService.actualizarProducto(
                id,
                prepararProducto(datos)
            );

        if (!productoActualizado) {
            return res.status(404).json({
                mensaje: "Producto no encontrado"
            });
        }

        return res.status(200).json({
            mensaje: "Producto actualizado correctamente",
            producto: productoActualizado
        });
    } catch (error) {
        if (error.code === "P2025") {
            return res.status(404).json({
                mensaje: "Producto no encontrado"
            });
        }

        return manejarError(error, res);
    }
};

const eliminarProducto = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!validarId(id)) {
            return res.status(400).json({
                mensaje: "El ID debe ser un número entero positivo"
            });
        }

        const productoEliminado =
            await productosService.eliminarProducto(id);

        if (!productoEliminado) {
            return res.status(404).json({
                mensaje: "Producto no encontrado"
            });
        }

        return res.status(200).json({
            mensaje: "Producto eliminado correctamente",
            producto: productoEliminado
        });
    } catch (error) {
        if (error.code === "P2025") {
            return res.status(404).json({
                mensaje: "Producto no encontrado"
            });
        }

        return manejarError(error, res);
    }
};

module.exports = {
    listarProductos,
    obtenerProductoPorId,
    registrarProducto,
    actualizarProducto,
    eliminarProducto
};

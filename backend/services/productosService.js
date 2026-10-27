
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// ========================================
// CAMPOS QUE SE DEVUELVEN EN LAS RESPUESTAS
// ========================================

// No incluimos "imagen" porque contiene los bytes
// de la fotografía guardada en PostgreSQL.
const camposProducto = {
    id: true,
    nombre: true,
    precio: true,
    categoria: true,
    marca: true,
    modelo: true,
    descripcion: true,
    imagenUrl: true,
    stock: true,
    imagenTipo: true
};

// ========================================
// LISTAR TODOS LOS PRODUCTOS
// ========================================

const listarProductos = async () => {
    return await prisma.producto.findMany({
        select: camposProducto,
        orderBy: {
            id: "asc"
        }
    });
};

// ========================================
// BUSCAR PRODUCTO POR ID
// ========================================

const obtenerProductoPorId = async (id) => {
    return await prisma.producto.findUnique({
        where: {
            id: Number(id)
        },
        select: camposProducto
    });
};

// ========================================
// PREPARAR DATOS DEL PRODUCTO
// ========================================

const prepararDatosProducto = (datos) => {
    return {
        nombre: datos.nombre,
        precio: Number(datos.precio),
        categoria: datos.categoria,
        marca: datos.marca ?? "",
        modelo: datos.modelo ?? "",
        descripcion: datos.descripcion ?? "",
        imagenUrl: datos.imagenUrl ?? "",
        stock: datos.stock ?? 0
    };
};

// ========================================
// REGISTRAR PRODUCTO
// ========================================

const registrarProducto = async (datos) => {
    return await prisma.producto.create({
        data: prepararDatosProducto(datos),
        select: camposProducto
    });
};

// ========================================
// ACTUALIZAR PRODUCTO
// ========================================

const actualizarProducto = async (id, datos) => {
    const producto = await obtenerProductoPorId(id);

    if (!producto) {
        return null;
    }

    return await prisma.producto.update({
        where: {
            id: Number(id)
        },
        data: prepararDatosProducto(datos),
        select: camposProducto
    });
};

// ========================================
// ELIMINAR PRODUCTO
// ========================================

const eliminarProducto = async (id) => {
    const producto = await obtenerProductoPorId(id);

    if (!producto) {
        return null;
    }

    return await prisma.producto.delete({
        where: {
            id: Number(id)
        },
        select: camposProducto
    });
};

// ========================================
// EXPORTAR FUNCIONES
// ========================================

module.exports = {
    listarProductos,
    obtenerProductoPorId,
    registrarProducto,
    actualizarProducto,
    eliminarProducto
};

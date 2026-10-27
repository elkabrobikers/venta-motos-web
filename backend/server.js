
require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");

const apiRoutes = require("./routes/apiRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.JWT_SECRET || !process.env.JWT_SECRET.trim()) {
    console.error("Error: JWT_SECRET no está configurada");
    process.exit(1);
}

app.disable("x-powered-by");

app.use(helmet());

app.use(cors({
    origin: [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "https://venta-motos-web.onrender.com",
        "https://moto-store-frontend-gustavo.onrender.com"
    ]
}));

app.use(express.json({
    limit: "100kb"
}));

app.get("/", (req, res) => {
    res.send("Bienvenido al Sistema Web de Venta de Motos, Repuestos y Accesorios");
});

app.get("/info", (req, res) => {
    res.send("Sistema especializado en la comercialización de motocicletas de diversas cilindradas, repuestos originales y accesorios de seguridad.");
});

app.get("/contacto", (req, res) => {
    res.send("Correo: contacto@ventademotosweb.com | Teléfono: +591 4-4000000");
});

app.get("/motos", (req, res) => {
    res.send("Módulo de gestión y catálogo de motocicletas, repuestos y accesorios.");
});

app.use("/api", apiRoutes);

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
    });
}

module.exports = app;

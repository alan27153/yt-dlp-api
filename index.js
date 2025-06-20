const express = require("express");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware para recibir JSON
app.use(express.json());

// Servir archivos estáticos (videos descargados)
app.use("/public", express.static(path.join(__dirname, "public")));

// Ruta para mostrar la interfaz HTML
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

// Ruta para descargar video
app.post("/api/download", (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ success: false, error: "No se proporcionó la URL" });
  }

  const id = Date.now(); // Nombre único basado en la hora
  const output = `public/${id}.%(ext)s`;
  const command = `"./yt-dlp.exe" -o "${output}" "${url}"`; // Usamos el yt-dlp.exe local

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error("Error al ejecutar yt-dlp:", stderr);
      return res.status(500).json({ success: false, error: "Error al descargar el video" });
    }

    // Buscar archivo descargado
    fs.readdir("public", (err, files) => {
      if (err) {
        return res.status(500).json({ success: false, error: "No se pudo listar archivos" });
      }

      const file = files.find(f => f.startsWith(`${id}.`));
      if (!file) {
        return res.status(404).json({ success: false, error: "Archivo no encontrado" });
      }

      return res.json({
        success: true,
        file,
        downloadUrl: `/public/${file}`
      });
    });
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});

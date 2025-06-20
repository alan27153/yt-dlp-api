const express = require("express");
const { execFile } = require("child_process");
const ytdlp = require("yt-dlp-exec");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));
app.use(express.json());

// Crear carpeta de videos si no existe
const videosDir = path.join(__dirname, "videos");
if (!fs.existsSync(videosDir)) {
  fs.mkdirSync(videosDir);
}

// Ruta para interfaz
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Ruta API de descarga
app.post("/api/download", async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ success: false, error: "No se proporcionó la URL" });
  }

  try {
    const uniqueId = Date.now();
    const outputTemplate = path.join(videosDir, `video_${uniqueId}.%(ext)s`);

    // Ejecutar yt-dlp sin opciones que requieren ffmpeg
    await ytdlp(url, {
      output: outputTemplate,
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
      format: "mp4", // formato sencillo, evita usar `bestvideo+bestaudio`
    });

    // Buscar el archivo descargado
    const files = fs.readdirSync(videosDir).filter(f => f.includes(`video_${uniqueId}`));
    if (files.length === 0) {
      return res.status(500).json({ success: false, error: "No se encontró el archivo descargado" });
    }

    const filename = files[0];
    const filepath = path.join(videosDir, filename);

    return res.json({
      success: true,
      filename,
      download_url: `/videos/${filename}`
    });
  } catch (err) {
    console.error("Error al descargar:", err);
    return res.status(500).json({ success: false, error: "Falló la descarga", detalle: err.message });
  }
});

// Servir los videos
app.use("/videos", express.static(path.join(__dirname, "videos")));

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor en ejecución en http://localhost:${PORT}`);
});

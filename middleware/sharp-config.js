const sharp = require("sharp");
const fs = require("fs");

const imageConversion = (req, res, next) => {
  // Vérifie si un fichier est téléchargé
  if (!req.file) {
    return next();
  }

  // met le nom de fichier à jour avant utilisation de sharp
  req.file.filename = req.file.filename.replace(/\.(jpg|jpeg|png)$/, ".webp");

  // Construit le chemin complet où le fichier sera enregistré.
  const newFilePath = `images/${req.file.filename}`;

  sharp(req.file.path)
    .resize({
      width: 206,
      height: 260,
      fit: "cover",
    })
    .toFormat("webp", { quality: 90 })
    .toFile(newFilePath) // Utilise le nouveau chemin de fichier
    .then(() => {
      // Supprime le fichier d'origine après la conversion en WebP
      fs.unlink(req.file.path, (err) => {
        if (err) {
          console.error("Error deleting original file:", err);
        }
        next();
      });
    })
    .catch((error) => {
      console.error("Image processing error:", error);
      next();
    });
};

module.exports = imageConversion;

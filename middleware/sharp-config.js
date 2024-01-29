const sharp = require('sharp');
const fs = require('fs');

const imageConversion = (req, res, next) => {
  // Vérifie si un fichier est téléchargé
  if (!req.file) {
    return next();
  }

  // Utilisation de sharp pour redimensionner et convertir en WebP
  sharp(req.file.path)
    .toFormat('webp', { quality: 90 })
    .toFile('images/' + req.file.filename.replace(/\.(jpg|jpeg|png)$/, '.webp'))
    // Une fois que ces opérations sont terminées, on exécute le .then
    .then(() => {
      // Modification du nom de fichier avec l'extension WebP
      req.file.filename = req.file.filename.replace(/\.(jpg|jpeg|png)$/, '.webp');

      // Supprimer le fichier d'origine après la conversion en WebP
      fs.unlink(req.file.path, (err) => {
        if (err) {
          console.error('Error deleting original file:', err);
        }
        next();
      });
    })
    .catch((error) => {
      console.error('Image processing error:', error);
      next();
    });
};

module.exports = imageConversion;
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const MIME_TYPES = {
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, 'images');
  },
  filename: (req, file, callback) => {
    const name = file.originalname.split(' ').join('_').split('.')[0];
    const extension = MIME_TYPES[file.mimetype];
    callback(null, `${name}_${Date.now()}.${extension}`);
  },
});

const fileFilter = (req, file, callback) => {
  if (MIME_TYPES[file.mimetype]) {
    callback(null, true);
  } else {
    callback(new Error('Format de fichier non autorisé.'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter,
}).single('image');

const multerSharp = (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) {
      return res
        .status(400)
        .json({ error: err.message || 'Erreur lors de l’envoi du fichier.' });
    }

    if (!req.file) {
      return next();
    }

    try {
      const inputPath = req.file.path;
      const outputFilename = `${req.file.filename.split('.')[0]}.webp`;
      const outputPath = path.join('images', outputFilename);

      await sharp(inputPath)
        .resize({ width: 500 })
        .webp({ quality: 70 })
        .toFile(outputPath);

      fs.unlinkSync(inputPath);

      req.file.filename = outputFilename;
      req.file.path = outputPath;

      next();
    } catch (error) {
      console.error('Erreur de traitement Sharp :', error);
      return res
        .status(500)
        .json({ error: 'Erreur lors de l’optimisation de l’image.' });
    }
  });
};

module.exports = multerSharp;

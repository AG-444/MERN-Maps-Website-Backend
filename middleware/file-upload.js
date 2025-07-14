const multer = require('multer');
const { storage } = require('./cloudinary-config');

const fileUpload = multer({ storage });

module.exports = fileUpload;

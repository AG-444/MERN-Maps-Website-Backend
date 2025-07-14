// middleware/cloudinary-config.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'Lenscape', // name of the folder in your Cloudinary media library
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'gif', 'svg'],
  },
});

module.exports = {
  cloudinary,
  storage,
};

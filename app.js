const fs = require('fs');
const path = require('path');

require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');

const placesRoutes = require('./routes/places-routes');
const usersRoutes = require('./routes/users-routes');
const HttpError = require('./models/http-error');

const app = express();

app.use(bodyParser.json());

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'PATCH', 'OPTIONS', 'PUT'],
}));

app.use('/api/places', placesRoutes); 
app.use('/api/users', usersRoutes);

app.use((req, res, next) => {
  const error = new HttpError('Could not find this route.', 404);
  throw error;
});

app.use((error, req, res, next) => {
  // Only attempt to unlink local files (not needed for Cloudinary)
  if (req.file && req.file.path && req.file.path.startsWith('uploads')) {
    fs.unlink(req.file.path, (err) => {
      console.log(err);
    });
  }

  if (res.headerSent) {
    return next(error);
  }

  res.status(error.code || 500);
  res.json({ message: error.message || 'An unknown error occurred!' });
});

mongoose
  .connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@ac-qvstyix.7jhaea5.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority&appName=Lenscape-users`)
  .then(() => {
    app.listen(process.env.PORT || 5000);
  })
  .catch(err => {
    console.log(err);
  });

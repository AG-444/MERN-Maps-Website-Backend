const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const placesRoutes = require('./routes/places-routes');
const usersRoutes = require('./routes/users-routes');
const HttpError = require('./models/http-error');

const app = express();

app.use(bodyParser.json());

app.use('/api/places', placesRoutes); 
app.use('/api/users', usersRoutes);

app.use((req, res, next) => {
  const error = new HttpError('Could not find this route.', 404);
  throw error;
});

app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500)
  res.json({message: error.message || 'An unknown error occurred!'});
});

mongoose
  .connect('mongodb://Adi4:LAMPER1234@ac-qvstyix-shard-00-00.7jhaea5.mongodb.net:27017,ac-qvstyix-shard-00-01.7jhaea5.mongodb.net:27017,ac-qvstyix-shard-00-02.7jhaea5.mongodb.net:27017/places?ssl=true&replicaSet=atlas-tfk6bm-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Lenscape-users')
  .then(()=>{
    app.listen(5000);
  })
  .catch(err=>{
    console.log(err);
  });

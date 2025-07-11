const { v4: uuidv4 } = require('uuid');
const {validationResult} = require('express-validator');
const mongoose = require('mongoose');


const HttpError = require('../models/http-error');
const getCoordsForAddress = require('../util/location');
const Place = require('../models/place');
const User = require('../models/user');

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid; 
  let place;
  try{
    place = await Place.findById(placeId);
  } catch (err){
    const error = new HttpError('Couldnt find place by ID',500);
    return next(error);
  }


  if (!place) {
    const error = new HttpError('Could not find a place for the provided id.', 404);
    return next(error);
  }

  res.json({ place: place.toObject({ getters: true }) }); 
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;
  
  let userWithPlaces;
  try{
    userWithPlaces = await User.findById(userId).populate('places');
  } catch (err){
    const error = new HttpError('Couldnt find place by user ID',500);
    return next(error);
  }


  if (!userWithPlaces || userWithPlaces.places.length===0){
    return next(
      new HttpError('Could not find any place for the provided user id.', 404)
    );
  }

  res.json({ places: userWithPlaces.places.map(place => place.toObject({ getters:true })) });
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    console.log(errors);
    res.status(422);
    return next( new HttpError('Invalid inputs passed',422));
  }

  const { title, description, address, creator } = req.body;

  let coordinates;
  try{
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    return next(error);
  }

  const createdPlace = new Place({
    title,
    description,
    address,
    location :coordinates,
    image: 'https://www.guilinphotographytour.com/uploads/2/1/2/0/21205284/header_images/1436732098.jpg',
    creator
  });

  let user;

  try{
    user = await User.findById(creator);

  } catch (err) {
    const error = new HttpError('Creating place failed, please try again',500);
    return next(error);
  }

  if(!user){
    const error = new HttpError('Could not find user for provided Id',404);
    return next(error);
  }

  console.log(user);

  try{
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({session:sess});  
    user.places.push(createdPlace);
    await user.save({session: sess});
    await sess.commitTransaction();

  } catch (err) {
    const error = new HttpError('Creating place failed',500);
    return next(error);
  }


  res.status(201).json({ place: createdPlace });
};

const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    console.log(errors);
    res.status(422);
    return next( new HttpError('Invalid inputs passed',422));
  }

  const { title, description } = req.body;
  const placeId = req.params.pid;

  let place;
  try{
    place = await Place.findById(placeId);
  } catch (err){
    const error = new HttpError('Updating place failed',500);
    return next(error);
  }


  place.title = title;
  place.description = description;

  try{
    await place.save();
  }catch(err){
    const error = new HttpError('could not save updated place',500);
    return next(error);
  }


  res.status(200).json({place : place.toObject({ getters: true })});
};

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId).populate('creator');
    console.log("Place found:", place);
    console.log("Creator populated:", place?.creator);
  } catch (err) {
    const error = new HttpError('Could not find place with that Id', 500);
    return next(error);
  }

  if (!place || !place.creator) {
    const error = new HttpError("Could not find place or user for this ID", 404);
    console.log(error);
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    
    // Delete the place document
    await place.deleteOne({ session: sess });

    // Remove the place reference from the user's places array
    place.creator.places.pull(place._id);
    await place.creator.save({ session: sess });

    await sess.commitTransaction();
  } catch (err) {
    console.log(err);
    const error = new HttpError('Could not delete place--test', 500);
    return next(error);
  }

  res.status(200).json({ message: 'Deleted place.' });
};


exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;

const { v4: uuidv4 } = require('uuid');
const {validationResult} = require('express-validator');


const HttpError = require('../models/http-error');
const getCoordsForAddress = require('../util/location');
const Place = require('../models/place');

let DUMMY_PLACES = [
  {
    id: 'p1',
    title: 'Empire State Building',
    description: 'One of the most famous sky scrapers in the world!',
    location: {
      lat: 40.7484474,
      lng: -73.9871516
    },
    address: '20 W 34th St, New York, NY 10001',
    creator: 'u1'
  }
];

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid; // { pid: 'p1' }
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

  res.json({ place: place.toObject({ getters: true }) }); // => { place } => { place: place }
};

// function getPlaceById() { ... }
// const getPlaceById = function() { ... }

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;
  
  let places;
  try{
    places = await Place.find({ creator: userId });
  } catch (err){
    const error = new HttpError('Couldnt find place by user ID',500);
    return next(error);
  }


  if (!places || places.length===0){
    return next(
      new HttpError('Could not find any place for the provided user id.', 404)
    );
  }

  res.json({ places: places.map(place => place.toObject({ getters:true })) });
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

  try{
    await createdPlace.save();
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
  try{
    place = await Place.findById(placeId);
    console.log(place);
  }catch(err){
    const error = new HttpError('Could not find place with that Id',500);
    return next(error);
  }

  try{
    await Place.findByIdAndDelete(placeId);
  }catch(err){
    const error = new HttpError('Could not delete place',500);
    return next(error);
  }

  res.status(200).json({ message: 'Deleted place.' });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;

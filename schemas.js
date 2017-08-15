'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var SpotSchema = new Schema({
  sector_id: String,
  lat: Number,
  lon: Number,
  status: String
});

var LocationSchema = new Schema({
  address: String,
  loc_id: String, //separate from auto-generated _id
  name: String
});

var CarSchema = new Schema({
  name: String,
  vin: String,
  year: Number,
  make: String,
  model: String,
  length: {
    type: Number,
    default: 4.4 //Default car length
  }
});

var Location = mongoose.model('Location', LocationSchema);
var Car = mongoose.model('Car', CarSchema);

var UserSchema = new Schema({
  phone: Number,
  access_token: String,
  token_timestamp: Number,
  pin: Number,
  pin_timestamp: Number,
  name: String,
  locations: [LocationSchema],
  cars: [CarSchema]
});

module.exports = mongoose.model('Spots', SpotSchema);
module.exports = mongoose.model('Users', UserSchema);
module.exports = Car;
module.exports = Location;

/* Copyright © 2017 Avi Glozman and Terrance Li */

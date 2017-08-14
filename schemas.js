'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var LocationSchema = new Schema({
  address: String,
  location_id: String,
  location_name: String
});

var CarSchema = new Schema({
  name: String,
  vin: String,
  year: Number,
  make: String,
  model: String,
  length: {
    type: Number,
    default: 4.4
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
  locations: [
    {
      type: Schema.Types.ObjectId,
      ref: Location,
      default: null
    }
  ],
  cars: [
    {
      type: Schema.Types.ObjectId,
      ref: Car,
      default: null
    }
  ]
});

module.exports = mongoose.model('Users', UserSchema);
module.exports = Car;
module.exports = Location;

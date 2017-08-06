'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var LocationSchema = new Schema({
  user_id: {
    type: Number
  },
  address: {
    type: String
  },
  location_id: {
    type: String
  }
});

var CarSchema = new Schema({
  user_id: {
    type: Number
  },
  car_name: {
    type: String,
    default: "My Car"
  },
  car_vin: {
    type: String,
    default: "My VIN"
  },
  car_make:{
    type: String,
    default: "My make"
  },
  car_model:{
    type: String,
    default: "My Model"
  },
  car_length:{
    type: Number,
    default: 3
  }
});

module.exports = mongoose.model('AspaceLocations', LocationSchema);
module.exports = mongoose.model('AspaceCars', CarSchema);

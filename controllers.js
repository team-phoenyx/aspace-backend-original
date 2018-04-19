'use strict';
//dependencies
const colors = require("colors/safe");
const request = require("request-promise");
const hat = require("hat");

//mongodb stuff
const models = require("./schemas.js");
const mongoose = require("mongoose"),
  Car = mongoose.model('Car'),
  Location = mongoose.model('Location'),
  User = mongoose.model('Users'),
  Spot = mongoose.model('Spots');

//TWILIO stuff
const accountSid = '';
const authToken = '';
const phoneNumber = '';
const twilio = require('twilio')(accountSid, authToken);

exports.SpotsSingle = function(req, res) {
  if (req.body.spot_id == null) {
    res.json({"resp_code": "1", "resp_msg": "Invalid/empty parameters"});
    return;
  }

  Spot.findOne({_id: req.body.spot_id}, function (err, spot) {
    if (err || spot == null) res.json({"resp_code": "1", "resp_msg": "Spots.findOne failed: " + err});
    else {
      res.json(spot);
    }
  });
};

exports.SpotsOnscreen = function(req, res) {
  if (req.body.upper_lat == null || req.body.lower_lat == null || req.body.upper_lon == null || req.body.lower_lon == null) {
    res.json({"resp_code": "1", "resp_msg": "Invalid/empty parameters"});
    return;
  }

  Spot.find({lat: {$gte: req.body.lower_lat, $lte: req.body.upper_lat}, lon: {$gte: req.body.lower_lon, $lte: req.body.upper_lon}}, function (err, spots) {
    if (err || spots == null) res.json({"resp_code": "1", "resp_msg": "Spots.find failed: " + err});
    else {
      res.json(spots);
    }
  });
};

exports.SpotsStatus = function(req, res) {
  if (req.body.status == null || req.body.spot_id == null) {
    res.json({"resp_code": "1", "resp_msg": "Invalid/empty parameters"});
    return;
  }

  Spot.update({_id: req.body.spot_id}, {status: req.body.status}, function (err, count, status) {
    if (err) res.json({"resp_code": "1", "resp_msg": "Spots.update failed: " + err});
    else {
      res.json({"resp_code": "100"});
    }
  });
};

exports.SpotsAdd = function(req, res) {
  if (req.body.lat == null || req.body.lon == null) {
    res.json({"resp_code": "1", "resp_msg": "Invalid/empty parameters"});
    return;
  }

  var newSpot = new Spot({status: (req.body.status ? req.body.status : "F"), lat: req.body.lat, lon: req.body.lon, sector_id: req.body.sector_id});
  newSpot.save(function (err, spot) {
    if (err) res.json({"resp_code": "1", "resp_msg": "Spot.save failed: " + err});
    else res.json({"resp_code": "100"});
  });
}

exports.SpotsGetAll = function(req, res) {
  Spot.find({}, function (err, spots) {
    if (err || spots == null) res.json({"resp_code": "1", "resp_msg": "Spots.find failed: " + err});
    else {
      res.json(spots);
    }
  });
}

//AUTHENTICATION ENDPOINTS
exports.AuthPin = function(req, res) {
  if (req.body.phone == null || req.body.phone == "") {
    res.json({"resp_code": "1", "resp_msg": "Invalid/empty parameters"});
    return;
  }
  User.find({phone: req.body.phone}, function(err, user) {
    if (err || user == null) res.json({"resp_code": "1", "resp_msg": "User.find failed: " + err});
    else {
      var randomPin = Math.floor(1000 + Math.random() * 9000);
      var date = Math.floor((new Date).getTime() / 1000);
      if (user.length == 1) { //returning user
        User.update({phone: req.body.phone}, {pin: randomPin, pin_timestamp: date}, function (err, count, status) {
          if (err) res.json({"resp_code": "1", "resp_msg": "User.update failed: " + err});
          else {
            sendText(req.body.phone, randomPin);
            res.json({"resp_code" : "100"});
          }
        });
      } else if (user.length == 0) { //new user
        var newUser = new User({pin: randomPin, pin_timestamp: date, phone: req.body.phone});
        newUser.save(function (err, user) {
          if (err) res.json({"resp_code": "1", "resp_msg": "User.save failed: " + err});
          else {
            sendText(req.body.phone, randomPin);
            res.json({"resp_code" : "100"});
          }
        });
      } else res.json({"resp_code": "1", "resp_msg": "CRITICAL: More than a single user with this phone"}); //more than a single user w/ a phone number; should never happen
    }
  });
};

exports.AuthVerify = function(req, res) {
  if (req.body.phone == null || req.body.phone == "") {
    res.json({"resp_code" : "1", "resp_msg": "Invalid/empty parameters"});
    return;
  }
  User.findOne({phone: req.body.phone}, function (err, user) {
    if (err || user == null) res.json({"resp_code" : "1", "resp_msg": "User.findOne failed: " + err});
    else {
      var date = Math.floor((new Date).getTime() / 1000);
      if (date - user.pin_timestamp < 120) {
        if (user.pin != req.body.pin){
          res.json({"resp_code" : "2"});
        } else if (user.pin == req.body.pin) {
          var token = hat();

          User.update({phone: req.body.phone, pin: req.body.pin}, {access_token: token, token_timestamp: date}, function (err, count, status) {
            if (err) res.json({"resp_code": "1", "resp_msg": "User.update failed: " + err});
            else {
              User.findOne({phone: req.body.phone, pin: req.body.pin}, function (err, user) {
                if (err || user == null) res.json({"resp_code": "1", "resp_msg": "User.findOne failed: " + err});
                else {
                  res.json({access_token : user.access_token, user_id : user._id, resp_code : (user.name == null ? "101" : "102")});
                }
              });
            }
          });
        }
      }
      else if (date - user.pin_timestamp >= 120) {
          res.json({"resp_code" : "3"});
      }
    }
  });
};

exports.AuthReauth = function (req, res) {
  if (req.body.phone == null || req.body.user_id == null || req.body.access_token == null) {
    res.json({"resp_code" : "1", "resp_msg": "Invalid/empty parameters"});
    return;
  }

  User.find({phone: req.body.phone, _id: req.body.user_id, access_token: req.body.access_token}, function (err, users) {
    if (err || users == null) res.json({"resp_code" : "1", "resp_msg": "User.find failed: " + err});
    else {
      if (users.length == 1) {
        var date = Math.floor((new Date).getTime() / 1000);

        if ((date - users[0].token_timestamp) <= 7776000) res.json({"resp_code" : "100"});
        else res.json({"resp_code" : "4"});

      } else if (users.length == 0) {
        res.json({"resp_code" : "5"});
      } else res.json({"resp_code" : "1", "resp_msg": "CRITICAL: More than one user with this phone"});
    }
  });
};

//PROFILE ENDPOINTS
exports.ProfileUpdate = function(req, res) {
  if (req.body.phone == null || req.body.user_id == null || req.body.access_token == null || req.body.name == null) {
    res.json({"resp_code" : "1", "resp_msg": "Invalid/empty parameters"});
    return;
  }

  User.update({_id: req.body.user_id, access_token: req.body.access_token, phone: req.body.phone}, {name: req.body.name}, function (err, count, status) {
    res.json({"resp_code": (err ? "6" : "100")});
  });
};

exports.ProfileGet = function(req, res) {
  if (req.body.phone == null || req.body.user_id == null || req.body.access_token == null) {
    res.json({"resp_code": "1", "resp_msg": "Invalid/empty parameters"});
    return;
  }

  User.findOne({_id: req.body.user_id, access_token: req.body.access_token, phone: req.body.phone}, function(err, user) {
    if (err || user == null) res.json({"resp_code": "7"});
    else {
      res.json({"name": user.name ? user.name : "", "cars": user.cars, "locs": user.locations});
    }
  });
};

//Cars
exports.CarsAdd = function(req, res) {
  if (req.body.phone == null || req.body.user_id == null || req.body.access_token == null
    || req.body.car_name == null || req.body.car_make == null || req.body.car_year == null || req.body.car_model == null || req.body.car_length == null) {
    res.json({"resp_code": "1", "resp_msg": "Invalid/empty parameters"});
    return;
  }

  User.findOne({_id: req.body.user_id, access_token: req.body.access_token, phone: req.body.phone}, function (err, user) {
    if (err || user == null) res.json({"resp_code": "1", "resp_msg": "User.findOne failed: " + err});
    else {
      var cars = user.cars
      if (req.body.car_vin != "" && req.body.car_vin != null) { //if vin is provided, check for duplicate VINs
        for (var i = 0; i < cars.length; i++) {
          if (cars[i].vin == req.body.car_vin) {
            res.json({"resp_code": "8"});
            return; //DUPLICATE CARS
          }
        }
      }
      var newCar = new Car({
        name: req.body.car_name,
        vin: req.body.car_vin,
        year: req.body.car_year,
        make: req.body.car_make,
        model: req.body.car_model,
        length: req.body.car_length
      });
      cars.push(newCar);

      User.update({_id: req.body.user_id, access_token: req.body.access_token, phone: req.body.phone}, {cars: cars}, function (err, count, status) {
        if (err) res.json({"resp_code": "1", "resp_msg": "User.update failed: " + err});
        else res.json({"resp_code": "100"});
      });
    }
  });
};

exports.CarsRemove = function(req, res) {
  if (req.body.phone == null || req.body.user_id == null || req.body.access_token == null || req.body.car_id == null) {
    res.json({"resp_code": "1", "resp_msg": "Invalid/empty parameters"});
    return;
  }

  User.findOne({_id: req.body.user_id, access_token: req.body.access_token, phone: req.body.phone}, function (err, user) {
    if (err || user == null) res.json({"resp_code" : "1", "resp_msg": "User.findOne failed: " + err});
    else {
      var cars = user.cars;
      var deleted = false;
      for (var i = 0; i < cars.length; i++) {
        if (cars[i]._id == req.body.car_id) {
          cars.splice(i, 1);
          deleted = true;
          break;
        }
      }

      if (!deleted) { //car to delete wasn't found
        res.json({"resp_code": "1", "resp_msg": "Car to delete not found"});
        return;
      }

      User.update({_id: req.body.user_id, access_token: req.body.access_token, phone: req.body.phone}, {cars: cars}, function (err, count, status) {
        if (err) res.json({"resp_code": "1", "resp_msg": "User.update failed: " + err});
        else res.json({"resp_code": "100"});
      });
    }
  });
};

exports.CarsUpdate = function(req, res) {
  if (req.body.phone == null || req.body.user_id == null || req.body.access_token == null || req.body.car_name == null || req.body.car_make == null || req.body.car_year == null || req.body.car_model == null || req.body.car_length == null || req.body.car_id == null) {
    res.json({"resp_code": "1", "resp_msg": "Invalid/empty parameters"});
    return;
  }

  User.findOne({_id: req.body.user_id, access_token: req.body.access_token, phone: req.body.phone}, function (err, user) {
    if (err || user == null) res.json({"resp_code": "1", "resp_msg": "User.findOne failed: " + err});
    else {
      var cars = user.cars;

      for (var i = 0; i < cars.length; i++) {
        if (cars[i]._id == req.body.car_id) {
          cars[i].name = req.body.car_name;
          cars[i].vin = req.body.car_vin;
          cars[i].year = req.body.car_year;
          cars[i].make = req.body.car_make;
          cars[i].model = req.body.car_model;
          cars[i].length = req.body.car_length;
          break;
        }
      }

      User.update({_id: req.body.user_id, access_token: req.body.access_token, phone: req.body.phone}, {cars: cars}, function (err, count, status) {
        if (err) res.json({"resp_code": "1", "resp_msg": "User.update failed: " + err});
        else res.json({"resp_code": "100"});
      });
    }
  });
};

exports.CarsGet = function(req, res) {
  if (req.body.phone == null || req.body.user_id == null || req.body.access_token == null) {
    res.json({"resp_code" : "1", "resp_msg": "Invalid/empty parameters"});
    return;
  }

  User.findOne({_id: req.body.user_id, access_token: req.body.access_token, phone: req.body.phone}, function (err, user) {
    if (err || user == null) res.json({"resp_code" : "1", "resp_msg": "User.findOne failed: " + err});
    else {
      res.json(user.cars);
    }
  });
};

//Locations
exports.LocsAdd = function(req, res) {
  if (req.body.phone == null || req.body.user_id == null || req.body.access_token == null || req.body.loc_id == null || req.body.loc_address == null || req.body.loc_name == null) {
    res.json({"resp_code": "1", "resp_msg": "Invalid/empty parameters"});
    return;
  }

  User.findOne({_id: req.body.user_id, access_token: req.body.access_token, phone: req.body.phone}, function (err, user) {
    if (err || user == null) res.json({"resp_code": "1", "resp_msg": "User.findOne failed: " + err});
    else {
      var locs = user.locations;
      for (var i = 0; i < locs.length; i++) { //check for location duplicates
        if (locs[i].loc_id == req.body.loc_id) {
          res.json({"resp_code": "8"});
          return; //DUPLICATE LOCATIONS
        }
      }
      var newLoc = new Location({
        name: req.body.loc_name,
        address: req.body.loc_address,
        loc_id: req.body.loc_id
      });
      locs.push(newLoc);
      User.update({_id: req.body.user_id, access_token: req.body.access_token, phone: req.body.phone}, {locations: locs}, function (err, count, status) {
        if (err) res.json({"resp_code": "1", "resp_msg": "User.update failed: " + err});
        else res.json({"resp_code": "100"});
      });
    }
  });
};

exports.LocsRemove = function(req, res) {
  if (req.body.phone == null || req.body.user_id == null || req.body.access_token == null || req.body.loc_id == null) {
    res.json({"resp_code": "1", "resp_msg": "Invalid/empty parameters"});
    return;
  }

  User.findOne({_id: req.body.user_id, access_token: req.body.access_token, phone: req.body.phone}, function (err, user) {
    if (err || user == null) res.json({"resp_code" : "1", "resp_msg": "User.findOne failed: " + err});
    else {
      var locs = user.locations;
      var deleted = false;
      for (var i = 0; i < locs.length; i++) {
        if (locs[i].loc_id == req.body.loc_id) {
          locs.splice(i, 1);
          deleted = true;
          break;
        }
      }

      if (!deleted) { //loc to delete wasn't found
        res.json({"resp_code": "1", "resp_msg": "Location to delete not found"});
        return;
      }

      User.update({_id: req.body.user_id, access_token: req.body.access_token, phone: req.body.phone}, {locations: locs}, function (err, count, status) {
        if (err) res.json({"resp_code": "1", "resp_msg": "User.update failed: " + err});
        else res.json({"resp_code": "100"});
      });
    }
  });
};

exports.LocsUpdate = function(req, res) {
  if (req.body.phone == null || req.body.user_id == null || req.body.access_token == null || req.body.loc_id == null || req.body.loc_address == null || req.body.loc_name == null) {
    res.json({"resp_code": "1", "resp_msg": "Invalid/empty parameters"});
    return;
  }

  User.findOne({_id: req.body.user_id, access_token: req.body.access_token, phone: req.body.phone}, function (err, user) {
    if (err || user == null) res.json({"resp_code": "1", "resp_msg": "User.findOne failed: " + err});
    else {
      var locs = user.locations;

      for (var i = 0; i < locs.length; i++) {
        if (locs[i].loc_id == req.body.loc_id) {
          locs[i].name = req.body.loc_name;
          locs[i].address = req.body.loc_address;
          break;
        }
      }

      User.update({_id: req.body.user_id, access_token: req.body.access_token, phone: req.body.phone}, {locations: locs}, function (err, count, status) {
        if (err) res.json({"resp_code": "1", "resp_msg": "User.update failed: " + err});
        else res.json({"resp_code": "100"});
      });
    }
  });
};

exports.LocsGet = function(req, res) {
  if (req.body.phone == null || req.body.user_id == null || req.body.access_token == null) {
    res.json({"resp_code" : "1", "resp_msg": "Invalid/empty parameters"});
    return;
  }

  User.findOne({_id: req.body.user_id, access_token: req.body.access_token, phone: req.body.phone}, function (err, user) {
    if (err || user == null) res.json({"resp_code" : "1", "resp_msg": "User.findOne failed: " + err});
    else {
      res.json(user.locations);
    }
  });
};

exports.UserDelete = function (req, res) {
  if (req.body.phone == null || req.body.user_id == null || req.body.access_token == null) {
    res.json({"resp_code" : "1", "resp_msg": "Invalid/empty parameters"});
    return;
  }

  User.remove({_id: req.body.user_id, access_token: req.body.access_token, phone: req.body.phone}, function (err, result) {
    if (err) res.json("resp_code": "1");
    else res.json("resp_code": "100");
  });
}


function sendText(phone, pin) {
  var opts = {
    to: phone,
    from: phoneNumber,
    body: `aspace PIN: ${pin}`
  };
  twilio.messages.create(opts, function(err, msg) {
    if (err) console.log(err);
    console.log(msg);
  });
}

/* Copyright © 2017 Avi Glozman and Terrance Li */

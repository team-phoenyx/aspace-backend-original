'use strict';
//dependencies

const colors = require("colors/safe");
const mysql = require("mysql");
const request = require("request-promise");
const hat = require("hat");
//mongodb stuff
const models = require("./schemas.js");
const mongoose = require("mongoose"),
  Car = mongoose.model('Car'),
  Location = mongoose.model('Location'),
  User = mongoose.model('Users');
var connection = require("mysql");
//TWILIO stuff
const accountSid = 'AC7b77e08a33aadf7cad22329888e8a381';
const authToken = '7e9a098a2c077de2e70aa1b5f8fee758';
const phoneNumber = '+13123456230';
//
const twilio = require('twilio')(accountSid, authToken);

exports.SpotsSingle = function(req, res) {
  var query = 'SELECT * FROM spots WHERE spot_id = ' + req.body.spot_id;
  // Select the entire JSON object corresponding to a spot_id
  connection.query(query,function(err,rows){
    if(err) {
        res.json({"resp_code" : "1"});
    } else {
        res.json(rows[0]);
    }
  });
};

exports.SpotsOnscreen = function(req, res) {
  var query = `SELECT * FROM spots WHERE ((lat <= ${req.body.upper_lat}) AND (lat >= ${req.body.lower_lat})) AND ((lon <= ${req.body.upper_lon}) AND (lon >= ${req.body.lower_lon}))`;
  // Select the entire JSON object for every spot within specific lat/lon bounds
  connection.query(query,function(err,rows){
    if(err) {
        res.json({"resp_code" : "1"});
    } else {
        res.json(rows);
    }
  });
};

exports.SpotsStatus = function(req, res) {
  var query = `UPDATE spots SET status = '${req.body.status}' WHERE spot_id = '${req.body.spot_id}'`;
  connection.query(query,function(err,rows){
    if(err) {
        res.json({"resp_code" : "1"});
    } else {
        res.json({"status" : req.body.status});
    }
  });
};

//AUTHENTICATION ENDPOINTS
exports.AuthPin = function(req, res) {
  if (req.body.phone == null || req.body.phone == "") {
    res.json({"resp_code": "1"});
    return;
  }
  User.find({phone: req.body.phone}, function(err, user) {
    if (err) res.json({"resp_code": "1"});
    else {
      var randomPin = Math.floor(1000 + Math.random() * 9000);
      var date = Math.floor((new Date).getTime() / 1000);
      console.log(user);
      if (user.length == 1) { //returning user
        User.update({phone: req.body.phone}, {pin: randomPin, pin_timestamp: date}, function (err, count, status) {
          if (err) res.json({"resp_code": "1"});
          else {
            sendText(req.body.phone, randomPin);
            res.json({"resp_code" : "100"});
          }
        });
      } else if (user.length == 0) { //new user
        var newUser = new User({pin: randomPin, pin_timestamp: date, phone: req.body.phone});
        newUser.save(function (err, user) {
          if (err) res.json({"resp_code": "1"});
          else {
            sendText(req.body.phone, randomPin);
            res.json({"resp_code" : "100"});
          }
        });
      } else res.json({"resp_code": "1"}); //more than a single user w/ a phone number; should never happen
    }
  });
};

exports.AuthVerify = function(req, res) {
  if (req.body.phone == null || req.body.phone == "") {
    res.json({"resp_code" : "1"});
    return;
  }
  User.findOne({phone: req.body.phone}, function (err, user) {
    if (err) res.json({"resp_code" : "1"});
    else {
      var date = Math.floor((new Date).getTime() / 1000);
      if (date - user.pin_timestamp < 120) {
        if (user.pin != req.body.pin){
          res.json({"resp_code" : "2"});
        } else if (user.pin == req.body.pin) {
          var token = hat();

          User.update({phone: req.body.phone, pin: req.body.pin}, {access_token: token, token_timestamp: date}, function (err, count, status) {
            if (err) res.json({"resp_code": "1"});
            else {
              User.findOne({phone: req.body.phone, pin: req.body.pin}, function (err, user) {
                if (err) res.json({"resp_code": "1"});
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
    res.json({"resp_code" : "1"});
    return;
  }

  User.find({phone: req.body.phone, _id: req.body.user_id, access_token: req.body.access_token}, function (err, users) {
    if (err) res.json({"resp_code" : "1"});
    else {
      if (users.length == 1) {
        var date = Math.floor((new Date).getTime() / 1000);

        if ((date - users[0].token_timestamp) <= 7776000) res.json({"resp_code" : "100"});
        else res.json({"resp_code" : "4"});

      } else if (users.length == 0) {
        res.json({"resp_code" : "5"});
      } else res.json({"resp_code" : "1"});
    }
  });
};

//PROFILE ENDPOINTS
exports.ProfileUpdate = function(req, res) {
  if (req.body.phone == null || req.body.user_id == null || req.body.access_token == null || req.body.name == null) {
    res.json({"resp_code" : "1"});
    return;
  }

  User.update({_id: req.body.user_id, access_token: req.body.access_token, phone: req.body.phone}, {name: req.body.name}, function (err, count, status) {
    res.json({"resp_code": (err ? "6" : "100")});
  });
};

exports.ProfileGet = function(req, res) {
  if (req.body.phone == null || req.body.user_id == null || req.body.access_token == null) {
    res.json({"resp_code": "1"});
    return;
  }

  User.findOne({_id: req.body.user_id, access_token: req.body.access_token, phone: req.body.phone}, function(err, user) {
    if (err) res.json({"resp_code": "7"});
    else {
      res.json({"user_id": user._id, "name": user.name ? user.name : "", "cars": user.cars, "locs": user.locations});
    }
  });
};

//Cars
exports.CarsAdd = function(req, res) {
  if (req.body.phone == null || req.body.user_id == null || req.body.access_token == null
    || req.body.car_name == null || req.body.car_make == null || req.body.car_year == null || req.body.car_model == null || req.body.car_length == null) {
    res.json({"resp_code": "1"});
    console.log(req.body);
    return;
  }

  User.findOne({_id: req.body.user_id, access_token: req.body.access_token, phone: req.body.phone}, function (err, user) {
    if (err) {
      res.json({"resp_code": "1"});
      console.log("user not found");
    } else {
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
        res.json({"resp_code": (err ? "1" : "100")});
      });
    }
  });
};

exports.CarsRemove = function(req, res) {
  if (req.body.phone == null || req.body.user_id == null || req.body.access_token == null || req.body.car_id == null) {
    res.json({"resp_code": "1"});
    return;
  }

  User.findOne({_id: req.body.user_id, access_token: req.body.access_token, phone: req.body.phone}, function (err, user) {
    if (err) res.json({"resp_code" : "1"});
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
        res.json({"resp_code": "1"});
        return;
      }

      User.update({_id: req.body.user_id, access_token: req.body.access_token, phone: req.body.phone}, {cars: cars}, function (err, count, status) {
        res.json({"resp_code": (err ? "1" : "100")});
      });
    }
  });
};

exports.CarsUpdate = function(req, res) {
  if (req.body.phone == null || req.body.user_id == null || req.body.access_token == null || req.body.car_name == null || req.body.car_make == null || req.body.car_year == null || req.body.car_model == null || req.body.car_length == null || req.body.car_id == null) {
    res.json({"resp_code": "1"});
    console.log("params not fulfilled");

    console.log(req.body);
    return;
  }

  User.findOne({_id: req.body.user_id, access_token: req.body.access_token, phone: req.body.phone}, function (err, user) {
    if (err) {
      res.json({"resp_code": "1"});
      console.log("can't find user");
    }
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

      console.log(cars);
      User.update({_id: req.body.user_id, access_token: req.body.access_token, phone: req.body.phone}, {cars: cars}, function (err, count, status) {
        res.json({"resp_code": (err ? "1" : "100")});
      });
    }
  });
};

exports.CarsGet = function(req, res) {
  if (req.body.phone == null || req.body.user_id == null || req.body.access_token == null) {
    res.json({"resp_code" : "1"});
    return;
  }

  User.findOne({_id: req.body.user_id, access_token: req.body.access_token, phone: req.body.phone}, function (err, user) {
    if (err) res.json({"resp_code" : "1"});
    else {
      res.json(user.cars);
    }
  });
};

//Locations
exports.LocsAdd = function(req, res) {
  if (req.body.phone == null || req.body.user_id == null || req.body.access_token == null || req.body.loc_id == null || req.body.loc_address == null || req.body.loc_name == null) {
    res.json({"resp_code": "1"});
    console.log(req.body);
    return;
  }

  User.findOne({_id: req.body.user_id, access_token: req.body.access_token, phone: req.body.phone}, function (err, user) {
    if (err) {
      res.json({"resp_code": "1"});
      console.log("user not found");
    } else {
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
      console.log(locs);
      User.update({_id: req.body.user_id, access_token: req.body.access_token, phone: req.body.phone}, {locations: locs}, function (err, count, status) {
        res.json({"resp_code": (err ? "1" : "100")});
      });
    }
  });
};

exports.LocsRemove = function(req, res) {
  if (req.body.phone == null || req.body.user_id == null || req.body.access_token == null || req.body.loc_id == null) {
    res.json({"resp_code": "1"});
    return;
  }

  User.findOne({_id: req.body.user_id, access_token: req.body.access_token, phone: req.body.phone}, function (err, user) {
    if (err) res.json({"resp_code" : "1"});
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
        res.json({"resp_code": "1"});
        return;
      }

      User.update({_id: req.body.user_id, access_token: req.body.access_token, phone: req.body.phone}, {locations: locs}, function (err, count, status) {
        res.json({"resp_code": (err ? "1" : "100")});
      });
    }
  });
};

exports.LocsUpdate = function(req, res) {
  if (req.body.phone == null || req.body.user_id == null || req.body.access_token == null || req.body.loc_id == null || req.body.loc_address == null || req.body.loc_name == null) {
    res.json({"resp_code": "1"});
    console.log("params not fulfilled");

    console.log(req.body);
    return;
  }

  User.findOne({_id: req.body.user_id, access_token: req.body.access_token, phone: req.body.phone}, function (err, user) {
    if (err) {
      res.json({"resp_code": "1"});
      console.log("can't find user");
    } else {
      var locs = user.locations;

      for (var i = 0; i < locs.length; i++) {
        if (locs[i].loc_id == req.body.loc_id) {
          locs[i].name = req.body.loc_name;
          locs[i].address = req.body.loc_address;
          break;
        }
      }

      console.log(locs);
      User.update({_id: req.body.user_id, access_token: req.body.access_token, phone: req.body.phone}, {locations: locs}, function (err, count, status) {
        res.json({"resp_code": (err ? "1" : "100")});
      });
    }
  });
};

exports.LocsGet = function(req, res) {
  if (req.body.phone == null || req.body.user_id == null || req.body.access_token == null) {
    res.json({"resp_code" : "1"});
    return;
  }

  User.findOne({_id: req.body.user_id, access_token: req.body.access_token, phone: req.body.phone}, function (err, user) {
    if (err) res.json({"resp_code" : "1"});
    else {
      console.log(user.locations);
      res.json(user.locations);
    }
  });
};

//
function sendText(phone, pin) {
  var opts = {
    to: phone,
    from: phoneNumber,
    body: `aspace PIN: ${pin}`
  };
  console.log(opts);
  twilio.messages.create(opts, function(err, msg) {
    if (err) console.log(err);
    console.log(msg);
  });
}

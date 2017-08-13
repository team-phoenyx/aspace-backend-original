'use strict';
//dependencies

const colors = require("colors/safe");
const mysql = require("mysql");
const request = require("request-promise");
const hat = require("hat");
//mongodb stuff
const models = require("./schemas.js");
const mongoose = require("mongoose"),
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
  User.findOne({phone: req.body.phone}, function (err, user) {
    if (err) res.json({"resp_code" : "1"});
    else {
      var date = Math.floor((new Date).getTime() / 1000);
      if (date - user.pin_timestamp < 120) {
        if (user.pin != req.body.pin){
          res.json({"resp_code" : "2"});
        } else if (user.pin == req.body.pin) {
          var token = hat();

          User.update({phone: req.body.phone, pin: req.body.pin}, {access_token: token}, function (err, count, status) {
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

          /*
          var query = `UPDATE users SET access_token = '${token}', token_timestamp = ${date} WHERE phone = '${req.body.phone}' AND pin = ${req.body.pin};
          SELECT name, user_id, access_token FROM users WHERE phone = '${req.body.phone}' AND pin = ${req.body.pin};`;
          connection.query(query, function(err, rows){
            if (err){
              throw err;
              res.json({"resp_code" : "1"});
            }
            else {
              if (rows[1][0].name == null){
                res.json({access_token : `${rows[1][0].access_token}`, user_id : `${rows[1][0].user_id}`, resp_code : "101"});
              }
              else {
                res.json({access_token : `${rows[1][0].access_token}`, user_id : `${rows[1][0].user_id}`, resp_code : "102"});
              }
            }
          });
          */
        }
      }
      else if (date - user.pin_timestamp >= 120) {
          res.json({"resp_code" : "3"});
      }
    }
  });
  /*
  var query = `SELECT pin, pin_timestamp FROM users WHERE phone = '${req.body.phone}';`;
  connection.query(query,function(err,rows){
    if(err) {
        console.log(colors.red(`response code: 1`));
        res.json({"resp_code" : "1"});
    } else {

    }
  });
  */
};

exports.AuthReauth = function(req, res) {
  var query = `SELECT EXISTS(SELECT * FROM users WHERE phone = '${req.body.phone}' AND user_id = ${req.body.user_id} AND access_token = '${req.body.access_token}') as existsRecord;`;
  connection.query(query,function(err,rows){
    if(err) {
        res.json({"resp_code" : "1"});
    } else {
          if (rows[0].existsRecord == 1) {
            var date = Math.floor((new Date).getTime() / 1000);
            var query = `SELECT token_timestamp FROM users WHERE phone = '${req.body.phone}' AND user_id = ${req.body.user_id} AND access_token = '${req.body.access_token}';`;
            connection.query(query, function(err, rows){
              if (err) {
                res.json({"resp_code" : "1"});
              }
              else {
                if (date - rows[0].token_timestamp <= 7776000){
                    res.json({"resp_code" : "100"});
                }
                else{
                  res.json({"resp_code" : "4"});
                }
              }
            });
          }
          else if (rows[0].existsRecord == 0) {
                res.json({"resp_code" : "5"})
            }
        }
    });
};

//

exports.ProfileUpdate = function(req, res) {
  var query = `UPDATE users SET name = '${req.body.name}' WHERE user_id = '${req.body.user_id}' AND access_token = '${req.body.access_token}' AND phone = '${req.body.phone}';`;
  connection.query(query,function(err,rows){
    if(err) {
        res.json({"resp_code" : "6"});
    } else {
        res.json({"resp_code" : "100"});
    }
  });
};

exports.ProfileGet = function(req, res) {
  var query = `SELECT name, user_id, access_token, phone FROM users WHERE user_id = '${req.body.user_id}' AND access_token = '${req.body.access_token}' AND phone = '${req.body.phone}';`;
  connection.query(query,function(err,rows){
    if(err) {
        res.json({"resp_code" : "7"});
    } else {
        if (Object.keys(rows[0]).length === 0 && rows[0].constructor === Object){
          res.json({"resp_code" : "7"});
        }
        else{
          res.json(rows[0]);
        }
      }
  });
};

//

exports.CarsAdd = function(req, res) {
  var query = `SELECT EXISTS(SELECT * FROM users WHERE phone = '${req.body.phone}' AND user_id = ${req.body.user_id} AND access_token = '${req.body.access_token}') as existsRecord;`;
  connection.query(query,function(err,rows){
    if(err) {
        res.json({"resp_code" : "1"});
    } else {
          if (rows[0].existsRecord == 1) {
            var new_car = new Cars({user_id : req.body.user_id, car_name : req.body.car_name, car_vin : req.body.car_vin, car_make : req.body.car_make, car_model : req.body.car_model, car_length : req.body.car_length});
            new_car.save(function(err, car) {
              if (err)
                res.json({"resp_code" : "1"});
              else{
                res.json({"resp_code" : "100"});
              }
            });
          }
          else if (rows[0].existsRecord == 0) {
              res.json({"resp_code" : "1"})
            }
        }
    });
};

exports.CarsRemove = function(req, res) {
  var query = `SELECT EXISTS(SELECT * FROM users WHERE phone = '${req.body.phone}' AND user_id = ${req.body.user_id} AND access_token = '${req.body.access_token}') as existsRecord;`;
  connection.query(query,function(err,rows){
    if(err) {
        res.json({"resp_code" : "1"});
    } else {
          if (rows[0].existsRecord == 1) {
            Cars.remove({"_id":req.body.car_id}, function(err, car) {
              if (err)
                res.json({"resp_code" : "1"});
              else{
                res.json({"resp_code" : "100"});
              }
            });
          }
          else if (rows[0].existsRecord == 0) {
              res.json({"resp_code" : "1"})
          }
      }
  });
};

exports.CarsUpdate = function(req, res) {
  var query = `SELECT EXISTS(SELECT * FROM users WHERE phone = '${req.body.phone}' AND user_id = ${req.body.user_id} AND access_token = '${req.body.access_token}') as existsRecord;`;
  connection.query(query,function(err,rows){
    if(err) {
        res.json({"resp_code" : "1"});
    } else {
          if (rows[0].existsRecord == 1) {
            Cars.findOneAndUpdate({"_id":req.body.car_id}, {car_name : `${req.body.car_name}`, car_vin : `${req.body.car_vin}`, car_make : `${req.body.car_make}`, car_model : `${req.body.car_model}`, car_length : `${req.body.car_length}`}, function(err, car) {
              if (err)
                res.json({"resp_code" : "1"});
              else{
                res.json({"resp_code" : "100"});
              }
            });
          }
          else if (rows[0].existsRecord == 0) {
              res.json({"resp_code" : "1"})
          }
      }
  });
};

exports.CarsGet = function(req, res) {
  var query = `SELECT EXISTS(SELECT * FROM users WHERE phone = '${req.body.phone}' AND user_id = '${req.body.user_id}' AND access_token = '${req.body.access_token}') as existsRecord;`;
  connection.query(query,function(err,rows){
    if(err) {
        res.json({"resp_code" : "1"});
    } else {
          if (rows[0].existsRecord == 1) {
            Cars.find({user_id: req.body.user_id}, function(err, carList) {
              if (err)
                res.json({"resp_code" : "1"});
              else{
                res.json(carList);
              }
            });
          }
          else if (rows[0].existsRecord == 0) {
              res.json({"resp_code" : "1"})
          }
      }
  });
};

//

exports.LocsAdd = function(req, res) {
  var query = `SELECT EXISTS(SELECT * FROM users WHERE phone = '${req.body.phone}' AND user_id = ${req.body.user_id} AND access_token = '${req.body.access_token}') as existsRecord;`;
  connection.query(query,function(err,rows){
    if(err) {
        res.json({"resp_code" : "1"});
    } else {
          if (rows[0].existsRecord == 1) {
            console.log("Query should now execute...");
            var new_loc = new Locations({user_id : req.body.user_id, location_name : `${req.body.location_name}`, address : `${req.body.address}`, location_id: `${req.body.location_id}`});
            new_loc.save(function(err, loc) {
              console.log("Query has executed.");
              if (err){
                res.json({"resp_code" : "1"});
              }
              else{
                res.json({"resp_code" : "100"});
              }
            });
          }
          else if (rows[0].existsRecord == 0) {
              res.json({"resp_code" : "1"})
            }
        }
    });
};

exports.LocsRemove = function(req, res) {
  var query = `SELECT EXISTS(SELECT * FROM users WHERE phone = '${req.body.phone}' AND user_id = ${req.body.user_id} AND access_token = '${req.body.access_token}') as existsRecord;`;
  connection.query(query,function(err,rows){
    if(err) {
        res.json({"resp_code" : "1"});
    } else {
          if (rows[0].existsRecord == 1) {
            Locations.remove({"_id":req.body.obj_id}, function(err, loc) {
              if (err)
                res.json({"resp_code" : "1"});
              else{
                res.json({"resp_code" : "100"});
              }
            });
          }
          else if (rows[0].existsRecord == 0) {
              res.json({"resp_code" : "1"})
          }
      }
  });
};

exports.LocsUpdate = function(req, res) {
  var query = `SELECT EXISTS(SELECT * FROM users WHERE phone = '${req.body.phone}' AND user_id = ${req.body.user_id} AND access_token = '${req.body.access_token}') as existsRecord;`;
  connection.query(query,function(err,rows){
    if(err) {
        res.json({"resp_code" : "1"});
    } else {
          if (rows[0].existsRecord == 1) {
            Locations.findOneAndUpdate({"_id":req.body.obj_id}, {location_name : `${req.body.location_name}`, address : `${req.body.address}`, location_id: `${req.body.location_id}`}, function(err, loc) {
              if (err)
                res.json({"resp_code" : "1"});
              else{
                res.json({"resp_code" : "100"});
              }
            });
          }
          else if (rows[0].existsRecord == 0) {
              res.json({"resp_code" : "1"})
          }
      }
  });
};

exports.LocsGet = function(req, res) {
  var query = `SELECT EXISTS(SELECT * FROM users WHERE phone = '${req.body.phone}' AND user_id = ${req.body.user_id} AND access_token = '${req.body.access_token}') as existsRecord;`;
  connection.query(query,function(err,rows){
    if(err) {
        res.json({"resp_code" : "1"});
    } else {
          if (rows[0].existsRecord == 1) {
            Locations.find({"user_id":req.body.user_id}, function(err, locList) {
              if (err)
                res.json({"resp_code" : "1"});
              else{
                res.json(locList);
              }
            });
          }
          else if (rows[0].existsRecord == 0) {
              res.json({"resp_code" : "1"})
          }
      }
  });
};

//

function sendText(phone, pin){
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

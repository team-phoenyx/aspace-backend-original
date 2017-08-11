'use strict';
//dependencies
const colors = require("colors/safe");
const mysql = require("mysql");
const request = require("request-promise");
const hat = require("hat");
//mongodb stuff
const models = require("./schemas.js");
const mongoose = require("mongoose"),
  Locations = mongoose.model('AspaceLocations'),
  Cars = mongoose.model('AspaceCars');
//TWILIO stuff
const accountSid = 'AC7b77e08a33aadf7cad22329888e8a381';
const authToken = '7e9a098a2c077de2e70aa1b5f8fee758';
const phoneNumber = '+13123456230';
//
const twilio = require('twilio')(accountSid, authToken);


function REST_ROUTER(router,connection) {
    var self = this;
    self.handleRoutes(router,connection);
}

REST_ROUTER.prototype.handleRoutes= function(router,connection) {

    router.get("/ping/",function(req,res){
        res.json("pong");
        // Basic get request. Nothing special.
        // Can be used to poll connection to server.
    });

    router.post("/spots/single/",function(req,res){
        var query = 'SELECT * FROM spots WHERE spot_id = ' + req.body.spot_id;
        // Select the entire JSON object corresponding to a spot_id
        connection.query(query,function(err,rows){
          if(err) {
              res.json({"resp_code" : "1"});
          } else {
              res.json(rows[0]);
          }
      });
  });

    router.post("/spots/onscreen/",function(req,res){
        var query = `SELECT * FROM spots WHERE ((lat <= ${req.body.upper_lat}) AND (lat >= ${req.body.lower_lat})) AND ((lon <= ${req.body.upper_lon}) AND (lon >= ${req.body.lower_lon}))`;
        // Select the entire JSON object for every spot within specific lat/lon bounds
        connection.query(query,function(err,rows){
          if(err) {
              res.json({"resp_code" : "1"});
          } else {
              res.json(rows);
          }
      });
  });

    router.post("/spots/status/",function(req,res){
        var query = `UPDATE spots SET status = '${req.body.status}' WHERE spot_id = '${req.body.spot_id}'`;
      // Updates the status of a spot with a given status (T = TAKEN; F = FREE) at a certain spot_id
        connection.query(query,function(err,rows){
          if(err) {
              res.json({"resp_code" : "1"});
          } else {
              res.json({"status" : req.body.status});
          }
    });
});
/*
END POINT DEPRECATED.
    router.post("/spots/closest/",function(req,res){
        var query = `SELECT open_spots.spot_id, open_spots.lat, open_spots.lon
FROM spots AS open_spots WHERE open_spots.status = 'F'
ORDER BY (POWER((open_spots.lon - ${req.body.lon}), 2.0) + POWER((open_spots.lat - ${req.body.lat}), 2.0))
LIMIT 1`
    // Returns a single JSON object with the closest lat/lon to the destination.
        connection.query(query,function(err,rows){
            if(err) {
                res.json({"error" : "operation failed"});
              } else {
                var token = 'pk.eyJ1IjoicGFyY2FyZSIsImEiOiJjajN2cjU4MGkwMGE1MnFvN3cxOWY5azFlIn0.qmmgzy-RijWWqV-ZbmiZbg';
                options = {
                  uri: `https://api.mapbox.com/directions/v5/mapbox/driving/${req.body.lon},${req.body.lat};${rows[0].lon},${rows[0].lat}?access_token=${token}`,
                  method: "GET"
                };
                request(options)
                // send a GET request to the Mapbox API
                .then (function(response){
                  var json = JSON.parse(response);
                  // parse the response into JSON
                  var route = json.routes[0];
                    res.json({"spot_id" : rows[0].spot_id, "lat" : rows[0].lat, "lon" : rows[0].lon, "distance" : route.distance});
                })
                .catch(function (err) {
                    res.json({"resp_code" : "1"});
              })
          }
      });
  });
*/

//CARS
router.post("/users/profile/cars/add/",function(req,res){
  var query = `SELECT EXISTS(SELECT * FROM users WHERE phone = '${req.body.phone}' AND user_id = ${req.body.user_id} AND access_token = '${req.body.access_token}') as existsRecord;`;
  connection.query(query,function(err,rows){
    if(err) {
        res.json({"resp_code" : "1"});
    } else {
          if (rows[0].existsRecord == 1) {
            var new_car = new Cars({user_id : req.body.user_id, car_name : `${req.body.car_name}`, car_vin : `${req.body.car_vin}`, car_make : `${req.body.car_make}`, car_model : `${req.body.car_model}`, car_length : `${req.body.car_length}`});
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
});

router.post("/users/profile/cars/remove/",function(req,res){
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
});

router.post("/users/profile/cars/update/",function(req,res){
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
});

router.post("/users/profile/cars/get/",function(req,res){
  var query = `SELECT EXISTS(SELECT * FROM users WHERE phone = '${req.body.phone}' AND user_id = ${req.body.user_id} AND access_token = '${req.body.access_token}') as existsRecord;`;
  connection.query(query,function(err,rows){
    if(err) {
        res.json({"resp_code" : "1"});
    } else {
          if (rows[0].existsRecord == 1) {
            Cars.find({"user_id":req.body.user_id}, function(err, carList) {
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
});
//END CARS

// LOCS
router.post("/users/profile/locs/add/",function(req,res){
  var query = `SELECT EXISTS(SELECT * FROM users WHERE phone = '${req.body.phone}' AND user_id = ${req.params.user_id} AND access_token = '${req.body.access_token}') as existsRecord;`;
  connection.query(query,function(err,rows){
    if(err) {
        res.json({"resp_code" : "1"});
    } else {
          if (rows[0].existsRecord == 1) {
            var new_loc = new Locations({user_id : req.params.user_id, location_name : `${req.params.location_name}`, address : `${req.params.address}`, location_id: `${req.params.location_id}`});
            new_loc.save(function(err, loc) {
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
});

router.post("/users/profile/locs/remove/",function(req,res){
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
});

router.post("/users/profile/locs/update/",function(req,res){
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
});

router.post("/users/profile/locs/get/",function(req,res){
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
});
// END LOCS
router.post("/users/profile/update/",function(req,res){
    var query = `UPDATE users SET name = '${req.body.name}' WHERE user_id = '${req.body.user_id}' AND access_token = '${req.body.access_token}' AND phone = '${req.body.phone}';`;
    connection.query(query,function(err,rows){
      if(err) {
          res.json({"resp_code" : "6"});
      } else {
          res.json({"resp_code" : "100"});
      }
  });
});

router.post("/users/profile/get/",function(req,res){
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
});

router.post("/users/auth/pin/",function(req,res){
    var randomPin = Math.floor(1000 + Math.random() * 9000);
    var query = `SELECT EXISTS(SELECT pin FROM users WHERE phone = '${req.body.phone}') as existsRecord`;
    connection.query(query,function(err,rows){
      if(err) {
          console.log(colors.red(`response code: 1`));
          res.json({"resp_code" : "1"});
      } else {
            console.log(rows[0].existsRecord);
            if (rows[0].existsRecord == 1) {
              var date = Math.floor((new Date).getTime() / 1000);
              var queryUpdate = `UPDATE users SET pin = ${randomPin}, pin_timestamp = ${date} WHERE phone = '${req.body.phone}';`;
              connection.query(queryUpdate, function(err, rows){
                if (err) {
                  res.json({"resp_code" : "1"});
                }
                else {
                      sendText(req.body.phone, randomPin);
                      res.json({"resp_code" : "100"});
                    }
                  });
                }
            else if (rows[0].existsRecord == 0) {
              var date = Math.floor((new Date).getTime() / 1000);
              var query = `INSERT INTO users (pin, phone, pin_timestamp) VALUES (${randomPin}, '${req.body.phone}', ${date});`;
              connection.query(query, function(err, rows){
                if (err) {
                  res.json({"resp_code" : "1"});
                }
                else{
                      sendText(req.body.phone, randomPin);
                      res.json({"resp_code" : "100"});
                  }
                });
              }
          }
    });
});

router.post("/users/auth/verify/",function(req,res){
    var query = `SELECT pin, pin_timestamp FROM users WHERE phone = '${req.body.phone}';`;
    connection.query(query,function(err,rows){
      if(err) {
          console.log(colors.red(`response code: 1`));
          res.json({"resp_code" : "1"});
      } else {
            var date = Math.floor((new Date).getTime() / 1000);
            if (date - rows[0].pin_timestamp < 120) {
              if (rows[0].pin != req.body.pin){
                res.json({"resp_code" : "2"});
              }
              else if (rows[0].pin == req.body.pin){
                var token = hat();
                var date = Math.floor((new Date).getTime() / 1000);
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
              }
            }
            else if (date - rows[0].pin_timestamp >= 120){
                res.json({"resp_code" : "3"});
            }
          }
    });
});

router.post("/users/auth/reauth/",function(req,res){
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
});
}
//

function sendText(phone, pin){
  twilio.messages
      .create({
        to: phone,
        from: phoneNumber,
        body: `aspace pin: ${pin}`
      })
       .then((message) => console.log(message.sid));
}

module.exports = REST_ROUTER;

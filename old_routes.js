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

REST_ROUTER.prototype.handleRoutes= function(router,connection) {

    router.get("/ping/",function(req,res){
        res.json("pong");
        // Basic get request. Nothing special.
        // Can be used to poll connection to server.
    });

    router.post("/spots/single/",function(req,res){

  });

    router.post("/spots/onscreen/",function(req,res){

  });

    router.post("/spots/status/",function(req,res){

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

});

router.post("/users/profile/cars/remove/",function(req,res){

});

router.post("/users/profile/cars/update/",function(req,res){

});

router.post("/users/profile/cars/get/",function(req,res){

});
//END CARS

// LOCS
router.post("/users/profile/locs/add/",function(req,res){

});

router.post("/users/profile/locs/remove/",function(req,res){

});

router.post("/users/profile/locs/update/",function(req,res){

});

router.post("/users/profile/locs/get/",function(req,res){

});
// END LOCS
router.post("/users/profile/update/",function(req,res){

});

router.post("/users/profile/get/",function(req,res){

});

router.post("/users/auth/pin/",function(req,res){

});

router.post("/users/auth/verify/",function(req,res){

});

router.post("/users/auth/reauth/",function(req,res){

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

//dependencies
const colors = require("colors/safe");
const mysql = require("mysql");
const request = require("request-promise");

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

    router.get("/",function(req,res){
        res.json({"ping" : "pong"});
        // Basic get request. Nothing special.
        // Can be used to poll connection to server.
    });

    router.post("/spots/single/",function(req,res){
        var query = 'SELECT * FROM spots WHERE spot_id = ' + req.body.spot_id;
        // Select the entire JSON object corresponding to a spot_id
        connection.query(query,function(err,rows){
          if(err) {
              console.log('spot_id as sent:' + req.body.spot_id);
              console.log(colors.red('query failed...'));
              console.log(colors.red(query));
              res.json({"message" : "operation failed"});
          } else {
              console.log('spot_id as sent:' + req.body.spot_id);
	            console.log(colors.green(query));
              res.json(rows[0]);
          }
      });
  });

    router.post("/spots/onscreen/",function(req,res){
        var query = `SELECT * FROM spots WHERE ((lat <= ${req.body.upper_lat}) AND (lat >= ${req.body.lower_lat})) AND ((lon <= ${req.body.upper_lon}) AND (lon >= ${req.body.lower_lon}))`;
        // Select the entire JSON object for every spot within specific lat/lon bounds
        connection.query(query,function(err,rows){
          if(err) {
              console.log('lower LAT bound as sent:' + req.body.lower_lat);
              console.log('lower LON bound as sent:' + req.body.lower_lon);
              console.log('upper LAT bound as sent:' + req.body.upper_lat);
              console.log('upper LON bound as sent:' + req.body.upper_lon);
              console.log(colors.red('query failed...'));
              console.log(colors.red(query));
              res.json({"message" : "operation failed"});
          } else {
              console.log('lower LAT bound as sent:' + req.body.lower_lat);
              console.log('lower LON bound as sent:' + req.body.lower_lon);
              console.log('upper LAT bound as sent:' + req.body.upper_lat);
              console.log('upper LON bound as sent:' + req.body.upper_lon);
              console.log(colors.green(query));
              res.json(rows);
          }
      });
  });

    router.post("/spots/status/",function(req,res){
        var query = `UPDATE spots SET status = '${req.body.status}' WHERE spot_id = '${req.body.spot_id}'`;
      // Updates the status of a spot with a given status (T = TAKEN; F = FREE) at a certain spot_id
        connection.query(query,function(err,rows){
          if(err) {
              console.log('spot_id as sent:' + req.body.spot_id);
              console.log('status as sent:' + req.body.status);
              console.log(colors.red('query failed...'));
              console.log(colors.red(query));
              res.json({"message" : "operation failed"});
          } else {
              console.log('spot_id as sent:' + req.body.spot_id);
              console.log('status as sent:' + req.body.status);
              console.log('status spot #' + req.body.spot_id + 'was changed to ' + req.body.status);
              console.log(colors.green(query));
              res.json({"status" : req.body.status});
          }
    });
});
router.post("/spots/closest/",function(req,res){
    var query = `SELECT open_spots.spot_id, open_spots.lat, open_spots.lon
    FROM spots AS open_spots WHERE open_spots.status = 'F'
    ORDER BY (POWER((open_spots.lon - ${req.body.lon}), 2.0) + POWER((open_spots.lat - ${req.body.lat}), 2.0))
    LIMIT 1`
    // Returns a single JSON object with the closest lat/lon to the destination.
    connection.query(query,function(err,rows){
      if(err) {
          console.log(`dest. lat as sent: ${req.body.lat}\ndest. lon as sent: ${req.body.lon}`);
          console.log(colors.red('operation failed...'));
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
                console.log(`distance: ${route.distance} meters`);
                res.json({"spot_id" : rows[0].spot_id, "lat" : rows[0].lat, "lon" : rows[0].lon, "distance" : route.distance});
              })
              .catch(function (err) {
                console.log(colors.red("error with Mapbox request."))
              })
          }
      });
  });

  router.post("/users/profile/update/",function(req,res){
      var query = `UPDATE users SET name = '${req.body.name}', home_address = '${req.body.home_address}', work_address = '${req.body.work_address}', work_loc_id = '${req.body.work_loc_id}', home_loc_id = '${req.body.home_loc_id}'
    WHERE user_id = '${req.body.user_id}' AND access_token = '${req.body.access_token}' AND phone = '${req.body.phone}';`;
      // Updates a user's personal/profile information.
      connection.query(query,function(err,rows){
        if(err) {
            console.log(colors.red(`updating ${req.body.user_id}'s profile failed...`));
            res.json({"message" : "operation failed"});
        } else {
            console.log(colors.green(`${req.body.user_id}'s profile updated!`));
            res.json({"message" : "profile updated!"});
        }
  });
});

router.post("/users/auth/verify/one/",function(req,res){
    var randomPin = Math.floor(1000 + Math.random() * 9000);
    var query = `SELECT EXISTS(SELECT pin FROM users WHERE phone = '${req.body.phone}') as existsRecord`;
    connection.query(query,function(err,rows){
      if(err) {
          console.log(err);
          console.log(colors.red(`mobile auth with twilio failed... S1`));
          res.json({"message" : "auth failed s1"});
      } else {
            console.log(rows[0].existsRecord);
            if (rows[0].existsRecord == 1) {
              var query = `UPDATE users SET pin = ${randomPin} WHERE phone = '${req.body.phone}';`;
              //var select = `SELECT pin FROM \`users\` WHERE phone = '${req.body.phone}';`;
              connection.query(query, function(err, rows){
                if (err) throw err;
                else {
                      sendText(req.body.phone, randomPin);
                      console.log(colors.green(`sending phone/pin to verify...`));
                      res.json({pin : randomPin, phone : req.body.phone});
                    }
                  });
                }
            else if (rows[0].existsRecord == 0) {
              var queryInsert = `INSERT INTO users (pin, phone) VALUES (${randomPin}, '${req.body.phone}');`;
              //SELECT pin FROM \`users\` WHERE phone = '${req.body.phone}';`;
              connection.query(queryInsert, function(err, rows){
                if (err) throw err;
                else{
                      sendText(req.body.phoneNumber, randomPin);
                      console.log(colors.green(`sending phone/pin to verify...`));
                      res.json({pin : randomPin, phone : req.body.phone});
                      //connection.release();
                  }
                });
              }
          }
    });
});

router.post("/users/auth/verify/two/",function(req,res){
    var query = `SELECT EXISTS(SELECT phone, pin FROM users WHERE phone = '${req.body.phone}' AND pin = ${req.body.pin}) as existsRecord;`;
    connection.query(query,function(err,rows){
      if(err) {
          console.log(err);
          console.log(colors.red(`mobile auth with twilio failed... S2`));
          res.json({"message" : "auth failed s2"});
      } else {
            console.log(rows[0].existsRecord);
            if (rows[0].existsRecord == 1) {
              var query = `SELECT access_token FROM users WHERE phone = '${req.body.phone}' AND pin = ${req.body.pin};`;
              connection.query(query, function(err, rows){
                if (err) throw err;
                else {
                  res.json({"access_token" : rows[0].access_token});
                    }
                  });
                }
            else if (rows[0].existsRecord == 0) {
              console.log(colors.red("user does not exist"));
              res.json({message: "user does not exist or info invalid..."});
              }
          }
    });
});

router.post("/users/auth/verify/three/",function(req,res){
    var query = `SELECT EXISTS(SELECT access_token FROM users WHERE phone = '${req.body.phone}' AND access_token = '${req.body.access_token}') as existsRecord;`;
    //var query = `SELECT user_id, name, work_address, work_loc_id, home_address, home_loc_id FROM users WHERE phone = '${req.body.phone}' AND access_token = '${req.body.access_token}';`;
    connection.query(query,function(err,rows){
      if(err) {
          console.log(err);
          console.log(colors.red(`mobile auth with twilio failed... S2`));
          res.json({"message" : "auth failed s2"});
      } else {
            console.log(rows[0].existsRecord);
            if (rows[0].existsRecord == 1) {
              var query = `SELECT user_id, name, work_address, work_loc_id, home_address, home_loc_id FROM users WHERE phone = '${req.body.phone}' AND access_token = '${req.body.access_token}';`;
              connection.query(query, function(err, rows){
                if (err) throw err;
                else {
                  res.json(rows[0]);
                    }
                  });
                }
            else if (rows[0].existsRecord == 0) {
              console.log(colors.red("user does not exist"));
              res.json({message: "user does not exist or info invalid..."});
              }
          }
    });
});
}
function sendText(phone, pin){
  twilio.messages
      .create({
        to: phone,
        from: phoneNumber,
        body: `Your ParCare authentication code is: ${pin}`
      })
       .then((message) => console.log(message.sid));
}

module.exports = REST_ROUTER;

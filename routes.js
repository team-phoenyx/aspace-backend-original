//dependencies
const colors = require("colors/safe");
const mysql = require("mysql");
//var bcrypt = require("bcrypt");
const request = require("request-promise");

function REST_ROUTER(router,connection) {
    var self = this;
    self.handleRoutes(router,connection);
}

REST_ROUTER.prototype.handleRoutes= function(router,connection) {
    router.get("/",function(req,res){
        res.json({"ping" : "pong"});
        // Basic get request. Nothing special.
        // Can be used to poll connection to server.
    })

    router.post("/spots/single/",function(req,res){
        var query = 'SELECT * FROM spots WHERE spot_id = ' + req.body.spot_id;
        // Select the entire JSON object corresponding to a spot_id
        connection.query(query,function(err,rows){
          if(err) {
              console.log('spot_id as sent:' + req.body.spot_id);
              console.log(colors.red('query failed...'));
              console.log(colors.red(query));
              res.json({"error" : "query failed"});
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
              res.json({"error" : "query failed"});
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
              res.json({"error" : "query failed"});
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
}
module.exports = REST_ROUTER;

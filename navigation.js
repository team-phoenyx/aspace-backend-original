'use strict';

/*
NOTE:
This code is meant to be used on a high CPU server running on it's own
separate API, as to not place a heavy burden on the main API.

It should be used as part of the main API for debugging purposes only.

Access to this endpoint is restricted for INTERNAL USE ONLY, and it is to ONLY
be called from inside the main API.

This file essentially acts as a replacement for controllers.js when used on
its own server. Ideally, it would actually be called controllers.js, but
for debugging purposes can stay as navigation.js since controllers.js contains
lots of different stuff on the main servers.
---
Additionally, please be aware of some specific deviations from the pseudo-code:

1. In the pseudo-code, LatLng is represented as an object that holds a
lat/lon pair. Rather than using an object, in this case an array is simply
used to hold the pair. As a result of this, lat/lon will need to be sent
separately in the req.body.

2. The same occurs with BoundingBox, as bounding box is basically the same as
LatLng, or at least serves an almost identical purpose.

In the cases of 1 and 2:
LATITUDE is represented by array[0], and
LONGITUDE is represented by array[1].
In the case of 2
NE is represented by array[0], and
SW is represented by array[1].

3. Given JS's flexibility with variable types (having no explicit typing),
we can only hope that JS assumes that certain variables are to be treated as
doubles, others as ints, etc.

4. Regarding the for-each loops: It's not the same as Java man... It just isn't
the same... I have to be inefficient and write regular for loops instead.
[insert "feelsbadman"]

If this is not an adequate representation of the psuedo-code as it was intended,
please let me know and appropriate changes will be made. Hopefully that won't
be necessary.
*/

//dependencies
const request = require("request-promise");

//mongodb stuff
const mongoose = require("mongoose"),
  Spot = mongoose.model('Spots');


/*
  Params:
    req.body.lat: Latitude of destination
    req.body.lon: Longitude of destination
*/
exports.FindRoute = function(req, res) {
  if (req.body.lat == null || req.body.lon == null) {
    res.json({"resp_code": "1", "resp_msg": "Invalid/empty parameters. Navigation algorithm failure."});
    return;
  }
  // STEP 1:
  querySpots(req.body.lat, req.body.lon, function (spots) {
    if (spots == null) {
      res.json({"resp_code": "1", "resp_msg": "Spot search failure."});
      return;
    }

  });


  // STEP 2:
  var sectors = [];
  for (var i = 0; i < spots.length - 1; i++) {
    var sectorIndex = getIndexOfSectorContainingSpot(sectors, spots[i]);
    if (sectorIndex == -1){
      var sector = [spots[i]];
      sectors.push(sector);
    } else {
      sectors[sectorIndex].push(spot[i]);
    }
  }

  // STEP 3: (UNFINISHED)
  var clusters = [];
  // uhhhh the sorting might be a little tricky. gonna wait until i've
  // discussed with Terrance.

  // STEP 4: (UNFINISHED)
  // got too tired, will do on Friday when i'm not dead.
};

function querySpots(destLat, destLon, callback) {
  var destinationLatLon = [destLat, destLon];
  // array-ifying it so make it friendly. "destLat" and "destLon" are in req.body
  var rawBoundingBox = getSquareBoundingBox(destinationLatLon, radius);
  // radius is IN YARDS!!!

  asyncGetSpots(rawBoundingBox, destinationLatLon, function(loop, boundingBox) {
    Spot.find({lat: {$gt: parseFloat(boundingBox[1][0]), $lt: parseFloat(boundingBox[0][0])}, lon: {$gt: parseFloat(boundingBox[1][1]), $lt: parseFloat(boundingBox[1][0])}, status: "F"}, function (err, spots) {
      if (err || spots == null) callback(null); //null-check in FindRoute deals with the res.json
      else {
        var compatibleSpots = [];
        for (var i = 0; i < spots.length; i++) {
          var latLon = [spots[i].lat, spots[i].lon];
          if (haversine(destinationLatLon, latLon) < radius) {
            compatibleSpots.push(spots[i]);
          }
        }
        loop.next(compatibleSpots);
      }
    })},
    function(spots) {
      //do shit with spots
    });


}

function asyncGetSpots(rawBoundingBox, destinationLatLon, func, callback) {
    var radius = 50;
    var done = false;
    var loop = {
        next: function(compatibleSpots) {
            if (done) {
                return;
            }
            if (compatibleSpots.length < 20) {
                radius += 50;
                func(loop, getSquareBoundingBox(destinationLatLon, radius));
            } else {
                done = true;
                callback(compatibleSpots);
            }
        }
    };
    loop.next([]);
    return loop;
}

function getIndexOfSectorContainingSpot(sectors, spot) {
  for (var i = 0; i < sectors.length - 1; i++) {
    if (spot.sector_id == sector.id){
      return i;
    }
  }
  return -1;
}

function inverseHaversine (originLatLon, distance, bearing) {
    var radialLat1 = originLat[0] / 180 * Math.PI;
    var radialLon1 = originLon[1] / 180 * Math.PI;
    var radialBearing = bearing / 180 * Math.PI;
    var radialDistance = distance / 6371010;
    var radialLat2 = Math.asin(Math.sin(radialLat1) * Math.cos(radialDistance) + Math.cos(radialLat1) * Math.sin(radialDistance) * Math.cos(radialBearing));

    var radialLon2;
    if (Math.abs(Math.cos(radialLat2)) < 0.000001) {
      radialLon2 = radialLon1;
    } else {
      radialLon2 = ((radialLon1 - Math.asin(Math.sin(radialBearing) * Math.sin(radialDistance) / Math.cos(radialLat2)) + Math.PI) % (2 * Math.PI)) - Math.PI;
    }

    var lat2 = radialLat2 / Math.PI * 180;
    var lon2 = radialLon2 / Math.PI * 180;
    var resultLatLon = [lat2, lon2];
    return (resultLatLon);
    // returns an array for easy use.
}

function haversine (pointA, pointB) {
    // 'd' presumably refers to 'delta'.
    var dLat = (pointB[0] - pointA[0]) / 180 * Math.PI;
    var dLon = (pointB[1] - pointA[1]) / 180 * Math.PI;
    var latA = (pointA[0]) / 180 * Math.PI;
    var latB = (pointB[0]) / 180 * Math.PI;

    // apparently magic...
    var a = Math.pow(Math.sin(dLat / 2), 2) + Math.pow(Math.sin(dLon / 2), 2) * Math.cos(latA) * Math.cos(latB);
    var c = 2 * Math.asin(Math.sqrt(a));
    return 6371010 * c;
}

function getSquareBoundingBox(originLatLon, distanceInYards) {
  var ne = inverseHaversine(originLatLon, Math.sqrt(2 * distanceInYards * distanceInYards), 315);
  var sw = inverseHaversine(originLatLon, Math.sqrt(2 * distanceInYards * distanceInYards), 135);
  var boundingBox = [ne, sw];
  return boundingBox;
}

/* Copyright © 2017 Avi Glozman and Terrance Li*/
// Based on psuedo-code written by Terrance Li

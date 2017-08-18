'use strict';
module.exports = function(app) {
  var aspaceController = require("./controllers.js");
  var aspaceAlgorithm = require("./navigation.js");

  //PING ENDPOINT
  app.get("/api/ping", function (req, res) {
    res.json("pong");
  });

  // NAV ALGORITHM
  app.route("/api/navigate/")
    .post(aspaceAlgorithm.FindRoute);

  //SPOTS ENDPOINTS
  app.route("/api/spots/single")
    .post(aspaceController.SpotsSingle);

  app.route("/api/spots/onscreen")
    .post(aspaceController.SpotsOnscreen);

  app.route("/api/spots/status")
    .post(aspaceController.SpotsStatus);

  app.route("/api/spots/add")
    .post(aspaceController.SpotsAdd);

  app.route("/api/spots/getall")
    .post(aspaceController.SpotsGetAll);

  //AUTH ENDPOINTS
  app.route("/api/users/auth/pin")
    .post(aspaceController.AuthPin);

  app.route("/api/users/auth/verify")
    .post(aspaceController.AuthVerify);

  app.route("/api/users/auth/reauth")
    .post(aspaceController.AuthReauth);

  //PROFILE ENDPOINTS
  app.route("/api/users/profile/update")
    .post(aspaceController.ProfileUpdate);

  app.route("/api/users/profile/get")
    .post(aspaceController.ProfileGet);

  //Profile cars
  app.route("/api/users/profile/cars/add")
    .post(aspaceController.CarsAdd);

  app.route("/api/users/profile/cars/remove")
    .post(aspaceController.CarsRemove);

  app.route("/api/users/profile/cars/update")
    .post(aspaceController.CarsUpdate);

  app.route("/api/users/profile/cars/get")
    .post(aspaceController.CarsGet);

  //Profile locations
  app.route("/api/users/profile/locs/add")
    .post(aspaceController.LocsAdd);

  app.route("/api/users/profile/locs/remove")
    .post(aspaceController.LocsRemove);

  app.route("/api/users/profile/locs/update")
    .post(aspaceController.LocsUpdate);

  app.route("/api/users/profile/locs/get")
    .post(aspaceController.LocsGet);

  //User delete
  app.route("/api/users/delete")
    .post(aspaceController.UserDelete);
}

/* Copyright © 2017 Avi Glozman and Terrance Li */

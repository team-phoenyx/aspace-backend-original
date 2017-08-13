'use strict';
module.exports = function(app) {
  var aspaceController = require("./controllers.js");

  //SPOTS

  app.route("/api/spots/single/")
    .post(aspaceController.SpotsSingle);

  app.route("/api/spots/onscreen/")
    .post(aspaceController.SpotsOnscreen);

  app.route("/api/spots/onscreen")
    .post(aspaceController.SpotsStatus);

  //AUTH

  app.route("/api/users/auth/pin/")
    .post(aspaceController.AuthPin);

  app.route("/api/users/auth/verify/")
    .post(aspaceController.AuthVerify);

  app.route("/api/users/auth/reauth")
    .post(aspaceController.AuthReauth);

  // PROFILE (GET & UPDATE)

  app.route("/api/users/profile/update/")
    .post(aspaceController.ProfileUpdate);

  app.route("/api/users/profile/get/")
    .post(aspaceController.ProfileGet);

  // PROFILE (CARS)

  app.route("/api/users/profile/cars/add/")
    .post(aspaceController.CarsAdd);

  app.route("/api/users/profile/cars/remove")
    .post(aspaceController.CarsRemove);

  app.route("/api/users/profile/cars/update/")
    .post(aspaceController.CarsUpdate);

  app.route("/api/users/profile/cars/get/")
    .post(aspaceController.CarsGet);

  // PROFILE (LOCS)

  app.route("/api/users/profile/locs/add/")
    .post(aspaceController.LocsAdd);

  app.route("/api/users/profile/locs/remove")
    .post(aspaceController.LocsRemove);

  app.route("/api/users/profile/locs/update/")
    .post(aspaceController.LocsUpdate);

  app.route("/api/users/profile/locs/get/")
    .post(aspaceController.LocsGet);

}

'use strict';
var express = require('express'),
    app = express(),
    port = process.env.PORT || 3002,
    mongoose = require('mongoose'),
    colors = require("colors"),
    bodyParser = require('body-parser');

//MONGODB
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/aspaceDB', { useMongoClient: true });
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log("MongoDB is connected!".random);
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var routes = require("./routes.js");
routes(app);

app.listen(port);
console.log("ASPACE-API (DEV) is live.");

/* Copyright © 2017 Avi Glozman*/

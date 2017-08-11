'use strict';
var express = require('express'),
    app = express(),
    port = process.env.PORT || 3002,
    mongoose = require('mongoose'),
    mysql   = require("mysql"),
    colors = require("colors"),
    bodyParser = require('body-parser');

var mysql_db = 'aspace';

//MONGODB
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/aspaceDB/?ssl=true', { useMongoClient: true });
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log("MongoDB is connected!".random);
});

//MYSQL
var server = '138.68.241.101';
var local = 'localhost';

var con = mysql.createConnection({
  host: local;
  user: "avi",
  password: "gCz%FpWxkDn6#bIw",
  database :  mysql_db,
  timeout  : 5000,
  multipleStatements: true
});

con.connect(function(err) {
  if (err) throw err;
  console.log(`MySQL is connected!`.random);
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var routes = require('routes.js');
routes(app);

app.listen(port);
console.log("ASPACE-API is live.");

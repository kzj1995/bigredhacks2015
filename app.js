"use strict";
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');
var session = require('express-session')

var config = require('./config.js');

var routes = require('./routes/index');
var users = require('./routes/users');
var apiRoute = require('./routes/api');
var authRoute = require('./routes/auth');

var app = express();

var passport = require("passport");

//mongoose setup
var mongoose = require('mongoose');
mongoose.connect(process.env.MONGOLAB_URI || 'mongodb://localhost/bigredhacks');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({ secret: config.setup.cookie_secret }));
app.use(passport.initialize());
app.use(passport.session());
app.use(require('less-middleware')(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
//app.use(expressValidator);


function requireAuthentication(req,res, next) {
    if (req.user) {
        next();
    }
    else res.status(401).send("User is not logged in.");
}

app.use('/', routes);
app.use('/',authRoute);
app.use('/users', requireAuthentication, users);
app.use('/api', apiRoute);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

//@todo move to setup
//@todo force synchronous
//loading colleges
require('./scripts/load_colleges.js')(function(err, res) {
    if (err) {
        console.log(err);
    }
    console.log(res);
});

module.exports = app;
"use strict";
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');
var validator = require('validator');
var session = require('express-session');
var flash = require('connect-flash');

var config = require('./config.js');

var routes = require('./routes/index');
var user = require('./routes/user');
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
app.use(bodyParser.urlencoded({extended: false}));
//@todo expressValidator does support isMobilePhone, but their dependencies are out of date. Rather than using npm shrinkwrap, I opted for a custom validator.
//this should be removed once expressValidator uses validator version >3.38.0
app.use(expressValidator({
    customValidators: {
        isMobilePhone: function (value, locale) {
            return validator.isMobilePhone(value, locale);
        },
        //optional only checks undefined, not truthiness
        optionalOrisURL: function (value) {
            return !value || validator.isURL(value);
        },
        optionalOrLen: function (value, min, max) {
            return !value || validator.isLength(value, min, max);
        }
    }
}));
app.use(cookieParser());
app.use(flash());
app.use(session({
    secret: config.setup.cookie_secret,
    saveUninitialized: false,
    resave: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(require('less-middleware')(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));


var _requireAuthentication = function (req, res, next) {
    if (req.user) {
        next();
    }
    else {
        req.flash('error', 'Please login first.');
        res.redirect('/login');
    }
};

app.use('/', routes);
app.use('/', authRoute);
app.use('/user', _requireAuthentication, user);
app.use('/api', apiRoute);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


//app.locals definitions
app.locals.viewHelper = require("./views/helper.js");

//@todo move to setup
//@todo force synchronous
//loading colleges
require('./scripts/load_colleges.js').loadOnce(function (err) {
});

module.exports = app;
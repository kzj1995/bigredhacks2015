"use strict";
var express = require('express');
var socket_io = require('socket.io');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');
var validator = require('validator');
var session = require('cookie-session');
var flash = require('express-flash');
var compression = require('compression');

var config = require('./config.js');

var app = express();
var io = socket_io();
app.io = io;
var subdomain = require('subdomain');
var routes = require('./routes/index');
var user = require('./routes/user')(app.io);
var admin = require('./routes/admin');
var apiRoute = require('./routes/api/api');
var apiAdminRoute = require('./routes/api/admin');
var authRoute = require('./routes/auth');
var middle = require('./routes/middleware');

var passport = require("passport");

//mongoose setup
var mongoose = require('mongoose');
mongoose.connect(process.env.COMPOSE_URI || process.env.MONGOLAB_URI || 'mongodb://localhost/bigredhacks');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


app.use(compression());
app.use(favicon(__dirname + '/public/favicon.ico'));
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
    name: 'brh:sess',
    secret: config.setup.cookie_secret
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(require('less-middleware')(path.join(__dirname, 'public')));

if (app.get('env') === 'production') {

    app.use(require('express-uglify').middleware({src: path.join(__dirname, '/public'), logLevel: 'none'}));
    var oneDay = 86400000;
    app.use(express.static(path.join(__dirname, 'public'), {maxAge: oneDay}));

}
else {
    app.use(express.static(path.join(__dirname, 'public')));
}

app.use(subdomain({base: config.setup.url}));

//generic middleware function
app.use(middle.allRequests);

//setup routes
app.use('/subdomain/fa14/', express.static(__dirname + '/brh_old/2014/fa14'));
/*app.use('/subdomain/fa15/', function(req,res,next) {
 // res.redirect('/*');
 });*/
//requireAuthentication must come before requireNoAuthentication to prevent redirect loops
app.use('/', routes);
app.use('/api/admin', middle.requireAdmin, apiAdminRoute);
app.use('/api', apiRoute);

app.use('/admin', middle.requireAdmin, admin);
app.use('/user', middle.requireAuthentication, user);
app.use('/', authRoute); //todo mount on separate route to allow use of noAuth without disabling 404 pages


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
    res.render('404', {});
});


//app.locals definitions
app.locals.viewHelper = require("./util/views_helper.js");
app.locals.enums = require("./models/enum.js");
app.locals.middlehelp = require("./routes/middleware").helper;

//@todo move to setup
//@todo force synchronous
//loading colleges
require('./util/load_colleges.js').loadOnce(function (err) {
    if (err) {
        console.log(err);
    }
});

module.exports = app;
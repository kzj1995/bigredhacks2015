"use strict";
var express = require('express');
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

var subdomain = require('subdomain');
var routes = require('./routes/index');
var user = require('./routes/user');
var admin = require('./routes/admin');
var apiRoute = require('./routes/api/api');
var apiAdminRoute = require('./routes/api/admin');
var authRoute = require('./routes/auth');

var app = express();

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

var _requireNoAuthentication = function (req, res, next) {
    if (req.user) {
        res.redirect('/user/dashboard')
    }
    else {
        next();
    }
};

var _requireAuthentication = function (req, res, next) {
    if (req.user) {
        next();
    }
    else {
        req.flash('error', 'Please login first.');
        res.redirect('/login');
    }
};

var _requireAdmin = function (req, res, next) {
    if(req.user) {
        var adminemails = config.setup.admin_emails.split(" ");
        if (adminemails.indexOf(req.user.email) > -1) {
            next();
        }
    }
    else if (req.originalUrl == "/admin/login") {
        next();
    }
    else {
        req.flash('error', 'Please login first.');
        res.redirect('/admin/login');
    }
};

//generic middleware function
app.use(function(req,res,next) {
    res.locals.isUser = !!req.user;
    res.locals.currentUrl = req.url;
    next();
});

//setup routes
app.use('/subdomain/fa14/', express.static(__dirname + '/brh_old/2014/fa14'));
/*app.use('/subdomain/fa15/', function(req,res,next) {
   // res.redirect('/*');
});*/
//requireAuthentication must come before requireNoAuthentication to prevent redirect loops
app.use('/', routes);
app.use('/api/admin', apiAdminRoute);
app.use('/api', apiRoute);
app.use('/admin', _requireAdmin, admin);
app.use('/user', _requireAuthentication, user);
app.use('/', _requireNoAuthentication, authRoute);



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
    res.render('404', {
    });
});


//app.locals definitions
app.locals.viewHelper = require("./util/views_helper.js");


//@todo move to setup
//@todo force synchronous
//loading colleges
require('./util/load_colleges.js').loadOnce(function (err) {
    if (err) {
        console.log(err);
    }
});

module.exports = app;
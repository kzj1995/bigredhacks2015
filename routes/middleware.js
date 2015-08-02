var config = require('../config');
var middle = {};

middle.requireNoAuthentication = function (req, res, next) {
    if (req.user) {
        return res.redirect('/user/dashboard')
    }
    else {
        return next();
    }
};

middle.requireAuthentication = function (req, res, next) {
    if (req.user) {
        return next();
    }
    else {
        req.flash('error', 'Please login first.');
        return res.redirect('/login');
    }
};

middle.requireAdmin = function (req, res, next) {
    if (req.user && (req.user.role === "admin" || req.user.email == config.admin.email)) {
        return next();
    }
    else {
        req.flash('error', 'Please login first.');
        return res.redirect('/login');
    }
};

middle.allRequests = function (req, res, next) {
    res.locals.isUser = !!req.user;
    res.locals.currentUrl = req.url;
    next();
};

middle.requireRegistrationOpen = function (req, res, next) {
    if (config.admin.reg_open == "true") {
        return next();
    }
    else {
        return res.redirect('/');
    }
};

middle.helper = {
    isRegistrationOpen: function() {
        if (config.admin.reg_open == "true") {
            return true;
        }
        else return false;
    }
};

module.exports = middle;
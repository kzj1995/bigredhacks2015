"use strict";
var config = require('../config');
var middle = {};

function _isRegistrationOpen() {
    if (config.admin.reg_open) {
        return true;
    }
    else {
        return false;
    }
}

function _isCornellRegistrationOpen() {
    if (config.admin.cornell_reg_open) {
        return true;
    }
    else {
        return false;
    }
}

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
    if (_isRegistrationOpen()) {
        return next();
    }
    else {
        return res.redirect('/');
    }
};

middle.requireCornellRegistrationOpen = function (req, res, next) {
    if (_isCornellRegistrationOpen()) {
        return next();
    }
    else {
        return res.redirect('/');
    }
}

middle.helper = {
    isRegistrationOpen: _isRegistrationOpen
};

module.exports = middle;
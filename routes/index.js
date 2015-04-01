"use strict";
var express = require('express');
var router = express.Router();
var userController = require('../controllers/controller.js');

/* GET home page. */
router.get('/', function(req, res, next) {
<<<<<<< HEAD
    res.render('index', { title: 'Express' });
=======
  res.render('index', { title: 'Home' });
>>>>>>> FETCH_HEAD
});

router.get('/registration', function(req, res, next) {
    res.render('registration', { title: 'Registration' });
});

router.post('/adduser', function(req, res) {
    return userController.create(req,res);
});

module.exports = router;

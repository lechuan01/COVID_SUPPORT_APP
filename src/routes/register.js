const express = require('express');
// const User = require('../models/user');
const UserController = require('../controllers/UserController');
const router = express.Router();

// const user = new User();
router.get('/', (req, res, next) => {
    // res.send('List of menus');
    res.render('register');
});

// Post register data
router.post('/',UserController.register);
module.exports = router;
const express = require('express');
const router = express.Router();

// Correct relative path if dashboardRoutes.js is in the same folder
const dashboardRoutes = require('./dashboardRoutes.js');

// Dashboard route
router.get('/dashboard', (req, res) => {
    // Assuming you have a dashboard.ejs file in your views folder
    res.render('dashboard');
});

module.exports = router;

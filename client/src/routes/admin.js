const express = require('express');

const router = express.Router();
const User = require('../models/User');

// Admin panel endpoint to fetch all user records
router.get('/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

module.exports = router;

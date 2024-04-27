const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  mobileNumber: String,
  profilePicture: String,
  password: String,
  emailVerified: Boolean,
  mobileVerified: Boolean,
});

module.exports = mongoose.model('User', UserSchema);

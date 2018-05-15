'use strict';

const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const User = new mongoose.Schema({
  username: {type: String, required: true, unique: true, index: true, uniqueCaseInsensitive: true},
  email: {type: String, required: true, unique: true, index: true, uniqueCaseInsensitive: true},
  password: {type: String, required: true}
});

User.plugin(uniqueValidator, {message: '{PATH} is in use'});

User.pre('save', function (next) {
  if (!this.isModified('password')) return next();
  bcrypt.hash(this.password, saltRounds, (err, res) => {
    if (err) return next(err);
    this.password = res;
    next();
  });
});

User.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password)
};

module.exports = mongoose.model('user', User);
'use strict';

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('./user');
const mongoose = require('mongoose');

const urlencoded = bodyParser.urlencoded({extended: false});

const wrapAsync = fn => (req, res) => fn(req, res).catch(err => {
  console.error(err);
  res.status(500).send('Internal Server Error');
});

passport.use(new LocalStrategy((username, password, done) => {
  User.findOne({username}, (err, user) => {
    if (err) return done(err);
    if (!user) return done();
    user.comparePassword(password)
      .then(match => match ? done(null, user) : done())
      .catch(err => done(err));
  });
}));

passport.serializeUser((user, done) => {
  done(null, {id: user.id});
});

passport.deserializeUser((id, done) => {
  done(null, {id});
});

async function signup(req, res) {
  const {username, password, password_confirm, email} = req.body;
  let errors = [];
  if (!password || !password_confirm || password !== password_confirm) {
    errors.push('passwords do not match');
  }
  const user = new User({username, password, email});
  try {
    await user.save();
  } catch (e) {
    if (e instanceof mongoose.Error.ValidationError) {
      errors = errors.concat(Object.keys(e.errors).map(key => e.errors[key].message));
    } else throw e;
  }
  if (errors.length > 0) {
    return res.status(200).json({errors});
  }
  res.status(200).json({success: true});
}

module.exports = ({SESSION_SECRET}) => {
  if (!SESSION_SECRET) throw new Error('SESSION_SECRET must be defined');

  const app = express();
  app.use(session({secret: SESSION_SECRET, resave: false, saveUninitialized: false}));
  app.use(passport.initialize());
  app.use(passport.session());

  app.post('/signin', urlencoded, passport.authenticate('local'), (req, res) => {
    res.status(200).json({success: true});
  });

  app.post('/signup', urlencoded, wrapAsync(signup));

  return app;
};
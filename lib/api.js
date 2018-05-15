'use strict';

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const urlencoded = bodyParser.urlencoded({extended: false});
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const catch_ = fn => (req, res) => fn(req, res).catch(err => {
  console.error(err);
  res.status(500).send('Internal Server Error');
});

function mkAPI({app, SESSION_SECRET}) {
  const User = app.User;
  const mongoose = app.Mongoose;

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
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    User.findById(id, (err, res) => {
      if (err) done(err);
      else if (!res) done('deserializeUser(): findById is null');
      else done(null, res);
    });
  });

  const api = express();
  api.use(session({secret: SESSION_SECRET, resave: false, saveUninitialized: false}));
  api.use(passport.initialize());
  api.use(passport.session());

  api.post('/signin', urlencoded, passport.authenticate('local'), (req, res) => {
    res.status(200).json({success: true});
  });

  api.post('/signup', urlencoded, catch_(async (req, res) => {
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
    if (errors.length > 0) res.status(200).json({errors});
    else res.status(200).json({success: true});
  }));

  return api;
}

module.exports = mkAPI;
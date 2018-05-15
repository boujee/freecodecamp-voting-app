'use strict';

const mongoose = require('mongoose');
const https = require('https');
const http = require('http');
const User = require('./user');
const api = require('./api');

const openServer = (port, server) => new Promise((resolve, reject) => {
  server.listen(port, () => resolve());
});

const closeServer = server => new Promise((resolve, reject) => {
  server.close(() => resolve());
});

const closeMongo = mongo => new Promise((resolve, reject) => {
  mongo.disconnect(() => resolve());
});

class App {
  constructor(server) {
    this.server = server;
  }
  port() {
    return this.server.address().port;
  }
  async shutdown() {
    await Promise.all([closeServer(this.server), closeMongo(mongoose)]);
  }
  static async start(env) {
    const {PORT = 8080, MONGO_URI, USE_HTTPS, ADD_TEST_USER} = env;
    if (!MONGO_URI) throw new Error('MONGO_URI must be defined');
    await mongoose.connect(MONGO_URI);
    if (ADD_TEST_USER) {
      await User.remove();
      await (new User({username: 'test', email: 'test@mail.com', password: 'test'})).save();
      console.log('Added test user');
    }
    const server = (USE_HTTPS ? https : http).createServer(api(env));
    await openServer(PORT, server);
    return new App(server);
  }
}

module.exports = App;
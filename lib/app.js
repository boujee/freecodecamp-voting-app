'use strict';

const Mongoose = require('mongoose');
const https = require('https');
const http = require('http');
const User = require('./user');
const mkAPI = require('./api');

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
  constructor(server, mongoose) {
    this.server = server;
    this.mongoose = mongoose;
  }
  port() {
    return this.server.address().port;
  }
  get User() {
    return this.mongoose.model('user');
  }
  get Mongoose() {
    return this.mongoose;
  }
  async shutdown() {
    await Promise.all([closeServer(this.server), closeMongo(this.mongoose)]);
  }
  static async start({PORT = 8080, MONGO_URI, USE_HTTPS, ADD_TEST_USER, SESSION_SECRET}) {
    if (!MONGO_URI) throw new Error('MONGO_URI not defined');
    const mongoose = await Mongoose.connect(MONGO_URI);
    mongoose.model('user', User);
    const app = new App(null, mongoose);
    const api = mkAPI({app, SESSION_SECRET});
    app.server = (USE_HTTPS ? https : http).createServer(api);
    await openServer(PORT, app.server);
    if (ADD_TEST_USER) {
      console.log('Using test user');
      await app.User.remove();
      const user = new app.User({username: 'test', email: 'test@mail.com', password: 'test'});
      await user.save();
    }
    return app;
  }
}

module.exports = App;
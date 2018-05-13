'use strict';

import express from 'express';
import Mongoose from 'mongoose';
import https from 'https';

const openServer = (port, server) => new Promise((resolve, reject) => {
  server.listen(port, () => resolve());
});

const closeServer = server => new Promise((resolve, reject) => {
  server.close(() => resolve());
});

const closeMongo = mongo => new Promise((resolve, reject) => {
  mongo.disconnect(() => resolve());
});

/*
const openMongo = (mongo, uri) => new Promise((resolve, reject) => {
  mongo.connect(uri).then(m => resolve(m)).catch(err => reject(err))
});
*/

export default class App {
  constructor(server, mongoose) {
    this.server = server;
    this.mongoose = mongoose;
  }
  port() {
    return this.server.address().port;
  }
  async shutdown() {
    await Promise.all([closeServer(this.server), closeMongo(this.mongoose)]);
  }
  static async start({PORT = 8080, MONGO_URI}) {
    const app = express();
    const server = https.createServer(app);
    const mongoose = await Mongoose.connect(MONGO_URI);
    await openServer(PORT, server);
    return new App(server, mongoose);
  }
}
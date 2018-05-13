'use strict';

import {App} from '..';

async function boot() {
  const app = await App.start(process.env);
  console.log(`listening on ${app.port()}`);
}

boot().catch(console.error);
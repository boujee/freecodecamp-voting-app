'use strict';

import {App} from '..';
import supertest from 'supertest';
import {expect} from 'chai';

let app = null;

before(async () => {
  app = await App.start(process.env);
});

after(async () => {
  if (app) await app.shutdown();
});

describe('/signin', () => {
  it('sends 401 when credentials', () => 
    supertest(app).post('/signin').expect(401)
  );
  it('sends 200 with cookie', async () => {
    const res = await supertest(app).post('/signin')
      .field('username', 'test')
      .field('password', 'mypass')
      .expect(200);
    expect(res.header).to.haveOwnProperty('Set-Cookie');
  });
});

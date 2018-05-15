'use strict';

const {App} = require('..');
const supertest = require('supertest');
const {expect} = require('chai');

let app = null;

const request = (a = app) => supertest(app.server);
async function clearDB() {
  await app.User.remove();
}

before(async () => {
  app = await App.start(process.env);
  await clearDB();
});

afterEach(async () => {
  await clearDB();
});

after(async () => {
  if (app) await app.shutdown();
});

describe('POST /signin', () => {
  beforeEach(async () => {
    const u = new app.User({username: 'test', password: 'mypass', email: 'email'});
    await u.save();
  });
  it('sends 401 when passwords dont match', () =>
    request().post('/signin')
      .send('username=test')
      .send('password=test')
      .expect(401)
  );
  it('sends 200 with cookie when success', () =>
    request().post('/signin')
      .send('username=test')
      .send('password=mypass')
      .expect(200)
      .then(res => {
        expect(Object.keys(res.header).map(it => it.toLowerCase())).to.contain('set-cookie');
      })
  );
});

describe('POST /signup', () => {
  beforeEach(async () => {
    const u = new app.User({username: 'test', password: 'mypass', email: 'email'});
    await u.save();
  });
  it('fails if username is in use', async () => {
    const res = await request().post('/signup')
      .send('username=test')
      .send('password=pass')
      .send('password_confirm=pass')
      .send('email=user@mail.com')
      .expect(200);
    expect(res.body).to.haveOwnProperty('errors');
    expect(res.body.errors).to.satisfy(errors =>
      errors.some(err => err.match(/username/))
    );
  });
  it('fails if passwords do not match', async () => {
    const res = await request().post('/signup')
      .send('username=test')
      .send('password=pass')
      .send('password_confirm=pass1')
      .send('email=user@mail.com')
      .expect(200);
    expect(res.body).to.haveOwnProperty('errors');
    expect(res.body.errors).to.satisfy(errors =>
      errors.some(err => err.match(/password/))
    );
  });
  it('fails if email is in use', async () => {
    const res = await request().post('/signup')
      .send('username=test')
      .send('password=pass')
      .send('password_confirm=pass')
      .send('email=email')
      .expect(200);
    expect(res.body).to.haveOwnProperty('errors');
    expect(res.body.errors).to.satisfy(errors =>
      errors.some(err => err.match(/email/))
    );
  });
  it('fails on empty fields', async () => {
    const res = await request().post('/signup')
      .send('username=')
      .send('password=')
      .send('password_confirm=')
      .send('email=')
      .expect(200);
    expect(res.body).to.haveOwnProperty('errors');
    expect(res.body.errors).to.satisfy(errors =>
      errors.some(err => err.match(/email/)) &&
      errors.some(err => err.match(/username/)) &&
      errors.some(err => err.match(/password/))
    );
  });
});
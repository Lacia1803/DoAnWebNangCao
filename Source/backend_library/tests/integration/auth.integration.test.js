// Integration tests for auth endpoints using an in-memory sqlite DB
process.env.NODE_ENV = 'test';
process.env.TEST_SQLITE = 'true';

const request = require('supertest');
const { hashInternalCode } = require('../../utils/internalCode');

let app;
let sequelize;
const Setting = require('../../models/setting');

beforeAll(async () => {
  // require app after env vars set
  app = require('../../index');
  sequelize = require('../../configdatabase');
  // sync models
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  try { await sequelize.close(); } catch (e) { /* ignore */ }
});

describe('Auth integration - register with internal admin code', () => {
  test('register admin should fail with wrong code', async () => {
    // ensure default behavior (no setting) still requires '1836' as default
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'iuser1', email: 'i1@example.com', password: 'Passw0rd!', role: 'admin', internalCode: 'wrong' })
      .expect(403);

    expect(res.body.success).toBe(false);
  });

  test('register admin should succeed with correct hashed code in db', async () => {
    // create hashed setting
    const hashed = await hashInternalCode('1836');
    await Setting.create({ key: 'internalAdminCode', value: hashed });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'iadmin', email: 'admin@example.com', password: 'Passw0rd!', role: 'admin', internalCode: '1836' })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
  });
});

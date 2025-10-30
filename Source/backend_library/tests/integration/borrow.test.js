const request = require('supertest');
const app = require('../../index');

describe('Borrow API base integration', () => {
  it('GET /api/borrows should require authentication', async () => {
    const res = await request(app).get('/api/borrows');
    expect(res.statusCode).toBe(401);
  });

  it('Unknown route under /api/borrows should return 404', async () => {
    const res = await request(app).get('/api/borrows/unknown');
    // Our router has no /unknown; express 404 handler should catch it
    expect(res.statusCode).toBe(404);
  });
});

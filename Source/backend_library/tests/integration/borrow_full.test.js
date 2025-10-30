const request = require('supertest');
const app = require('../../index');

// Helper to register and login user to get token
async function getAuthToken(email = 'borrower@example.com') {
  const username = 'borrower_' + Math.random().toString(36).slice(2, 7);
  const password = 'Str0ngP@ss!';

  await request(app).post('/api/auth/register').send({ username, email, password });
  const res = await request(app).post('/api/auth/login').send({ email, password });
  return res.body?.data?.token || res.body?.token;
}

// Simple admin token helper: create admin user if needed
async function getAdminToken() {
  const email = 'admin.borrow@example.com';
  const username = 'adminBorrow';
  const password = 'Adm1nP@ss!';

  // Try register; ignore duplicate
  await request(app).post('/api/auth/register').send({ username, email, password, role: 'admin', internalCode: '1836' });
  const res = await request(app).post('/api/auth/login').send({ email, password });
  return res.body?.data?.token || res.body?.token;
}

function futureDate(days = 14) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

describe('Borrow API full flow', () => {
  let token;
  let adminToken;

  beforeAll(async () => {
    token = await getAuthToken('borrower1@example.com');
    adminToken = await getAdminToken();
  });

  it('should borrow a book successfully and decrease stock', async () => {
    // Pick a known book ID (1) from seed
    const due = futureDate(7);
    const res = await request(app)
      .post('/api/borrows')
      .set('Authorization', `Bearer ${token}`)
      .send({ bookId: 1, dueDate: due });

    expect([200,201]).toContain(res.statusCode);
    expect(res.body).toHaveProperty('borrow');
    expect(res.body.borrow).toHaveProperty('book');
    expect(res.body.borrow.book.id).toBe(1);
  });

  it('should prevent borrowing the same book twice without returning', async () => {
    const due = futureDate(7);
    const res = await request(app)
      .post('/api/borrows')
      .set('Authorization', `Bearer ${token}`)
      .send({ bookId: 1, dueDate: due });

    expect(res.statusCode).toBe(400);
  });

  it('should list my borrows', async () => {
    const res = await request(app)
      .get('/api/borrows/my')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('admin can list all borrows (paginated)', async () => {
    const res = await request(app)
      .get('/api/borrows?page=1&limit=5')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('borrows');
    expect(Array.isArray(res.body.borrows)).toBe(true);
  });

  it('should return a borrowed book and increase stock', async () => {
    // Get my borrows to find an active one
    const list = await request(app)
      .get('/api/borrows/my')
      .set('Authorization', `Bearer ${token}`);
    const active = list.body.find(b => b.status === 'borrowed');
    expect(active).toBeTruthy();

    const res = await request(app)
      .post(`/api/borrows/${active.id}/return`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('borrow');
    expect(res.body.borrow.status).toBe('returned');
  });
});

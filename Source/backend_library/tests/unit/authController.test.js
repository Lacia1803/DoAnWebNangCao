jest.mock('../../models/user', () => ({
  findOne: jest.fn(),
  count: jest.fn(),
  create: jest.fn()
}));

jest.mock('../../utils/internalCode', () => ({
  compareInternalCode: jest.fn()
}));

jest.mock('jsonwebtoken', () => ({ sign: jest.fn(() => 'fake-token') }));
jest.mock('bcryptjs', () => ({ hash: jest.fn(() => 'hashedpw') }));

const User = require('../../models/user');
const { compareInternalCode } = require('../../utils/internalCode');
const authController = require('../../controllers/authController');

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('authController.register admin-code behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should forbid registration when internal code invalid', async () => {
    const req = { body: { username: 'u', email: 'e@example.com', password: 'pass', role: 'admin' } };
    const res = makeRes();

    User.findOne.mockResolvedValue(null);
    User.count.mockResolvedValue(0);
    compareInternalCode.mockResolvedValue(false);

    await authController.register(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalled();
    const payload = res.json.mock.calls[0][0];
    expect(payload).toHaveProperty('message');
    expect(payload.success).toBe(false);
  });

  test('should create user when internal code valid', async () => {
    const req = { body: { username: 'u2', email: 'u2@example.com', password: 'pass', role: 'admin' } };
    const res = makeRes();

    User.findOne.mockResolvedValue(null);
    User.count.mockResolvedValue(0);
    compareInternalCode.mockResolvedValue(true);
    User.create.mockResolvedValue({ id: 5, username: 'u2', email: 'u2@example.com', role: 'admin', toJSON: () => ({ id: 5, username: 'u2', email: 'u2@example.com', role: 'admin' }) });

    await authController.register(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalled();
    const payload = res.json.mock.calls[0][0];
    expect(payload).toHaveProperty('data');
    expect(payload.data).toHaveProperty('token');
  });
});

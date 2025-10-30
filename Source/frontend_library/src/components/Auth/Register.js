import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    internalCode: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return false;
    }
    // Khi đăng ký admin, kiểm tra mã nội bộ client-side
    if (formData.role === 'admin') {
      if (!formData.internalCode || String(formData.internalCode).trim().length < 3) {
        setError('Mã nội bộ không hợp lệ (ít nhất 3 ký tự)');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const { confirmPassword, ...userData } = formData;
      await register(userData);
      setSuccess('Đăng ký thành công! Chuyển hướng...');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (error) {
      const apiMessage = error.response?.data?.message;
      const details = error.response?.data?.errors;
      const detailText = Array.isArray(details) ? details.map(d => d.msg || d).join('; ') : '';
      const finalMsg = apiMessage || detailText || error.message || 'Đăng ký thất bại';
      setError(finalMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid className="vh-100 d-flex align-items-center justify-content-center bg-light">
      <Row className="w-100">
        <Col md={8} lg={5} className="mx-auto">
          <Card className="shadow-lg border-0">
            <Card.Body className="p-5">
              <div className="text-center mb-4">
                <h2 className="fw-bold text-primary">📚 Library System</h2>
                <p className="text-muted">Tạo tài khoản mới</p>
              </div>

              {error && (
                <Alert variant="danger" className="mb-3">
                  {error}
                </Alert>
              )}

              {success && (
                <Alert variant="success" className="mb-3">
                  {success}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Tên người dùng</Form.Label>
                      <Form.Control
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="Nhập tên người dùng"
                        required
                        disabled={loading}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Nhập email"
                        required
                        disabled={loading}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Mật khẩu</Form.Label>
                      <Form.Control
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Nhập mật khẩu"
                        required
                        disabled={loading}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Xác nhận mật khẩu</Form.Label>
                      <Form.Control
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Nhập lại mật khẩu"
                        required
                        disabled={loading}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Vai trò</Form.Label>
                  <Form.Select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <option value="user">Người dùng</option>
                    <option value="admin">Quản trị viên</option>
                  </Form.Select>
                </Form.Group>

                {formData.role === 'admin' && (
                  <Form.Group className="mb-3">
                    <Form.Label className="d-flex align-items-center">
                      Mã nội bộ (bắt buộc để đăng ký Admin)
                      <OverlayTrigger
                        placement="right"
                        overlay={
                          <Tooltip id="internal-code-tooltip">
                            Mã này do admin hiện tại cung cấp. Nếu bạn không có mã, đăng ký với vai trò "Người dùng" và liên hệ admin để được cấp quyền.
                          </Tooltip>
                        }
                      >
                        <span className="ms-2 text-muted" style={{ cursor: 'help' }}>ℹ️</span>
                      </OverlayTrigger>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="internalCode"
                      value={formData.internalCode}
                      onChange={handleChange}
                      placeholder="Nhập mã nội bộ"
                      required
                      disabled={loading}
                    />
                    <Form.Text className="text-muted">
                      Mã tối thiểu 3 ký tự. Thao tác đăng ký Admin yêu cầu mã chính xác từ hệ thống.
                    </Form.Text>
                  </Form.Group>
                )}

                <Button
                  variant="primary"
                  type="submit"
                  className="w-100 py-2 mb-3"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Đang đăng ký...
                    </>
                  ) : (
                    'Đăng ký'
                  )}
                </Button>
              </Form>

              <div className="text-center">
                <p className="mb-0">
                  Đã có tài khoản?{' '}
                  <Link to="/login" className="text-primary text-decoration-none">
                    Đăng nhập ngay
                  </Link>
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Register;

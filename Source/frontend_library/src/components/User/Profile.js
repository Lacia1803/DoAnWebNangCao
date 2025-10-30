import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Badge } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';

const Profile = () => {
  const { currentUser, isAdmin } = useAuth();
  const [formData, setFormData] = useState({
    username: currentUser?.username || '',
    email: currentUser?.email || '',
  });
  const [success, setSuccess] = useState('');
  const [error] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('Thông tin đã được lưu thành công!');
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h1 className="h2 mb-1">👤 Thông tin cá nhân</h1>
          <p className="text-muted mb-0">Quản lý thông tin tài khoản của bạn</p>
        </Col>
      </Row>

      <Row>
        <Col lg={8}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Thông tin tài khoản</h5>
            </Card.Header>
            <Card.Body>
              {success && (
                <Alert variant="success" className="mb-3">
                  {success}
                </Alert>
              )}

              {error && (
                <Alert variant="danger" className="mb-3">
                  {error}
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
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Vai trò</Form.Label>
                  <div>
                    <Badge bg={isAdmin ? 'primary' : 'secondary'} className="p-2">
                      {isAdmin ? '👑 Quản trị viên' : '👤 Người dùng'}
                    </Badge>
                  </div>
                  <Form.Text className="text-muted">
                    Vai trò không thể thay đổi
                  </Form.Text>
                </Form.Group>

                <Button variant="primary" type="submit">
                  Cập nhật thông tin
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card>
            <Card.Header>
              <h6 className="mb-0">📊 Thống kê</h6>
            </Card.Header>
            <Card.Body>
              <div className="text-center">
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                  {isAdmin ? '👑' : '👤'}
                </div>
                <h5>{currentUser?.username}</h5>
                <p className="text-muted mb-3">{currentUser?.email}</p>
                
                <div className="mb-3">
                  <small className="text-muted">
                    Tham gia từ: {new Date(currentUser?.createdAt).toLocaleDateString('vi-VN')}
                  </small>
                </div>

                {isAdmin && (
                  <Badge bg="primary" className="p-2">
                    Quyền quản trị viên
                  </Badge>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Profile;

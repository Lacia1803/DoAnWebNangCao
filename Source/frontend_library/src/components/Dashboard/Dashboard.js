import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { booksAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { FiSun, FiMoon, FiCloud, FiBook, FiPlus, FiPieChart, FiUser } from 'react-icons/fi';
import { MdDashboard } from 'react-icons/md';

const Dashboard = () => {
  const { currentUser, isAdmin } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchRecentBooks();
  }, []);

  const fetchRecentBooks = async () => {
    try {
      const response = await booksAPI.getAll();
      // Chuẩn hoá dữ liệu: có thể là mảng, hoặc { books: [...] }, hoặc ApiResponse { data: { books: [...] } }
      const payload = response.data?.data || response.data || [];
      const list = Array.isArray(payload) ? payload : (payload.books || []);
      // Lấy 6 sách gần nhất
      setBooks(list.slice(0, 6));
    } catch (error) {
      setError('Không thể tải danh sách sách');
    } finally {
      setLoading(false);
    }
  };

  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const compute = () => {
      const hour = new Date().getHours();
      if (hour < 12) return { text: 'Chào buổi sáng', icon: <FiSun className="ms-2" /> };
      if (hour < 18) return { text: 'Chào buổi chiều', icon: <FiCloud className="ms-2" /> };
      return { text: 'Chào buổi tối', icon: <FiMoon className="ms-2" /> };
    };
    setGreeting(compute());
    const t = setInterval(() => setGreeting(compute()), 60 * 1000); // refresh every minute
    return () => clearInterval(t);
  }, []);

  return (
    <Container>
      {/* Welcome Section */}
      <Row className="mb-4">
        <Col>
          <Card className="bg-primary text-white">
            <Card.Body className="py-4">
              <Row className="align-items-center">
                <Col>
                  <h2 className="mb-1">{greeting.text}, {currentUser?.username}! {greeting.icon}</h2>
                  <p className="mb-0 opacity-75">
                    Vai trò: {isAdmin ? <><FiPieChart className="me-1" /> Quản trị viên</> : <><FiUser className="me-1" /> Người dùng</>}
                  </p>
                </Col>
                <Col xs="auto">
                  <FiBook size={64} style={{ opacity: 0.3 }} />
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Quick Stats */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="text-center stats-card mb-3">
            <Card.Body>
              <h3>{books.length}+</h3>
              <p className="mb-0">Sách có sẵn</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center stats-card mb-3" style={{background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)'}}>
            <Card.Body>
              <h3>24/7</h3>
              <p className="mb-0">Truy cập trực tuyến</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center stats-card mb-3" style={{background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'}}>
            <Card.Body>
              <h3>∞</h3>
              <p className="mb-0">Kiến thức</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0"><MdDashboard className="me-2" />Hành động nhanh</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6} lg={3} className="mb-2">
                  <Button 
                    variant="outline-primary" 
                    className="w-100"
                    onClick={() => navigate('/books')}
                  >
                    <FiBook className="me-2" />Xem tất cả sách
                  </Button>
                </Col>
                {isAdmin && (
                  <>
                    <Col md={6} lg={3} className="mb-2">
                      <Button 
                        variant="outline-success" 
                        className="w-100"
                        onClick={() => navigate('/admin/books/new')}
                      >
                        <FiPlus className="me-2" />Thêm sách mới
                      </Button>
                    </Col>
                    <Col md={6} lg={3} className="mb-2">
                      <Button 
                        variant="outline-info" 
                        className="w-100"
                        onClick={() => navigate('/admin/dashboard')}
                      >
                        <FiPieChart className="me-2" />Admin Dashboard
                      </Button>
                    </Col>
                  </>
                )}
                <Col md={6} lg={3} className="mb-2">
                  <Button 
                    variant="outline-secondary" 
                    className="w-100"
                    onClick={() => navigate('/profile')}
                  >
                    <FiUser className="me-2" />Thông tin cá nhân
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Books */}
      <Row>
        <Col>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">📚 Sách mới nhất</h5>
              <Button 
                variant="link" 
                size="sm"
                onClick={() => navigate('/books')}
              >
                Xem tất cả →
              </Button>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : error ? (
                <Alert variant="danger">{error}</Alert>
              ) : books.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted">Chưa có sách nào trong thư viện</p>
                  {isAdmin && (
                    <Button 
                      variant="primary"
                      onClick={() => navigate('/admin/books/new')}
                    >
                      Thêm sách đầu tiên
                    </Button>
                  )}
                </div>
              ) : (
                <Row>
                  {books.map(book => (
                    <Col md={6} lg={4} key={book.id} className="mb-3">
                      <Card className="h-100 book-card">
                        <div className="book-image d-flex align-items-center justify-content-center">
                          <span style={{fontSize: '3rem'}}>📖</span>
                        </div>
                        <Card.Body>
                          <Card.Title className="h6">{book.title}</Card.Title>
                          <Card.Text className="text-muted small">
                            Tác giả: {book.author}
                          </Card.Text>
                          <Button 
                            variant="outline-primary" 
                            size="sm"
                            onClick={() => navigate(`/books/${book.id}`)}
                          >
                            Xem chi tiết
                          </Button>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;

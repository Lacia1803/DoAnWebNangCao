import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Badge, InputGroup, Modal } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { booksAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { toCategoryVN } from '../../utils/labels';
import { FiBook, FiPlus, FiSearch, FiBookOpen, FiGlobe, FiMapPin } from 'react-icons/fi';
import API from '../../services/api';

const BookList = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [bookTypeFilter, setBookTypeFilter] = useState(''); // '', 'online', 'physical'
  const { isAdmin, isVipOrAdmin } = useAuth();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBooks();
  }, []);

  useEffect(() => {
    // Filter by search term and bookType
    let list = books;
    if (searchTerm.trim()) {
      list = list.filter(book =>
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (bookTypeFilter) {
      list = list.filter(book => (book.bookType || 'physical') === bookTypeFilter);
    }
    setFilteredBooks(list);
  }, [searchTerm, bookTypeFilter, books]);

  const fetchBooks = async (params = {}) => {
    try {
      setLoading(true);
      const response = await booksAPI.getAll({ page: 1, limit: 100, order: 'DESC', ...params });
      const data = response.data;
      const list = Array.isArray(data) ? data : (data.books || []);
      setBooks(list);
      // filtered sẽ được cập nhật từ effect filter
    } catch (error) {
      setError('Không thể tải danh sách sách');
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  // Refetch từ server khi filter bookType hoặc search thay đổi
  useEffect(() => {
    const t = setTimeout(() => {
      fetchBooks({ bookType: bookTypeFilter || undefined, search: searchTerm || undefined });
    }, 300);
    return () => clearTimeout(t);
  }, [bookTypeFilter, searchTerm]);

  // Listen for cover updates so the list updates immediately when a book cover changes
  useEffect(() => {
    const handler = (e) => {
      const { id: bookId, coverImage } = e.detail || {};
      if (!bookId) return;
      setBooks(prev => prev.map(b => {
        if (String(b.id) === String(bookId)) {
          return { ...b, coverImage };
        }
        return b;
      }));
    };
    window.addEventListener('bookCoverUpdated', handler);
    return () => window.removeEventListener('bookCoverUpdated', handler);
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleBookClick = (bookId) => {
    navigate(`/books/${bookId}`);
  };

  return (
    <Container>
      {/* Header Section */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h2 mb-1"><FiBook className="me-2" />Thư viện sách</h1>
              <p className="text-muted mb-0">
                Khám phá bộ sưu tập sách phong phú của chúng tôi
              </p>
            </div>
            {isAdmin && (
              <Button
                variant="primary"
                onClick={() => navigate('/admin/books/new')}
              >
                <FiPlus className="me-2" />Thêm sách mới
              </Button>
            )}
          </div>
        </Col>
      </Row>

      {/* Search Section */}
      <Row className="mb-4">
        <Col md={8} lg={6}>
          <InputGroup>
            <Form.Control
              type="text"
              placeholder="Tìm kiếm sách theo tên, tác giả, hoặc thể loại..."
              value={searchTerm}
              onChange={handleSearch}
            />
            <InputGroup.Text><FiSearch /></InputGroup.Text>
          </InputGroup>
        </Col>
        <Col md={4} lg={6} className="d-flex align-items-center justify-content-end gap-2 mt-2 mt-md-0">
          <div className="btn-group" role="group">
            <Button size="sm" variant={bookTypeFilter === '' ? 'primary' : 'outline-primary'} onClick={() => setBookTypeFilter('')}>Tất cả</Button>
            <Button size="sm" variant={bookTypeFilter === 'online' ? 'primary' : 'outline-primary'} onClick={() => setBookTypeFilter('online')}>Trực tuyến</Button>
            <Button size="sm" variant={bookTypeFilter === 'physical' ? 'primary' : 'outline-primary'} onClick={() => setBookTypeFilter('physical')}>Trực tiếp</Button>
          </div>
        </Col>
      </Row>

      {/* Content Section */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Đang tải danh sách sách...</p>
        </div>
      ) : error ? (
        <Alert variant="danger" className="text-center">
          <Alert.Heading>Có lỗi xảy ra</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={fetchBooks}>
            Thử lại
          </Button>
        </Alert>
      ) : filteredBooks.length === 0 ? (
        <div className="text-center py-5">
          {searchTerm ? (
            <div>
              <FiSearch style={{ fontSize: '4rem', marginBottom: '1rem' }} />
              <h3>Không tìm thấy sách</h3>
              <p className="text-muted">
                Không có sách nào khớp với từ khóa "{searchTerm}"
              </p>
              <Button variant="outline-secondary" onClick={() => setSearchTerm('')}>
                Xem tất cả sách
              </Button>
            </div>
          ) : (
            <div>
              <FiBook style={{ fontSize: '4rem', marginBottom: '1rem' }} />
              <h3>Thư viện đang trống</h3>
              <p className="text-muted">Chưa có sách nào trong thư viện</p>
              {isAdmin && (
                <Button variant="primary" onClick={() => navigate('/admin/books/new')}>
                  Thêm sách đầu tiên
                </Button>
              )}
            </div>
          )}
        </div>
      ) : (
        <Row>
          {filteredBooks.map(book => (
            <Col md={6} lg={4} xl={3} key={book.id} className="mb-4">
              <Card className="h-100 book-card shadow-sm position-relative" style={{ cursor: 'pointer' }}>
                {/* Icon hiển thị loại sách (góc dưới bên phải, ngay trên nút xem chi tiết) */}
                <div 
                  style={{ 
                    position: 'absolute', 
                    bottom: '56px',
                    right: '10px', 
                    zIndex: 10,
                    background: book.bookType === 'online' ? '#17a2b8' : '#6c757d',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                  }}
                  title={book.bookType === 'online' ? 'Sách trực tuyến' : 'Sách mượn trực tiếp'}
                >
                  {book.bookType === 'online' ? <FiGlobe size={20} /> : <FiMapPin size={20} />}
                </div>

                <div
                  className="book-image d-flex align-items-center justify-content-center"
                  style={{
                    height: '200px',
                    // Build an absolute URL for the image when frontend runs separately from backend.
                    // API.defaults.baseURL is either REACT_APP_API_BASE_URL or '/api' (CRA proxy path).
                    // If coverImage is already an absolute URL (http...), keep it as-is.
                    background: (() => {
                      if (!book.coverImage) return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                      const isAbsolute = /^(https?:)?\/\//i.test(book.coverImage);
                      const prefix = isAbsolute ? '' : API.defaults.baseURL || '';
                      const imageUrl = `${prefix}${book.coverImage}`;
                      return `url(${imageUrl}) no-repeat center center / cover`;
                    })(),
                    color: 'white'
                  }}
                  onClick={() => handleBookClick(book.id)}
                >
                  {/* If there is no cover image, show the default icon and hint */}
                  {!book.coverImage ? (
                    <div className="text-center">
                      <FiBookOpen style={{ fontSize: '3rem', marginBottom: '0.5rem' }} />
                      <small>Click để xem</small>
                    </div>
                  ) : (
                    // When an image is present, keep the clickable area but don't render the icon overlay
                    <span className="visually-hidden">Click để xem</span>
                  )}
                </div>
                
                <Card.Body className="d-flex flex-column">
                  <div className="flex-grow-1">
                    <Card.Title className="h6 mb-2" onClick={() => handleBookClick(book.id)}>
                      {book.title}
                    </Card.Title>
                    <Card.Text className="text-muted small mb-2">
                      <strong>Tác giả:</strong> {book.author}
                    </Card.Text>
                    <div className="mb-2">
                      <Badge bg="secondary" className="me-1">
                        {toCategoryVN(book.category)}
                      </Badge>
                      {book.bookType === 'online' ? (
                        <Badge bg="info" className="ms-1">Trực tuyến</Badge>
                      ) : (
                        book.stock > 0 ? (
                          <Badge bg="success" className="ms-1">Còn {book.stock} cuốn</Badge>
                        ) : (
                          <Badge bg="danger" className="ms-1">Hết sách</Badge>
                        )
                      )}
                    </div>
                    {book.description && (
                      <Card.Text className="small text-muted">
                        {book.description.length > 80
                          ? `${book.description.substring(0, 80)}...`
                          : book.description
                        }
                      </Card.Text>
                    )}
                  </div>
                  
                  <div className="d-grid" style={{ gap: '6px' }}>
                    {book.bookType === 'online' ? (
                      <>
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => {
                            if (!book.contentFile) return;
                            if (!isVipOrAdmin) {
                              setShowUpgrade(true);
                              return;
                            }
                            navigate(`/reader/${book.id}`);
                          }}
                          disabled={!book.contentFile}
                        >
                          Đọc ngay
                        </Button>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleBookClick(book.id)}
                        >
                          Xem chi tiết
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleBookClick(book.id)}
                      >
                        Xem chi tiết
                      </Button>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
      {/* Upgrade modal shown when non-VIP tries to access online reader */}
      <Modal show={showUpgrade} onHide={() => setShowUpgrade(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Nâng cấp tài khoản</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Vui lòng nâng cấp tài khoản để đọc sách trực tuyến.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUpgrade(false)}>Đóng</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default BookList;

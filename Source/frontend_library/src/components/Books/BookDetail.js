import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, Spinner, Modal } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { booksAPI, favoritesAPI, borrowsAPI } from '../../services/api';
import { toCategoryVN } from '../../utils/labels';
import { FiBookOpen, FiEdit, FiTrash2, FiBook, FiStar, FiShare2 } from 'react-icons/fi';

const BookDetail = () => {
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { id } = useParams();
  const { isAdmin, isVipOrAdmin } = useAuth();
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [borrowLoading, setBorrowLoading] = useState(false);

  const fetchBookDetail = useCallback(async () => {
    try {
      setLoading(true);
      const response = await booksAPI.getById(id);
      setBook(response.data);
    } catch (error) {
      setError('Không thể tải thông tin sách');
      console.error('Error fetching book detail:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBookDetail();
  }, [fetchBookDetail]);

  // Listen for cover updates so detail page updates immediately when cover changes
  useEffect(() => {
    const handler = (e) => {
      const { id: bookId, coverImage } = e.detail || {};
      if (!bookId || String(bookId) !== String(id)) return;
      setBook(prev => prev ? { ...prev, coverImage } : prev);
    };
    window.addEventListener('bookCoverUpdated', handler);
    return () => window.removeEventListener('bookCoverUpdated', handler);
  }, [id]);

  // Kiểm tra trạng thái yêu thích
  useEffect(() => {
    const checkFav = async () => {
      try {
        const { data } = await favoritesAPI.check(id);
        const res = data?.data || data;
        setIsFavorite(!!res?.isFavorite);
      } catch {}
    };
    checkFav();
  }, [id]);

  const handleEdit = () => {
    navigate(`/admin/books/edit/${id}`);
  };

  const handleDelete = async () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sách này?')) {
      try {
        await booksAPI.delete(id);
        navigate('/books');
      } catch (error) {
        alert('Không thể xóa sách');
      }
    }
  };

  const toggleFavorite = async () => {
    try {
      if (isFavorite) {
        await favoritesAPI.remove(id);
        setIsFavorite(false);
      } else {
        await favoritesAPI.add(id);
        setIsFavorite(true);
      }
    } catch (e) {
      alert('Không thể cập nhật yêu thích');
    }
  };

  const handleReadOnline = () => {
    if (!book?.contentFile || book?.bookType !== 'online') return;
    if (!isVipOrAdmin) {
      setShowUpgrade(true);
      return;
    }
    navigate(`/reader/${id}`);
  };

  const handleBorrow = async () => {
    // Nếu là sách trực tiếp (physical)
    if (book.bookType === 'physical') {
      if (isVipOrAdmin) {
        alert('Hãy đến trực tiếp thư viện để mượn sách này.');
      } else {
        alert('Hãy đến trực tiếp thư viện để mượn sách hoặc nâng cấp tài khoản trả phí để đọc sách trực tuyến.');
      }
      return;
    }

    // Nếu là sách online nhưng không phải VIP/Admin
    if (book.bookType === 'online' && !isVipOrAdmin) {
      setShowUpgrade(true);
      return;
    }

    // Mượn sách (logic cũ cho physical books nếu cần)
    try {
      setBorrowLoading(true);
      await borrowsAPI.borrow({ bookId: parseInt(id, 10) });
      alert('Đã mượn sách thành công');
    } catch (e) {
      alert(e.response?.data?.message || 'Không thể mượn sách');
    } finally {
      setBorrowLoading(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="text-muted mt-3">Đang tải thông tin sách...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert variant="danger" className="text-center mt-5">
          <Alert.Heading>Có lỗi xảy ra</Alert.Heading>
          <p>{error}</p>
          <div>
            <Button variant="outline-danger" onClick={fetchBookDetail} className="me-2">
              Thử lại
            </Button>
            <Button variant="outline-secondary" onClick={() => navigate('/books')}>
              Quay lại danh sách
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  if (!book) {
    return (
      <Container>
        <Alert variant="warning" className="text-center mt-5">
          <h4>Không tìm thấy sách</h4>
          <Button variant="outline-secondary" onClick={() => navigate('/books')}>
            Quay lại danh sách
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container>
      {/* Breadcrumb */}
      <Row className="mb-3">
        <Col>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => navigate('/books')}
          >
            ← Quay lại danh sách
          </Button>
        </Col>
      </Row>

      <Row>
        {/* Book Image */}
        <Col lg={4} className="mb-4">
          <Card>
            <div
              className="d-flex align-items-center justify-content-center"
              style={{
                height: '400px',
                background: book && book.coverImage
                  ? `url(${book.coverImage}) center/cover`
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontSize: '5rem'
              }}
            >
              {!book?.coverImage && <FiBookOpen />}
            </div>
          </Card>
        </Col>

        {/* Book Information */}
        <Col lg={8}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-start">
              <div>
                <h1 className="h3 mb-1">{book.title}</h1>
                <p className="text-muted mb-0">Tác giả: {book.author}</p>
              </div>
              {isAdmin && (
                <div>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="me-2"
                    onClick={handleEdit}
                  >
                    <FiEdit className="me-1" />Chỉnh sửa
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={handleDelete}
                  >
                    <FiTrash2 className="me-1" />Xóa
                  </Button>
                </div>
              )}
            </Card.Header>
            
            <Card.Body>
              <Row className="mb-3">
                <Col sm={3}>
                  <strong>Thể loại:</strong>
                </Col>
                <Col sm={9}>
                  <Badge bg="secondary">{toCategoryVN(book.category)}</Badge>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col sm={3}>
                  <strong>Tình trạng:</strong>
                </Col>
                <Col sm={9}>
                  {book.bookType === 'online' ? (
                    <Badge bg="info">Sách trực tuyến</Badge>
                  ) : (
                    book.stock > 0 ? (
                      <Badge bg="success">Còn {book.stock} cuốn</Badge>
                    ) : (
                      <Badge bg="danger">Hết sách</Badge>
                    )
                  )}
                </Col>
              </Row>

              {book.description && (
                <Row className="mb-3">
                  <Col sm={3}>
                    <strong>Mô tả:</strong>
                  </Col>
                  <Col sm={9}>
                    <p className="mb-0" style={{ whiteSpace: 'pre-line' }}>
                      {book.description}
                    </p>
                  </Col>
                </Row>
              )}

              <Row className="mb-3">
                <Col sm={3}>
                  <strong>Ngày tạo:</strong>
                </Col>
                <Col sm={9}>
                  <small className="text-muted">
                    {new Date(book.createdAt).toLocaleDateString('vi-VN')}
                  </small>
                </Col>
              </Row>

              <Row>
                <Col sm={3}>
                  <strong>Cập nhật:</strong>
                </Col>
                <Col sm={9}>
                  <small className="text-muted">
                    {new Date(book.updatedAt).toLocaleDateString('vi-VN')}
                  </small>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Actions */}
          <Card className="mt-3">
            <Card.Body>
              <h5>Hành động</h5>
              <div className="d-flex gap-2">
                {book.bookType === 'online' ? (
                  <Button variant="success" onClick={handleReadOnline} disabled={!book.contentFile}>
                    <FiBook className="me-2" />Sách có sẵn để đọc
                  </Button>
                ) : (
                  <Button variant="primary" onClick={handleBorrow} disabled={book.stock <= 0 || borrowLoading}>
                    {borrowLoading ? 'Đang xử lý...' : <>Mượn sách</>}
                  </Button>
                )}

                <Button variant={isFavorite ? 'warning' : 'outline-info'} onClick={toggleFavorite}>
                  <FiStar className="me-2" />{isFavorite ? 'Bỏ yêu thích' : 'Yêu thích'}
                </Button>

                <Button variant="outline-secondary">
                  <FiShare2 className="me-2" />Chia sẻ
                </Button>
              </div>
            </Card.Body>
          </Card>

          {/* Modal nâng cấp tài khoản */}
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
        </Col>
      </Row>
    </Container>
  );
};

export default BookDetail;

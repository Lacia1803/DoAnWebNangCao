import React, { useEffect, useState, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { favoritesAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { FiStar, FiBookOpen, FiTrash2 } from 'react-icons/fi';

const MyFavorites = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchFavorites = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await favoritesAPI.my();
      // ApiResponse wrapper: assume data.data or data
      const list = data?.data || data;
      setItems(Array.isArray(list) ? list : []);
    } catch (e) {
      setError('Không thể tải danh sách yêu thích');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const removeFavorite = async (bookId) => {
    try {
      await favoritesAPI.remove(bookId);
      setItems(prev => prev.filter(b => b.id !== bookId));
    } catch (e) {
      alert('Không thể xóa khỏi yêu thích');
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" />
        <div className="text-muted mt-2">Đang tải...</div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container className="py-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0"><FiStar className="me-2" />Sách yêu thích</h4>
        <Button variant="outline-secondary" onClick={() => navigate(-1)}>Quay lại</Button>
      </div>

      {items.length === 0 ? (
        <Alert variant="info">Bạn chưa có sách yêu thích nào.</Alert>
      ) : (
        <Row>
          {items.map(book => (
            <Col key={book.id} md={4} className="mb-3">
              <Card className="h-100">
                <Card.Body>
                  <h5>{book.title}</h5>
                  <div className="text-muted small">{book.author}</div>
                  <div className="mt-2 small">{book.category}</div>
                </Card.Body>
                <Card.Footer className="d-flex gap-2">
                  <Button size="sm" variant="primary" onClick={() => navigate(`/books/${book.id}`)}>
                    <FiBookOpen className="me-1" />Xem chi tiết
                  </Button>
                  <Button size="sm" variant="outline-danger" onClick={() => removeFavorite(book.id)}>
                    <FiTrash2 className="me-1" />Bỏ yêu thích
                  </Button>
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default MyFavorites;

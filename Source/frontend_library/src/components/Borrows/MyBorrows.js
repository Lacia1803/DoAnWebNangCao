import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Spinner, Alert } from 'react-bootstrap';
import { borrowsAPI } from '../../services/api';
import { Link } from 'react-router-dom';

const statusVariant = (status) => {
  switch (status) {
    case 'returned':
      return 'success';
    case 'overdue':
      return 'danger';
    default:
      return 'warning';
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString();
};

const MyBorrows = () => {
  const [borrows, setBorrows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [returningId, setReturningId] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data } = await borrowsAPI.myBorrows();
      setBorrows(data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải danh sách mượn trả');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReturn = async (id) => {
    try {
      setReturningId(id);
      await borrowsAPI.returnBook(id);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Trả sách thất bại');
    } finally {
      setReturningId(null);
    }
  };

  if (loading) {
    return (
      <Container>
        <div className="text-center py-5">
          <Spinner animation="border" />
          <p className="text-muted mt-3">Đang tải lịch sử mượn trả...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h1 className="h3 mb-1">📦 Sách tôi đã mượn</h1>
          <p className="text-muted">Quản lý các sách bạn đã mượn và trả.</p>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card>
        <Card.Body>
          <Table responsive hover className="align-middle">
            <thead>
              <tr>
                <th>#</th>
                <th>Sách</th>
                <th>Ngày mượn</th>
                <th>Hạn trả</th>
                <th>Ngày trả</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {borrows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-4">
                    Chưa có lịch sử mượn trả. Hãy khám phá <Link to="/books">danh sách sách</Link>.
                  </td>
                </tr>
              ) : (
                borrows.map((b, idx) => (
                  <tr key={b.id}>
                    <td>{idx + 1}</td>
                    <td>
                      <div className="d-flex align-items-center">
                        {b.book?.coverImage ? (
                          <img src={b.book.coverImage} alt={b.book?.title} style={{ width: 40, height: 56, objectFit: 'cover', borderRadius: 4, marginRight: 12 }} />
                        ) : (
                          <div style={{ width: 40, height: 56, background: '#eee', borderRadius: 4, marginRight: 12 }} />
                        )}
                        <div>
                          <div className="fw-semibold">{b.book?.title}</div>
                          <div className="text-muted small">{b.book?.author}</div>
                        </div>
                      </div>
                    </td>
                    <td>{formatDate(b.borrowDate)}</td>
                    <td>{formatDate(b.dueDate)}</td>
                    <td>{formatDate(b.returnDate)}</td>
                    <td>
                      <Badge bg={statusVariant(b.status)} className="text-capitalize">{b.status}</Badge>
                    </td>
                    <td>
                      {b.status === 'borrowed' && (
                        <Button size="sm" variant="outline-primary" disabled={returningId === b.id} onClick={() => handleReturn(b.id)}>
                          {returningId === b.id ? 'Đang trả...' : 'Trả sách'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default MyBorrows;

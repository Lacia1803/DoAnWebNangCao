import React, { useEffect, useMemo, useState } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Spinner, Alert, Form, Pagination } from 'react-bootstrap';
import { borrowsAPI } from '../../services/api';

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

const AdminBorrows = () => {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [updatingOverdue, setUpdatingOverdue] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = { page, limit };
      if (status) params.status = status; // avoid sending empty string which fails validation
      const { data } = await borrowsAPI.getAll(params);
      setRows(data.borrows || []);
      setTotalPages(data.totalPages || 1);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải danh sách mượn trả');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status]);

  const handleReturn = async (id) => {
    try {
      setBusyId(id);
      await borrowsAPI.returnBook(id);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Cập nhật trả sách thất bại');
    } finally {
      setBusyId(null);
    }
  };

  const handleUpdateOverdue = async () => {
    try {
      setUpdatingOverdue(true);
      await borrowsAPI.updateOverdue();
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Cập nhật quá hạn thất bại');
    } finally {
      setUpdatingOverdue(false);
    }
  };

  const pagination = useMemo(() => {
    const items = [];
    for (let number = 1; number <= totalPages; number++) {
      items.push(
        <Pagination.Item key={number} active={number === page} onClick={() => setPage(number)}>
          {number}
        </Pagination.Item>
      );
    }
    return items;
  }, [totalPages, page]);

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-end flex-wrap gap-3">
            <div>
              <h1 className="h3 mb-1">🗂️ Quản lý mượn trả</h1>
              <p className="text-muted mb-0">Theo dõi, lọc trạng thái và cập nhật quá hạn.</p>
            </div>
            <div className="d-flex gap-2 align-items-center">
              <Form.Select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }} style={{ width: 180 }}>
                <option value="">Tất cả trạng thái</option>
                <option value="borrowed">Đang mượn</option>
                <option value="overdue">Quá hạn</option>
                <option value="returned">Đã trả</option>
              </Form.Select>
              <Button variant="outline-danger" onClick={handleUpdateOverdue} disabled={updatingOverdue}>
                {updatingOverdue ? 'Đang cập nhật...' : 'Đánh dấu quá hạn'}
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card>
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
            </div>
          ) : (
            <>
              <Table responsive hover className="align-middle">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Người mượn</th>
                    <th>Sách</th>
                    <th>Ngày mượn</th>
                    <th>Hạn trả</th>
                    <th>Ngày trả</th>
                    <th>Trạng thái</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center text-muted py-4">Không có dữ liệu</td>
                    </tr>
                  ) : (
                    rows.map((b, idx) => (
                      <tr key={b.id}>
                        <td>{(page - 1) * limit + idx + 1}</td>
                        <td>
                          <div className="small">
                            <div className="fw-semibold">{b.user?.username}</div>
                            <div className="text-muted">{b.user?.email}</div>
                          </div>
                        </td>
                        <td>
                          <div className="small">
                            <div className="fw-semibold">{b.book?.title}</div>
                            <div className="text-muted">{b.book?.author}</div>
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
                            <Button size="sm" variant="outline-primary" disabled={busyId === b.id} onClick={() => handleReturn(b.id)}>
                              {busyId === b.id ? 'Đang trả...' : 'Đánh dấu đã trả'}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
              <div className="d-flex justify-content-end">
                <Pagination>{pagination}</Pagination>
              </div>
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AdminBorrows;

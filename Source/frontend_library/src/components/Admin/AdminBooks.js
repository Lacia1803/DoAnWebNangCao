import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Alert, Form, InputGroup, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { booksAPI } from '../../services/api';
import { toCategoryVN } from '../../utils/labels';
import { FiBook, FiPlus, FiSearch, FiEye, FiEdit, FiTrash2, FiAlertTriangle } from 'react-icons/fi';

const AdminBooks = () => {
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bookToDelete, setBookToDelete] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBooks();
  }, []);

  const filterBooks = useCallback(() => {
    let filtered = books;

    // Filter by search term
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(book =>
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (filterCategory !== '') {
      filtered = filtered.filter(book => book.category === filterCategory);
    }

    setFilteredBooks(filtered);
  }, [books, searchTerm, filterCategory]);

  useEffect(() => {
    filterBooks();
  }, [filterBooks]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const response = await booksAPI.getAll({ page: 1, limit: 200, order: 'DESC' });
      const data = response.data;
      const list = Array.isArray(data) ? data : (data.books || []);
      setBooks(list);
    } catch (error) {
      setError('Không thể tải danh sách sách');
    } finally {
      setLoading(false);
    }
  };

  

  const handleDeleteClick = (book) => {
    setBookToDelete(book);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!bookToDelete) return;

    try {
      await booksAPI.delete(bookToDelete.id);
      setBooks(books.filter(book => book.id !== bookToDelete.id));
      setShowDeleteModal(false);
      setBookToDelete(null);
    } catch (error) {
      alert('Không thể xóa sách');
    }
  };

  const categories = [...new Set(books.map(book => book.category))];

  return (
    <Container fluid>
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h2 mb-1"><FiBook className="me-2" />Quản lý sách</h1>
              <p className="text-muted mb-0">
                Tổng số: {filteredBooks.length} / {books.length} sách
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => navigate('/admin/books/new')}
            >
              <FiPlus className="me-2" />Thêm sách mới
            </Button>
          </div>
        </Col>
      </Row>

      {/* Filters */}
      <Row className="mb-4">
        <Col md={6} lg={4}>
          <InputGroup>
            <Form.Control
              type="text"
              placeholder="Tìm kiếm theo tên sách, tác giả..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <InputGroup.Text><FiSearch /></InputGroup.Text>
          </InputGroup>
        </Col>
        <Col md={4} lg={3}>
          <Form.Select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">Tất cả thể loại</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col md={2} lg={2}>
          <Button 
            variant="outline-secondary" 
            onClick={() => {
              setSearchTerm('');
              setFilterCategory('');
            }}
          >
            Đặt lại
          </Button>
        </Col>
      </Row>

      {/* Content */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Đang tải danh sách sách...</p>
        </div>
      ) : error ? (
        <Alert variant="danger">
          {error}
          <div className="mt-2">
            <Button variant="outline-danger" size="sm" onClick={fetchBooks}>
              Thử lại
            </Button>
          </div>
        </Alert>
      ) : (
        <Card>
          <Card.Body className="p-0">
            {filteredBooks.length === 0 ? (
              <div className="text-center py-5">
                <FiBook style={{ fontSize: '4rem', marginBottom: '1rem' }} />
                <h4>Không tìm thấy sách</h4>
                <p className="text-muted">
                  {searchTerm || filterCategory
                    ? 'Không có sách nào khớp với bộ lọc'
                    : 'Chưa có sách nào trong hệ thống'
                  }
                </p>
                <Button variant="primary" onClick={() => navigate('/admin/books/new')}>
                  Thêm sách đầu tiên
                </Button>
              </div>
            ) : (
              <Table responsive hover className="mb-0">
                <thead className="table-dark">
                  <tr>
                    <th>ID</th>
                    <th>Thông tin sách</th>
                    <th>Thể loại</th>
                    <th>Số lượng</th>
                    <th>Trạng thái</th>
                    <th>Ngày tạo</th>
                    <th className="text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBooks.map(book => (
                    <tr key={book.id}>
                      <td>
                        <strong>#{book.id}</strong>
                      </td>
                      <td>
                        <div>
                          <strong>{book.title}</strong>
                          <br />
                          <small className="text-muted">
                            Tác giả: {book.author}
                          </small>
                        </div>
                      </td>
                      <td>
                        <Badge bg="secondary">{toCategoryVN(book.category)}</Badge>
                      </td>
                      <td>
                        <strong>{book.stock}</strong>
                      </td>
                      <td>
                        {book.stock > 0 ? (
                          <Badge bg="success">Có sẵn</Badge>
                        ) : (
                          <Badge bg="danger">Hết</Badge>
                        )}
                      </td>
                      <td>
                        <small>
                          {new Date(book.createdAt).toLocaleDateString('vi-VN')}
                        </small>
                      </td>
                      <td>
                        <div className="d-flex gap-2 justify-content-center">
                          <Button
                            variant="outline-info"
                            size="sm"
                            onClick={() => navigate(`/books/${book.id}`)}
                            title="Xem chi tiết"
                          >
                            <FiEye />
                          </Button>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => navigate(`/admin/books/edit/${book.id}`)}
                            title="Chỉnh sửa"
                          >
                            <FiEdit />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDeleteClick(book)}
                            title="Xóa"
                          >
                            <FiTrash2 />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận xóa sách</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center">
            <FiAlertTriangle style={{ fontSize: '3rem', marginBottom: '1rem', color: '#dc3545' }} />
            <h5>Bạn có chắc chắn muốn xóa sách này?</h5>
            {bookToDelete && (
              <div className="mt-3">
                <strong>"{bookToDelete.title}"</strong>
                <br />
                <small className="text-muted">Tác giả: {bookToDelete.author}</small>
              </div>
            )}
            <p className="text-muted mt-3">
              Hành động này không thể hoàn tác!
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowDeleteModal(false)}
          >
            Hủy
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDeleteConfirm}
          >
            Xóa sách
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminBooks;

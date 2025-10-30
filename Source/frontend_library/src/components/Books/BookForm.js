import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, ProgressBar } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { booksAPI } from '../../services/api';
import API from '../../services/api';
import { FiEdit, FiPlus, FiEye, FiBookOpen } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

const BookForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    category: '',
    description: '',
    stock: 1,
    coverImage: '',
    bookType: 'physical'
  });
  const [contentFile, setContentFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewCover, setPreviewCover] = useState(null);
  const previewObjectUrlRef = useRef(null);
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const { currentUser, isAdmin } = useAuth();

  const fetchBookData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await booksAPI.getById(id);
      const book = response.data;
      setFormData({
        title: book.title || '',
        author: book.author || '',
        category: book.category || '',
        description: book.description || '',
        stock: book.stock || 1,
        coverImage: book.coverImage || '',
        bookType: book.bookType || 'physical'
      });
    } catch (error) {
      setError('Không thể tải thông tin sách');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isEdit) {
      fetchBookData();
    }
  }, [isEdit, fetchBookData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'stock' ? parseInt(value) || 0 : value
    }));
  };

  // Upload nội dung sách (PDF/DOC/DOCX/TXT)
  const handleContentFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedExt = ['pdf', 'doc', 'docx', 'txt'];
    const ext = file.name.split('.').pop().toLowerCase();
    const max = 150 * 1024 * 1024; // 150MB
    if (!allowedExt.includes(ext)) {
      setError('Chỉ cho phép file PDF, DOC, DOCX, TXT');
      return;
    }
    if (file.size > max) {
      setError('Kích thước file tối đa 150MB');
      return;
    }
    setError('');
    setContentFile(file);
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

  // Basic client-side validation: type and size
  const isImage = /jpeg|jpg|png|webp/i.test(file.type);
  const maxSize = 50 * 1024 * 1024; // 50MB
    if (!isImage) {
      setError('Ảnh bìa phải là định dạng JPG/PNG/WebP');
      return;
    }
    if (file.size > maxSize) {
      setError('Kích thước ảnh tối đa 50MB');
      return;
    }

    const formDataUpload = new FormData();
    formDataUpload.append('cover', file);

    try {
      // Show local preview immediately and keep it until user removes or replaces
      const objectUrl = URL.createObjectURL(file);
      // Revoke previous object URL if any
      if (previewObjectUrlRef.current) {
        try { URL.revokeObjectURL(previewObjectUrlRef.current); } catch (e) {}
      }
      previewObjectUrlRef.current = objectUrl;
      setPreviewCover(objectUrl);

      setUploadingCover(true);
      setUploadProgress(0);

      const { data } = await booksAPI.uploadCover(formDataUpload, (progressEvent) => {
        if (progressEvent.lengthComputable) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        }
      }, isEdit ? { bookId: id } : undefined);

      // If backend attached the uploaded cover to the current book, prefer returned absolute URL
      const returnedCover = data.attachedBook?.coverImage || data.coverImage;
      setFormData(prev => ({ ...prev, coverImage: returnedCover }));

      // Notify other components (BookList, BookDetail) that a book's cover was updated
      try {
        const bookId = isEdit ? id : (data.attachedBook?.id || null);
        if (bookId) {
          window.dispatchEvent(new CustomEvent('bookCoverUpdated', { detail: { id: String(bookId), coverImage: returnedCover } }));
        }
      } catch (e) {
        // no-op
      }
      setError('');

      // Keep the local preview so user sees the image immediately. We will not
      // revoke the object URL here; it will be revoked when the user removes
      // the preview or when a new file is chosen (handled above) or on unmount.
      setUploadProgress(0);
    } catch (err) {
      setError(err.response?.data?.message || 'Tải lên ảnh bìa thất bại');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleRemoveCover = () => {
    // Revoke any existing local preview object URL
    if (previewObjectUrlRef.current) {
      try { URL.revokeObjectURL(previewObjectUrlRef.current); } catch (e) {}
      previewObjectUrlRef.current = null;
    }
    setPreviewCover(null);
    setFormData(prev => ({ ...prev, coverImage: '' }));
  };

  // Cleanup object URL on unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      if (previewObjectUrlRef.current) {
        try { URL.revokeObjectURL(previewObjectUrlRef.current); } catch (e) {}
        previewObjectUrlRef.current = null;
      }
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Nếu có contentFile hoặc bookType online, gửi multipart
      if (contentFile || formData.bookType === 'online') {
        const fd = new FormData();
        Object.entries(formData).forEach(([k, v]) => fd.append(k, v ?? ''));
        if (contentFile) fd.append('contentFile', contentFile);
        if (isEdit) {
          await booksAPI.updateMultipart(id, fd);
          setSuccess('Cập nhật sách thành công!');
        } else {
          await booksAPI.createMultipart(fd);
          setSuccess('Thêm sách mới thành công!');
        }
      } else {
        if (isEdit) {
          await booksAPI.update(id, formData);
          setSuccess('Cập nhật sách thành công!');
        } else {
          await booksAPI.create(formData);
          setSuccess('Thêm sách mới thành công!');
        }
      }
      
      setTimeout(() => {
        navigate('/admin/books');
      }, 1500);
    } catch (error) {
      setError(error.response?.data?.message || `Không thể ${isEdit ? 'cập nhật' : 'thêm'} sách`);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    'Văn học',
    'Khoa học',
    'Lịch sử',
    'Triết học',
    'Tâm lý học',
    'Kinh tế',
    'Công nghệ',
    'Nghệ thuật',
    'Thể thao',
    'Nấu ăn',
    'Du lịch',
    'Khác'
  ];

  if (loading && isEdit) {
    return (
      <Container>
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="text-muted mt-3">Đang tải thông tin sách...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h2 mb-1">
                {isEdit ? <><FiEdit className="me-2" />Chỉnh sửa sách</> : <><FiPlus className="me-2" />Thêm sách mới</>}
              </h1>
              <p className="text-muted mb-0">
                {isEdit ? 'Cập nhật thông tin sách' : 'Điền thông tin sách mới'}
              </p>
            </div>
            <Button
              variant="outline-secondary"
              onClick={() => navigate('/admin/books')}
            >
              ← Quay lại
            </Button>
          </div>
        </Col>
      </Row>

      {/* Form */}
      <Row>
        <Col lg={8}>
          <Card className="form-container">
            <Card.Body>
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
                      <Form.Label>Tên sách <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Nhập tên sách"
                        required
                        disabled={loading}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Tác giả <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="text"
                        name="author"
                        value={formData.author}
                        onChange={handleChange}
                        placeholder="Nhập tên tác giả"
                        required
                        disabled={loading}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Thể loại <span className="text-danger">*</span></Form.Label>
                      <Form.Select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                        disabled={loading}
                      >
                        <option value="">Chọn thể loại</option>
                        {categories.map(category => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Số lượng <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="number"
                        name="stock"
                        value={formData.stock}
                        onChange={handleChange}
                        placeholder="Nhập số lượng"
                        min="0"
                        required
                        disabled={loading}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-4">
                  <Form.Label>Mô tả</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={5}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Nhập mô tả về sách (tùy chọn)"
                    disabled={loading}
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Ảnh bìa sách</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleCoverUpload}
                    disabled={loading || uploadingCover}
                  />
                  <div className="form-text">Định dạng: JPG, PNG, WebP • Tối đa 50MB • Kích thước khuyến nghị: 800x1200px (tối thiểu 400x600px)</div>
                  {uploadingCover && <div className="small text-muted mt-1">Đang tải lên...</div>}
                  {uploadingCover && (
                    <div className="mt-2">
                      <ProgressBar now={uploadProgress} label={`${uploadProgress}%`} />
                    </div>
                  )}
                  {(previewCover || formData.coverImage) && (
                    <div className="mt-2 d-flex align-items-center">
                      <img
                        src={previewCover || (() => {
                          const isAbsolute = /^(https?:)?\/\//i.test(formData.coverImage);
                          return isAbsolute ? formData.coverImage : `${API.defaults.baseURL}${formData.coverImage}`;
                        })()}
                        alt="Cover"
                        style={{ width: 80, height: 112, objectFit: 'cover', borderRadius: 4 }}
                      />
                      <Button size="sm" variant="outline-danger" onClick={() => { setPreviewCover(null); handleRemoveCover(); }} className="ms-2">Xóa ảnh</Button>
                    </div>
                  )}
                </Form.Group>

                {/* Loại sách và nội dung trực tuyến (Admin only) */}
                {isAdmin && (
                  <>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Loại sách</Form.Label>
                          <Form.Select
                            name="bookType"
                            value={formData.bookType}
                            onChange={handleChange}
                            disabled={loading}
                          >
                            <option value="physical">Sách trực tiếp (mượn tại thư viện)</option>
                            <option value="online">Sách trực tuyến (đọc online)</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>

                    {formData.bookType === 'online' && (
                      <Form.Group className="mb-4">
                        <Form.Label>Nội dung sách (PDF, DOC, DOCX, TXT) tối đa 150MB</Form.Label>
                        <Form.Control
                          type="file"
                          accept=".pdf,.doc,.docx,.txt"
                          onChange={handleContentFileChange}
                          disabled={loading}
                        />
                        {contentFile && (
                          <div className="small text-muted mt-1">Đã chọn: {contentFile.name}</div>
                        )}
                      </Form.Group>
                    )}

                    {isEdit && formData.bookType === 'online' && (
                      <div className="mb-3">
                        <div className="small">Nội dung hiện có: {" "}
                          <a href={`http://localhost:5000${formData.contentFile || ''}`} target="_blank" rel="noreferrer">
                            {formData.contentFile ? 'Xem nội dung' : 'Chưa có'}
                          </a>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div className="d-flex gap-2">
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={loading}
                    className="px-4"
                  >
                    {loading ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        {isEdit ? 'Đang cập nhật...' : 'Đang thêm...'}
                      </>
                    ) : (
                      <>{isEdit ? 'Cập nhật sách' : 'Thêm sách'}</>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline-secondary"
                    type="button"
                    onClick={() => navigate('/admin/books')}
                    disabled={loading}
                  >
                    Hủy
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Preview */}
        <Col lg={4}>
          <Card className="sticky-top" style={{ top: '20px' }}>
            <Card.Header>
              <h6 className="mb-0"><FiEye className="me-2" />Xem trước</h6>
            </Card.Header>
            <Card.Body>
              <div
                className="d-flex align-items-center justify-content-center mb-3"
                style={{
                  height: '150px',
                  background: (() => {
                    if (!formData.coverImage) return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                    const isAbsolute = /^(https?:)?\/\//i.test(formData.coverImage);
                    const imageUrl = isAbsolute ? formData.coverImage : `${API.defaults.baseURL}${formData.coverImage}`;
                    return `url(${imageUrl}) center/cover`;
                  })(),
                  color: 'white',
                  borderRadius: '8px',
                  fontSize: '3rem'
                }}
              >
                {!formData.coverImage && <FiBookOpen />}
              </div>
              
              <h6 className="fw-bold">
                {formData.title || 'Tên sách'}
              </h6>
              <p className="text-muted small mb-2">
                Tác giả: {formData.author || 'Tên tác giả'}
              </p>
              <p className="small mb-2">
                Thể loại: <span className="badge bg-secondary">
                  {formData.category || 'Thể loại'}
                </span>
              </p>
              <p className="small mb-2">
                Số lượng: <span className="badge bg-success">
                  {formData.stock} cuốn
                </span>
              </p>
              {formData.description && (
                <p className="small text-muted">
                  {formData.description.length > 100
                    ? `${formData.description.substring(0, 100)}...`
                    : formData.description
                  }
                </p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default BookForm;

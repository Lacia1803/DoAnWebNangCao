import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Alert, Form, InputGroup, Modal } from 'react-bootstrap';
import { usersAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FiUsers, FiSearch, FiTrash2, FiAlertTriangle, FiUser, FiShield, FiUserPlus, FiEdit, FiStar } from 'react-icons/fi';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [userToEdit, setUserToEdit] = useState(null);
  const [stats, setStats] = useState(null);
  const [formData, setFormData] = useState({ username: '', email: '', password: '', role: 'user' });
  const [formError, setFormError] = useState('');
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [internalCodeValue, setInternalCodeValue] = useState('');
  const [internalCodeHashed, setInternalCodeHashed] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditEntries, setAuditEntries] = useState([]);
  const [codeMessage, setCodeMessage] = useState('');
  const { currentUser } = useAuth();

  useEffect(() => {
    fetchUsers();
    fetchStats();
    fetchInternalCode();
  }, []);

  const fetchInternalCode = async () => {
    try {
      const res = await usersAPI.getInternalCode();
      const payload = res.data?.data || res.data;
      // payload may indicate if stored value is hashed. If hashed, don't expose plaintext.
      if (payload?.hashed) {
        setInternalCodeHashed(true);
        setInternalCodeValue(''); // do not prefill hashed value
      } else {
        setInternalCodeHashed(false);
        setInternalCodeValue(payload?.value || '1836');
      }
    } catch (err) {
      console.error('Không lấy được mã nội bộ:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await usersAPI.getStats();
      console.log('Stats response:', response); // Debug log
      // Handle different response structures
      const statsData = response.data?.data || response.data;
      console.log('Stats data:', statsData); // Debug log
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching user stats:', err);
    }
  };

  const filterUsers = useCallback(() => {
    let filtered = users;

    // Filter by search term
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by role
    if (filterRole !== '') {
      filtered = filtered.filter(user => user.role === filterRole);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, filterRole]);

  useEffect(() => {
    filterUsers();
  }, [filterUsers]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getAll();
      // Normalize various possible API response shapes to always be an array
      const payload = response?.data;
      let list = [];
      if (Array.isArray(payload)) {
        list = payload;
      } else if (Array.isArray(payload?.data)) {
        list = payload.data;
      } else if (Array.isArray(payload?.data?.users)) {
        list = payload.data.users;
      } else if (Array.isArray(payload?.users)) {
        list = payload.users;
      }
      setUsers(list);
    } catch (error) {
      setError('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  

  const handleDeleteClick = (user) => {
    if (user.id === currentUser.id) {
      alert('Bạn không thể xóa tài khoản của chính mình!');
      return;
    }
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      await usersAPI.delete(userToDelete.id);
      setUsers(users.filter(user => user.id !== userToDelete.id));
      setShowDeleteModal(false);
      setUserToDelete(null);
      fetchStats(); // Refresh stats after delete
    } catch (error) {
      alert('Không thể xóa người dùng');
    }
  };

  const handleCreateClick = () => {
    setFormData({ username: '', email: '', password: '', role: 'user' });
    setFormError('');
    setShowCreateModal(true);
  };

  const handleEditClick = (user) => {
    setUserToEdit(user);
    setFormData({ username: user.username, email: user.email, password: '', role: user.role });
    setFormError('');
    setShowEditModal(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    
    try {
      await usersAPI.create(formData);
      setShowCreateModal(false);
      fetchUsers();
      fetchStats();
    } catch (error) {
      setFormError(error.response?.data?.message || 'Không thể tạo người dùng');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    
    try {
      const updateData = { ...formData };
      if (!updateData.password) {
        delete updateData.password; // Don't update password if empty
      }
      await usersAPI.update(userToEdit.id, updateData);
      setShowEditModal(false);
      fetchUsers();
      fetchStats();
    } catch (error) {
      setFormError(error.response?.data?.message || 'Không thể cập nhật người dùng');
    }
  };

  return (
    <Container fluid>
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h2 mb-1"><FiUsers className="me-2" />Quản lý người dùng</h1>
              <p className="text-muted mb-0">
                Tổng số: {filteredUsers.length} / {users.length} người dùng
              </p>
              {stats && (
                <div className="mt-2">
                  <Badge bg="primary" className="me-2">
                    <FiShield className="me-1" />Admin: {stats.adminCount}/{stats.limits.maxAdmin}
                  </Badge>
                  <Badge bg="warning" text="dark" className="me-2">
                    <FiStar className="me-1" />Người dùng trả phí: {stats.vipCount}/{stats.limits.maxVip}
                  </Badge>
                  <Badge bg="secondary">
                    <FiUser className="me-1" />User: {stats.userCount}
                  </Badge>
                </div>
              )}
            </div>
            <Button variant="primary" onClick={handleCreateClick}>
              <FiUserPlus className="me-2" />Thêm người dùng
            </Button>
            <Button variant="outline-secondary" className="ms-2" onClick={() => setShowCodeModal(true)}>
              Mã nội bộ
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
              placeholder="Tìm kiếm theo tên, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <InputGroup.Text><FiSearch /></InputGroup.Text>
          </InputGroup>
        </Col>
        <Col md={4} lg={3}>
          <Form.Select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="">Tất cả vai trò</option>
            <option value="admin">Quản trị viên</option>
            <option value="vip">Người dùng trả phí</option>
            <option value="user">Người dùng</option>
          </Form.Select>
        </Col>
        <Col md={2} lg={2}>
          <Button 
            variant="outline-secondary" 
            onClick={() => {
              setSearchTerm('');
              setFilterRole('');
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
          <p className="text-muted">Đang tải danh sách người dùng...</p>
        </div>
      ) : error ? (
        <Alert variant="danger">
          {error}
          <div className="mt-2">
            <Button variant="outline-danger" size="sm" onClick={fetchUsers}>
              Thử lại
            </Button>
          </div>
        </Alert>
      ) : (
        <Card>
          <Card.Body className="p-0">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-5">
                <FiUsers style={{ fontSize: '4rem', marginBottom: '1rem' }} />
                <h4>Không tìm thấy người dùng</h4>
                <p className="text-muted">
                  {searchTerm || filterRole
                    ? 'Không có người dùng nào khớp với bộ lọc'
                    : 'Chưa có người dùng nào trong hệ thống'
                  }
                </p>
              </div>
            ) : (
              <Table responsive hover className="mb-0">
                <thead className="table-dark">
                  <tr>
                    <th>ID</th>
                    <th>Thông tin</th>
                    <th>Email</th>
                    <th>Vai trò</th>
                    <th>Ngày tham gia</th>
                    <th>Cập nhật</th>
                    <th className="text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id}>
                      <td>
                        <strong>#{user.id}</strong>
                      </td>
                      <td>
                        <div>
                          <strong>{user.username}</strong>
                          {user.id === currentUser.id && (
                            <Badge bg="info" className="ms-2">Bạn</Badge>
                          )}
                        </div>
                      </td>
                      <td>
                        <small>{user.email}</small>
                      </td>
                      <td>
                        <Badge bg={
                          user.role === 'admin' ? 'primary' : 
                          user.role === 'vip' ? 'warning' : 
                          'secondary'
                        } text={user.role === 'vip' ? 'dark' : 'light'}>
                          {user.role === 'admin' && <><FiShield className="me-1" />Admin</>}
                          {user.role === 'vip' && <><FiStar className="me-1" />Người dùng trả phí</>}
                          {user.role === 'user' && <><FiUser className="me-1" />User</>}
                        </Badge>
                      </td>
                      <td>
                        <small>
                          {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                        </small>
                      </td>
                      <td>
                        <small>
                          {new Date(user.updatedAt).toLocaleDateString('vi-VN')}
                        </small>
                      </td>
                      <td>
                        <div className="d-flex gap-2 justify-content-center">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleEditClick(user)}
                            title="Chỉnh sửa vai trò"
                          >
                            <FiEdit />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDeleteClick(user)}
                            disabled={user.id === currentUser.id}
                            title={user.id === currentUser.id ? 'Không thể xóa chính mình' : 'Xóa người dùng'}
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
          <Modal.Title>Xác nhận xóa người dùng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center">
            <FiAlertTriangle style={{ fontSize: '3rem', marginBottom: '1rem', color: '#dc3545' }} />
            <h5>Bạn có chắc chắn muốn xóa người dùng này?</h5>
            {userToDelete && (
              <div className="mt-3">
                <strong>{userToDelete.username}</strong>
                <br />
                <small className="text-muted">{userToDelete.email}</small>
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
            Xóa người dùng
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Audit History Modal */}
      <Modal show={showAuditModal} onHide={() => setShowAuditModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Lịch sử thay đổi mã nội bộ</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {auditEntries.length === 0 ? (
            <div className="text-center py-3 text-muted">Chưa có thay đổi nào được ghi nhận.</div>
          ) : (
            <Table responsive>
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Người thay đổi</th>
                  <th>Giá trị cũ</th>
                  <th>Giá trị mới</th>
                </tr>
              </thead>
              <tbody>
                {auditEntries.map(a => (
                  <tr key={a.id}>
                    <td>{new Date(a.createdAt).toLocaleString('vi-VN')}</td>
                    <td>{a.changer ? `${a.changer.username} (#${a.changer.id})` : 'N/A'}</td>
                    <td>{a.oldValue || '—'}</td>
                    <td>{a.newValue || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAuditModal(false)}>Đóng</Button>
        </Modal.Footer>
      </Modal>

      {/* Create User Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title><FiUserPlus className="me-2" />Thêm người dùng mới</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateSubmit}>
          <Modal.Body>
            {formError && <Alert variant="danger">{formError}</Alert>}
            <Form.Group className="mb-3">
              <Form.Label>Tên đăng nhập</Form.Label>
              <Form.Control
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Mật khẩu</Form.Label>
              <Form.Control
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Vai trò</Form.Label>
              <Form.Select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                required
              >
                <option value="user">Người dùng</option>
                <option value="vip">Người dùng trả phí</option>
                <option value="admin">Quản trị viên</option>
              </Form.Select>
              {stats && stats.limits && (
                <Form.Text className="text-muted">
                  {formData.role === 'admin' && (
                    <span>Còn lại: {stats.limits.remainingAdmin} Admin</span>
                  )}
                  {formData.role === 'vip' && (
                    <span>Còn lại: {stats.limits.remainingVip} người dùng trả phí</span>
                  )}
                </Form.Text>
              )}
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Hủy
            </Button>
            <Button variant="primary" type="submit">
              Tạo người dùng
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Internal Code Modal */}
      <Modal show={showCodeModal} onHide={() => setShowCodeModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Mã nội bộ (dùng để tạo Admin)</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {codeMessage && <Alert variant="info">{codeMessage}</Alert>}
          <Form.Group className="mb-3">
            <Form.Label>Mã nội bộ hiện tại</Form.Label>
            {internalCodeHashed ? (
              <Form.Control type="text" value={"●●●●●"} readOnly />
            ) : (
              <Form.Control
                type="text"
                value={internalCodeValue}
                onChange={(e) => setInternalCodeValue(e.target.value)}
              />
            )}
            <Form.Text className="text-muted">Mã mặc định: 1836. Chỉ admin mới có thể thay đổi. Thay đổi sẽ được lưu lại trong lịch sử (audit).</Form.Text>
          </Form.Group>
          <div className="d-flex justify-content-between">
            <Button variant="link" onClick={async () => {
              try {
                const res = await usersAPI.getInternalCodeAudit();
                const payload = res.data?.data || res.data;
                setAuditEntries(payload || []);
                setShowAuditModal(true);
              } catch (err) {
                setCodeMessage('Không thể lấy lịch sử thay đổi');
              }
            }}>Xem lịch sử thay đổi</Button>
            <div className="text-muted">(Thay đổi sẽ được lưu lại)</div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCodeModal(false)}>Đóng</Button>
          <Button variant="primary" onClick={async () => {
            try {
              setCodeMessage('Đang cập nhật...');
              await usersAPI.updateInternalCode({ value: internalCodeValue });
              setCodeMessage('Cập nhật thành công');
              fetchInternalCode();
              setTimeout(() => setCodeMessage(''), 2000);
            } catch (err) {
              setCodeMessage(err.response?.data?.message || 'Không thể cập nhật mã nội bộ');
            }
          }}>Lưu</Button>
        </Modal.Footer>
      </Modal>

      {/* Edit User Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title><FiEdit className="me-2" />Chỉnh sửa người dùng</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditSubmit}>
          <Modal.Body>
            {formError && <Alert variant="danger">{formError}</Alert>}
            <Form.Group className="mb-3">
              <Form.Label>Tên đăng nhập</Form.Label>
              <Form.Control
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Mật khẩu mới (để trống nếu không đổi)</Form.Label>
              <Form.Control
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Nhập mật khẩu mới hoặc để trống"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Vai trò</Form.Label>
              <Form.Select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                required
                disabled={userToEdit?.id === currentUser.id}
              >
                <option value="user">Người dùng</option>
                <option value="vip">Người dùng trả phí</option>
                <option value="admin">Quản trị viên</option>
              </Form.Select>
              {userToEdit?.id === currentUser.id && (
                <Form.Text className="text-muted">
                  Không thể thay đổi vai trò của chính mình
                </Form.Text>
              )}
              {stats && stats.limits && userToEdit?.role !== formData.role && (
                <Form.Text className="text-muted">
                  {formData.role === 'admin' && (
                    <span>Còn lại: {stats.limits.remainingAdmin} Admin</span>
                  )}
                  {formData.role === 'vip' && (
                    <span>Còn lại: {stats.limits.remainingVip} người dùng trả phí</span>
                  )}
                </Form.Text>
              )}
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Hủy
            </Button>
            <Button variant="primary" type="submit">
              Cập nhật
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default AdminUsers;

import React from 'react';
import { Navbar, Nav, NavDropdown, Container, Button } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { LinkContainer } from 'react-router-bootstrap';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { FiBook, FiGrid, FiList, FiUser, FiUsers, FiLogOut, FiLogIn, FiUserPlus, FiSettings, FiStar } from 'react-icons/fi';
import { MdAdminPanelSettings, MdDashboard } from 'react-icons/md';

const AppNavbar = () => {
  const { currentUser, logout, isAdmin, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const goHome = (e) => {
    e.preventDefault();
    navigate(isAuthenticated ? '/dashboard' : '/');
  };

  return (
    <Navbar bg="primary" variant="dark" expand="lg" className="shadow-sm">
      <Container>
        <Navbar.Brand href="#" onClick={goHome} className="fw-bold">
          <FiBook className="me-2" /> Library System
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {isAuthenticated && (
              <>
                <LinkContainer to="/dashboard">
                  <Nav.Link><MdDashboard className="me-1" /> Dashboard</Nav.Link>
                </LinkContainer>
                
                <LinkContainer to="/books">
                  <Nav.Link><FiList className="me-1" /> Danh sách sách</Nav.Link>
                </LinkContainer>

                <LinkContainer to="/my-borrows">
                  <Nav.Link><FiGrid className="me-1" /> Lịch sử mượn</Nav.Link>
                </LinkContainer>

                <LinkContainer to="/favorites">
                  <Nav.Link><FiStar className="me-1" /> Yêu thích</Nav.Link>
                </LinkContainer>

                {isAdmin && (
                  <NavDropdown title={<><MdAdminPanelSettings className="me-1" /> Quản trị</>} id="admin-dropdown">
                    <LinkContainer to="/admin/books">
                      <NavDropdown.Item><FiBook className="me-2" /> Quản lý sách</NavDropdown.Item>
                    </LinkContainer>
                    <LinkContainer to="/admin/users">
                      <NavDropdown.Item><FiUsers className="me-2" /> Quản lý người dùng</NavDropdown.Item>
                    </LinkContainer>
                    <LinkContainer to="/admin/borrows">
                      <NavDropdown.Item><FiGrid className="me-2" /> Quản lý mượn trả</NavDropdown.Item>
                    </LinkContainer>
                    <NavDropdown.Divider />
                    <LinkContainer to="/admin/dashboard">
                      <NavDropdown.Item><MdDashboard className="me-2" /> Dashboard Admin</NavDropdown.Item>
                    </LinkContainer>
                  </NavDropdown>
                )}
              </>
            )}
          </Nav>

          <Nav>
            {isAuthenticated ? (
              <>
                <div className="d-flex align-items-center me-3">
                  <ThemeToggle />
                </div>
                <NavDropdown 
                  title={<><FiUser className="me-1" /> {currentUser?.username || 'User'}</>} 
                  id="user-dropdown"
                  align="end"
                >
                  <NavDropdown.Header>
                    <small className="text-muted">
                      Vai trò: {isAdmin ? 'Quản trị viên' : 'Người dùng'}
                    </small>
                  </NavDropdown.Header>
                  <LinkContainer to="/profile">
                    <NavDropdown.Item><FiSettings className="me-2" /> Thông tin cá nhân</NavDropdown.Item>
                  </LinkContainer>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout}>
                    <FiLogOut className="me-2" /> Đăng xuất
                  </NavDropdown.Item>
                </NavDropdown>
              </>
            ) : (
              <>
                <div className="d-flex align-items-center me-3">
                  <ThemeToggle />
                </div>
                <LinkContainer to="/login">
                  <Nav.Link>
                    <Button variant="outline-light" size="sm" className="me-2">
                      <FiLogIn className="me-1" /> Đăng nhập
                    </Button>
                  </Nav.Link>
                </LinkContainer>
                <LinkContainer to="/register">
                  <Nav.Link>
                    <Button variant="light" size="sm">
                      <FiUserPlus className="me-1" /> Đăng ký
                    </Button>
                  </Nav.Link>
                </LinkContainer>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AppNavbar;

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Spinner, Container } from 'react-bootstrap';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin, currentUser } = useAuth();
  const location = useLocation();

  // Nếu chưa load xong thông tin user
  if (currentUser === undefined) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{minHeight: '50vh'}}>
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  // Chưa đăng nhập
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Yêu cầu quyền admin nhưng user không phải admin
  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastContainer } from 'react-toastify';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';

// Components
import AppNavbar from './components/Layout/Navbar';
import ProtectedRoute from './components/Layout/ProtectedRoute';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import AdminDashboard from './components/Dashboard/AdminDashboard';
import BookList from './components/Books/BookList';
import BookDetail from './components/Books/BookDetail';
import BookForm from './components/Books/BookForm';
import BookReader from './components/Books/BookReader';
import MyFavorites from './components/Books/MyFavorites';
import AdminBooks from './components/Admin/AdminBooks';
import AdminUsers from './components/Admin/AdminUsers';
import Profile from './components/User/Profile';
import MyBorrows from './components/Borrows/MyBorrows';
import AdminBorrows from './components/Borrows/AdminBorrows';

// Custom CSS
import './App.css';
import './styles/darkmode.css';

function App() {
  return (
    <div className="App">
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <AppNavbar />
            <main className="main-content">
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/books" element={
                <ProtectedRoute>
                  <BookList />
                </ProtectedRoute>
              } />
              
              <Route path="/books/:id" element={
                <ProtectedRoute>
                  <BookDetail />
                </ProtectedRoute>
              } />

              <Route path="/reader/:id" element={
                <ProtectedRoute>
                  <BookReader />
                </ProtectedRoute>
              } />
              
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />

              <Route path="/my-borrows" element={
                <ProtectedRoute>
                  <MyBorrows />
                </ProtectedRoute>
              } />

              <Route path="/favorites" element={
                <ProtectedRoute>
                  <MyFavorites />
                </ProtectedRoute>
              } />

              {/* Admin Only Routes */}
              <Route path="/admin/dashboard" element={
                <ProtectedRoute adminOnly={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/books" element={
                <ProtectedRoute adminOnly={true}>
                  <AdminBooks />
                </ProtectedRoute>
              } />

              <Route path="/admin/borrows" element={
                <ProtectedRoute adminOnly={true}>
                  <AdminBorrows />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/books/new" element={
                <ProtectedRoute adminOnly={true}>
                  <BookForm />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/books/edit/:id" element={
                <ProtectedRoute adminOnly={true}>
                  <BookForm />
                </ProtectedRoute>
              } />
              
              <Route path="/admin/users" element={
                <ProtectedRoute adminOnly={true}>
                  <AdminUsers />
                </ProtectedRoute>
              } />

              {/* Default Redirects */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
          
          {/* Toast Notifications */}
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
          />
        </Router>
      </AuthProvider>
      </ThemeProvider>
    </div>
  );
}

export default App;

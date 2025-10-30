import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { booksAPI, usersAPI } from '../../services/api';
import { FiBook, FiUsers, FiCheckCircle, FiAlertTriangle, FiPlus, FiEye, FiSettings } from 'react-icons/fi';
import { MdDashboard } from 'react-icons/md';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ totalBooks: 0, totalUsers: 0, availableBooks: 0, outOfStock: 0 });
  const [recentBooks, setRecentBooks] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#30cfd0', '#c471ed', '#f38181', '#aa076b', '#61045f'];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, usersResponse, recentBooksResponse] = await Promise.all([
        booksAPI.getStatsOverview(),
        usersAPI.getAll(),
        booksAPI.getAll({ page: 1, limit: 5, sortBy: 'createdAt', order: 'DESC' })
      ]);

      const statsData = statsResponse.data || {};
      
      // Normalize users data to always be an array
      const usersData = usersResponse.data;
      let usersList = [];
      if (Array.isArray(usersData)) {
        usersList = usersData;
      } else if (Array.isArray(usersData?.data)) {
        usersList = usersData.data;
      } else if (Array.isArray(usersData?.data?.users)) {
        usersList = usersData.data.users;
      } else if (Array.isArray(usersData?.users)) {
        usersList = usersData.users;
      }
      
      const recentBooksData = (recentBooksResponse.data && recentBooksResponse.data.books) || [];

      setStats({
        totalBooks: statsData.totalBooks || 0,
        totalUsers: usersList.length || 0,
        availableBooks: statsData.availableBooks || 0,
        outOfStock: statsData.outOfStock || 0,
        onlineBooks: statsData.onlineBooks || 0,
        physicalBooks: statsData.physicalBooks || 0,
        withCover: statsData.withCover || 0,
        withContent: statsData.withContent || 0
      });

      setRecentBooks(recentBooksData);
      setRecentUsers(usersList.slice(-5).reverse());

        // Normalize and deduplicate category counts (trim + case-insensitive) to avoid duplicate slices
        const rawCats = statsData.categoryCounts || [];
        const catMap = {};
        rawCats.forEach(c => {
          const rawName = (c.category || '').toString();
          const norm = rawName.trim().toLowerCase();
          const count = parseInt(c.count, 10) || 0;
          if (!catMap[norm]) {
            catMap[norm] = { name: rawName.trim(), value: count };
          } else {
            catMap[norm].value += count;
          }
        });
        setCategoryData(Object.values(catMap));
      setStockData([
        { name: 'Hết hàng (0)', count: statsData.outOfStock || 0 },
        { name: 'Còn hàng (>=1)', count: statsData.availableBooks || 0 },
      ]);
    } catch (err) {
      console.error('Dashboard error:', err);
      setError('Không thể tải dữ liệu dashboard');
    } finally {
      setLoading(false);
    }
  };

  // derived chart data
  const topCategoriesData = categoryData
    .slice()
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const onlinePhysicalData = [
    { name: 'Trực tuyến', value: stats.onlineBooks || 0 },
    { name: 'Trực tiếp', value: stats.physicalBooks || 0 }
  ];

  if (loading) {
    return (
      <Container>
        <div className="text-center py-5">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Đang tải dữ liệu dashboard...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <div className="d-flex align-items-center">
            <MdDashboard style={{ fontSize: '2.5rem', marginRight: '1rem', color: '#667eea' }} />
            <div>
              <h1 className="h2 mb-1">Admin Dashboard</h1>
              <p className="text-muted mb-0">Tổng quan hệ thống thư viện</p>
            </div>
          </div>
        </Col>
      </Row>

      {/* Grouped classification charts */}
      <Row className="mb-4">
        <Col>
          <Card className="border-0 shadow-sm h-100 charts-card">
            <Card.Header style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', borderBottom: 'none' }}>
              <h5 className="mb-0"><FiBook className="me-2" />Phân loại sách</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={7} className="mb-3">
                  {categoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={360}>
                      <PieChart>
                        <Pie 
                          data={categoryData} 
                          cx="50%" 
                          cy="50%" 
                          labelLine={false} 
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={120}
                          innerRadius={60}
                          fill="#8884d8" 
                          dataKey="value"
                          paddingAngle={2}
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend 
                          layout="vertical" 
                          align="right" 
                          verticalAlign="middle"
                          wrapperStyle={{ paddingLeft: '20px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-5">
                      <FiBook style={{ fontSize: '3rem', color: '#dee2e6' }} />
                      <p className="text-muted mt-3">Chưa có dữ liệu</p>
                    </div>
                  )}
                </Col>

                <Col md={5}>
                  <Row>
                    <Col xs={12} className="mb-3">
                      <Card className="h-100 border-0 mini-chart-card">
                        <Card.Body className="p-2">
                          <h6 className="mb-3">Phân bố: Trực tuyến vs Trực tiếp</h6>
                          {onlinePhysicalData && onlinePhysicalData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={160}>
                              <PieChart>
                                <Pie
                                  data={onlinePhysicalData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={30}
                                  outerRadius={60}
                                  dataKey="value"
                                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                >
                                  {onlinePhysicalData.map((entry, index) => (
                                    <Cell key={`op-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          ) : (
                            <p className="text-muted">Chưa có dữ liệu</p>
                          )}
                        </Card.Body>
                      </Card>
                    </Col>

                    <Col xs={12}>
                      <Card className="h-100 border-0 mini-chart-card">
                        <Card.Body className="p-2">
                          <h6 className="mb-3">Top thể loại</h6>
                          {topCategoriesData && topCategoriesData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={160}>
                              <BarChart data={topCategoriesData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={120} />
                                <Tooltip />
                                <Bar dataKey="value" fill="#764ba2" radius={[0, 8, 8, 0]}>
                                  {topCategoriesData.map((entry, index) => (
                                    <Cell key={`tc-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          ) : (
                            <p className="text-muted">Chưa có dữ liệu</p>
                          )}
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
          <div className="mt-2">
            <Button variant="outline-danger" size="sm" onClick={fetchDashboardData}>
              Thử lại
            </Button>
          </div>
        </Alert>
      )}

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={6} lg={3} className="mb-3">
          <Card className="stats-card h-100 border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <Card.Body className="text-center">
              <FiBook style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.9 }} />
              <h2 className="mb-1">{stats.totalBooks}</h2>
              <p className="mb-0 opacity-90">Tổng số sách</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={3} className="mb-3">
          <Card className="stats-card h-100 border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
            <Card.Body className="text-center">
              <FiUsers style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.9 }} />
              <h2 className="mb-1">{stats.totalUsers}</h2>
              <p className="mb-0 opacity-90">Người dùng</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={3} className="mb-3">
          <Card className="stats-card h-100 border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
            <Card.Body className="text-center">
              <FiCheckCircle style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.9 }} />
              <h2 className="mb-1">{stats.availableBooks}</h2>
              <p className="mb-0 opacity-90">Sách còn hàng</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={3} className="mb-3">
          <Card className="stats-card h-100 border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
            <Card.Body className="text-center">
              <FiAlertTriangle style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.9 }} />
              <h2 className="mb-1">{stats.outOfStock}</h2>
              <p className="mb-0 opacity-90">Sách hết hàng</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Additional Stats Row */}
      <Row className="mb-4">
        <Col md={6} lg={3} className="mb-3">
          <Card className="stats-card h-100 border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #c471ed 0%, #f64f59 100%)', color: 'white' }}>
            <Card.Body className="text-center">
              <FiBook style={{ fontSize: '2.5rem', marginBottom: '0.5rem', opacity: 0.9 }} />
              <h3 className="mb-1">{stats.onlineBooks}</h3>
              <p className="mb-0 opacity-90">Sách trực tuyến</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={3} className="mb-3">
          <Card className="stats-card h-100 border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)', color: 'white' }}>
            <Card.Body className="text-center">
              <FiBook style={{ fontSize: '2.5rem', marginBottom: '0.5rem', opacity: 0.9 }} />
              <h3 className="mb-1">{stats.physicalBooks}</h3>
              <p className="mb-0 opacity-90">Sách trực tiếp</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={3} className="mb-3">
          <Card className="stats-card h-100 border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #ffd89b 0%, #19547b 100%)', color: 'white' }}>
            <Card.Body className="text-center">
              <FiEye style={{ fontSize: '2.5rem', marginBottom: '0.5rem', opacity: 0.9 }} />
              <h3 className="mb-1">{stats.withCover}</h3>
              <p className="mb-0 opacity-90">Có ảnh bìa</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={3} className="mb-3">
          <Card className="stats-card h-100 border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #7f7fd5 0%, #86a8e7 50%, #91eae4 100%)', color: 'white' }}>
            <Card.Body className="text-center">
              <FiSettings style={{ fontSize: '2.5rem', marginBottom: '0.5rem', opacity: 0.9 }} />
              <h3 className="mb-1">{stats.withContent}</h3>
              <p className="mb-0 opacity-90">Có nội dung sách</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Row className="mb-4">
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Header style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', borderBottom: 'none' }}>
              <h5 className="mb-0"><FiSettings className="me-2" />Hành động nhanh</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6} lg={3} className="mb-2">
                  <Button variant="primary" className="w-100" onClick={() => navigate('/admin/books/new')}>
                    <FiPlus className="me-2" />Thêm sách mới
                  </Button>
                </Col>
                <Col md={6} lg={3} className="mb-2">
                  <Button variant="success" className="w-100" onClick={() => navigate('/admin/books')}>
                    <FiBook className="me-2" />Quản lý sách
                  </Button>
                </Col>
                <Col md={6} lg={3} className="mb-2">
                  <Button variant="info" className="w-100" onClick={() => navigate('/admin/users')}>
                    <FiUsers className="me-2" />Quản lý người dùng
                  </Button>
                </Col>
                <Col md={6} lg={3} className="mb-2">
                  <Button variant="outline-secondary" className="w-100" onClick={() => navigate('/books')}>
                    <FiEye className="me-2" />Xem thư viện
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Charts Section */}
      <Row className="mb-4">
        <Col lg={7} className="mb-4">
          <Card className="border-0 shadow-sm h-100">
            <Card.Header style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', borderBottom: 'none' }}>
              <h5 className="mb-0"><FiBook className="me-2" />Phân loại sách theo thể loại</h5>
            </Card.Header>
            <Card.Body>
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie 
                      data={categoryData} 
                      cx="50%" 
                      cy="50%" 
                      labelLine={false} 
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={110}
                      innerRadius={60}
                      fill="#8884d8" 
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend 
                      layout="vertical" 
                      align="right" 
                      verticalAlign="middle"
                      wrapperStyle={{ paddingLeft: '20px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-5">
                  <FiBook style={{ fontSize: '3rem', color: '#dee2e6' }} />
                  <p className="text-muted mt-3">Chưa có dữ liệu</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={5} className="mb-4">
          <Card className="border-0 shadow-sm h-100">
            <Card.Header style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white', borderBottom: 'none' }}>
              <h5 className="mb-0"><FiCheckCircle className="me-2" />Phân bố tồn kho</h5>
            </Card.Header>
            <Card.Body>
              {stockData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={stockData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} />
                    <Tooltip 
                      contentStyle={{ 
                        background: 'rgba(255, 255, 255, 0.95)', 
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Bar dataKey="count" fill="#43e97b" radius={[0, 8, 8, 0]} name="Số lượng sách">
                      {stockData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#fa709a' : '#43e97b'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-5">
                  <FiCheckCircle style={{ fontSize: '3rem', color: '#dee2e6' }} />
                  <p className="text-muted mt-3">Chưa có dữ liệu</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col lg={6} className="mb-4">
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="d-flex justify-content-between align-items-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', borderBottom: 'none' }}>
              <h5 className="mb-0"><FiBook className="me-2" />Sách mới nhất</h5>
              <Button variant="light" size="sm" onClick={() => navigate('/admin/books')}>
                Xem tất cả →
              </Button>
            </Card.Header>
            <Card.Body className="p-0">
              {recentBooks.length === 0 ? (
                <div className="text-center py-4">
                  <FiBook style={{ fontSize: '3rem', color: '#dee2e6' }} />
                  <p className="text-muted mb-0 mt-3">Chưa có sách nào</p>
                </div>
              ) : (
                <Table hover className="mb-0">
                  <thead style={{ background: '#f8f9fa' }}>
                    <tr>
                      <th className="border-0">Tên sách</th>
                      <th className="border-0">Tác giả</th>
                      <th className="border-0">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBooks.map(book => (
                      <tr key={book.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/books/${book.id}`)}>
                        <td>
                          <strong>{book.title}</strong>
                          <br />
                          <small className="text-muted">{book.category}</small>
                        </td>
                        <td>{book.author}</td>
                        <td>
                          {book.stock > 0 ? (
                            <Badge bg="success" className="px-3">Còn {book.stock}</Badge>
                          ) : (
                            <Badge bg="danger" className="px-3">Hết</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6} className="mb-4">
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="d-flex justify-content-between align-items-center" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white', borderBottom: 'none' }}>
              <h5 className="mb-0"><FiUsers className="me-2" />Người dùng mới nhất</h5>
              <Button variant="light" size="sm" onClick={() => navigate('/admin/users')}>
                Xem tất cả →
              </Button>
            </Card.Header>
            <Card.Body className="p-0">
              {recentUsers.length === 0 ? (
                <div className="text-center py-4">
                  <FiUsers style={{ fontSize: '3rem', color: '#dee2e6' }} />
                  <p className="text-muted mb-0 mt-3">Chưa có người dùng nào</p>
                </div>
              ) : (
                <Table hover className="mb-0">
                  <thead style={{ background: '#f8f9fa' }}>
                    <tr>
                      <th className="border-0">Tên</th>
                      <th className="border-0">Email</th>
                      <th className="border-0">Vai trò</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentUsers.map(user => (
                      <tr key={user.id}>
                        <td><strong>{user.username}</strong></td>
                        <td><small className="text-muted">{user.email}</small></td>
                        <td>
                          <Badge bg={user.role === 'admin' ? 'primary' : 'secondary'} className="px-3">
                            {user.role === 'admin' ? 'Admin' : 'User'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminDashboard;

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Container, Button, Alert, Spinner, ButtonGroup } from 'react-bootstrap';
import { booksAPI } from '../../services/api';
import API from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FiBookOpen, FiDownload, FiExternalLink } from 'react-icons/fi';
import PDFViewer from './PDFViewer';

const BookReader = () => {
  const { id } = useParams();
  const { isVipOrAdmin } = useAuth();
  const navigate = useNavigate();

  const contentUrl = useMemo(() => booksAPI.getContentUrl(id), [id]);
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewerType, setViewerType] = useState('pdf'); // 'pdf' | 'text' | 'download' | 'html'
  const [textContent, setTextContent] = useState('');
  const [fileBlobUrl, setFileBlobUrl] = useState(null);
  const [htmlContent, setHtmlContent] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { data } = await booksAPI.getById(id);
        setBook(data);
        const file = data?.contentFile || '';
        const ext = file.split('.').pop().toLowerCase();

        // Use authenticated axios requests to fetch content (token via interceptor)
        if (ext === 'txt') {
          setViewerType('text');
          const res = await API.get(`/books/${id}/content`, { responseType: 'text' });
          setTextContent(res.data);
        } else {
          // For pdf/html/other binary files, fetch as blob
          try {
            const res = await API.get(`/books/${id}/content`, { responseType: 'blob' });
            const blob = res.data;
            // Create object URL for viewer / download
            if (fileBlobUrl) {
              try { URL.revokeObjectURL(fileBlobUrl); } catch (e) {}
            }
            const blobUrl = URL.createObjectURL(blob);
            setFileBlobUrl(blobUrl);

            const mime = blob.type || '';
            if (mime === 'application/pdf' || ext === 'pdf') {
              setViewerType('pdf');
            } else if (mime === 'text/html' || ext === 'html' || ext === 'docx') {
              // If server returned HTML, render it; if docx routed to HTML conversion, ext may be docx but server returns html
              const text = await blob.text();
              setHtmlContent(text);
              setViewerType('html');
            } else if (mime.startsWith('text')) {
              const text = await blob.text();
              setTextContent(text);
              setViewerType('text');
            } else {
              setViewerType('download');
            }
          } catch (e) {
            setError('Không thể tải nội dung sách');
          }
        }
        setError('');
      } catch (e) {
        setError('Không thể tải nội dung sách');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, contentUrl]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (fileBlobUrl) {
        try { URL.revokeObjectURL(fileBlobUrl); } catch (e) {}
      }
    };
  }, [fileBlobUrl]);

  if (!isVipOrAdmin) {
    return (
      <Container className="py-5">
        <Alert variant="warning" className="text-center">
          <h5>Vui lòng nâng cấp tài khoản để đọc sách trực tuyến</h5>
          <Button variant="outline-secondary" className="mt-2" onClick={() => navigate(-1)}>Quay lại</Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0"><FiBookOpen className="me-2" />Đọc sách trực tuyến</h4>
        <div className="d-flex align-items-center gap-2">
          <ButtonGroup>
            <a className="btn btn-outline-primary" href={fileBlobUrl || contentUrl} target="_blank" rel="noreferrer">
              <FiExternalLink className="me-1" />Mở tab mới
            </a>
            <a className="btn btn-outline-success" href={fileBlobUrl || contentUrl} download>
              <FiDownload className="me-1" />Tải xuống
            </a>
          </ButtonGroup>
          <Button variant="outline-secondary" onClick={() => navigate(-1)}>Quay lại</Button>
        </div>
      </div>
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
          <div className="text-muted mt-2">Đang tải nội dung...</div>
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : viewerType === 'text' ? (
        <Card>
          <Card.Body style={{ height: '80vh', overflow: 'auto', whiteSpace: 'pre-wrap' }}>
            <pre style={{ whiteSpace: 'pre-wrap' }}>{textContent}</pre>
          </Card.Body>
        </Card>
      ) : viewerType === 'pdf' ? (
        <Card>
          <Card.Body style={{ height: '80vh', padding: 0 }}>
            <div style={{ width: '100%', height: '100%' }}>
              <PDFViewer fileUrl={fileBlobUrl || contentUrl} />
            </div>
          </Card.Body>
        </Card>
      ) : viewerType === 'html' ? (
        <Card>
          <Card.Body style={{ height: '80vh', overflow: 'auto' }}>
            <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
          </Card.Body>
        </Card>
      ) : (
        <Alert variant="info">
          Định dạng tệp không hỗ trợ xem trực tiếp. Vui lòng tải xuống để đọc.
        </Alert>
      )}
    </Container>
  );
};

export default BookReader;

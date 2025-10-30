import React, { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button, ButtonGroup } from 'react-bootstrap';
import { FiZoomIn, FiZoomOut, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

// Configure PDF.js worker to use the worker file served from the public/ folder.
// We copy the worker into `public/pdf.worker.min.mjs` so CRA will serve it at '/pdf.worker.min.mjs'.
// Using `process.env.PUBLIC_URL` keeps it correct for deployments where the app is served from a subpath.
pdfjs.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL || ''}/pdf.worker.min.mjs`;

const PDFViewer = ({ fileUrl, initialScale = 1.2 }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(initialScale);

  const onDocumentLoadSuccess = useCallback(({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
  }, []);

  const zoomIn = () => setScale(s => Math.min(s + 0.2, 3));
  const zoomOut = () => setScale(s => Math.max(s - 0.2, 0.5));
  const prevPage = () => setPageNumber(p => Math.max(p - 1, 1));
  const nextPage = () => setPageNumber(p => Math.min(p + 1, numPages || 1));

  return (
    <div className="d-flex flex-column h-100">
      <div className="d-flex align-items-center justify-content-between p-2 border-bottom bg-light">
        <div className="small text-muted">
          Trang {pageNumber} / {numPages || '-'}
        </div>
        <ButtonGroup size="sm">
          <Button variant="outline-secondary" onClick={zoomOut} title="Thu nhỏ"><FiZoomOut /></Button>
          <Button variant="outline-secondary" onClick={zoomIn} title="Phóng to"><FiZoomIn /></Button>
          <Button variant="outline-secondary" onClick={prevPage} disabled={pageNumber <= 1} title="Trang trước"><FiChevronLeft /></Button>
          <Button variant="outline-secondary" onClick={nextPage} disabled={numPages && pageNumber >= numPages} title="Trang sau"><FiChevronRight /></Button>
        </ButtonGroup>
      </div>

      <div className="flex-grow-1 d-flex justify-content-center align-items-start overflow-auto" style={{ background: '#f7f7f7' }}>
        <div className="p-3">
          <Document file={fileUrl} onLoadSuccess={onDocumentLoadSuccess} loading={<div className="text-center p-5">Đang tải PDF...</div>}>
            <Page pageNumber={pageNumber} scale={scale} />
          </Document>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;

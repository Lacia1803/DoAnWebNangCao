const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

// Adjust these values if your backend runs on different port
const API_BASE = process.env.API_BASE || 'http://localhost:5000/api';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

async function uploadFile(filePath, bookData = {}) {
  const form = new FormData();
  Object.entries(bookData).forEach(([k, v]) => form.append(k, v));
  form.append('contentFile', fs.createReadStream(filePath));

  const headers = Object.assign({ Authorization: `Bearer ${ADMIN_TOKEN}` }, form.getHeaders());
  const resp = await axios.post(`${API_BASE}/books`, form, { headers, maxContentLength: Infinity, maxBodyLength: Infinity });
  return resp.data;
}

(async () => {
  try {
    console.log('Testing upload of PDF...');
    const pdfResult = await uploadFile('./test_files/sample.pdf', { title: 'Sample PDF Test', author: 'Tester', category: 'Test', stock: 1, bookType: 'online' });
    console.log('PDF upload result:', pdfResult.message || pdfResult);

    console.log('Testing upload of DOCX...');
    const docxResult = await uploadFile('./test_files/sample.docx', { title: 'Sample DOCX Test', author: 'Tester', category: 'Test', stock: 1, bookType: 'online' });
    console.log('DOCX upload result:', docxResult.message || docxResult);
  } catch (err) {
    console.error('Upload test failed:', err.response?.data || err.message);
    process.exit(1);
  }
})();

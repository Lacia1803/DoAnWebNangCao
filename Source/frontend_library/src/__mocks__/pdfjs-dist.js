// Minimal mock for pdfjs-dist used by react-pdf in tests
module.exports = {
  getDocument: () => ({ promise: Promise.resolve({}) }),
  GlobalWorkerOptions: {}
};

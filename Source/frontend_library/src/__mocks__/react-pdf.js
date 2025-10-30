// Simple mock for react-pdf used during Jest runs
exports.Document = function Document() { return 'Document'; };
exports.Page = function Page() { return 'Page'; };
exports.pdfjs = { GlobalWorkerOptions: {} };

const path = require('path');
const fs = require('fs');

try {
  const { specs } = require('../swagger');
  const outPath = path.resolve(__dirname, '..', '..', '..', 'openapi-spec.json');
  fs.writeFileSync(outPath, JSON.stringify(specs, null, 2), 'utf8');
  console.log('Wrote OpenAPI spec to', outPath);
} catch (err) {
  console.error('Failed to export OpenAPI spec:', err);
  process.exit(1);
}

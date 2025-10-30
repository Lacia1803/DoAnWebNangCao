const fs = require('fs');
const path = require('path');
const { specs } = require('../swagger');
const yaml = require('js-yaml');

const outJson = path.join(__dirname, '..', 'openapi.json');
const outYaml = path.join(__dirname, '..', 'openapi.yaml');

try {
  fs.writeFileSync(outJson, JSON.stringify(specs, null, 2), 'utf8');
  fs.writeFileSync(outYaml, yaml.dump(specs), 'utf8');
  console.log('Wrote OpenAPI files:');
  console.log(' -', outJson);
  console.log(' -', outYaml);
} catch (err) {
  console.error('Failed to write OpenAPI files:', err);
  process.exit(1);
}

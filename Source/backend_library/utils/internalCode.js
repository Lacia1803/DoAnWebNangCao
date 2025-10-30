const bcrypt = require('bcryptjs');

/**
 * Hash an internal admin code for storage.
 * @param {string} value
 */
async function hashInternalCode(value) {
  if (!value) return null;
  const trimmed = String(value).trim();
  const hash = await bcrypt.hash(trimmed, 10);
  return hash;
}

/**
 * Compare a provided code against stored value.
 * If stored looks like a bcrypt hash (starts with $2), compare with bcrypt.
 * Otherwise, fall back to direct string equality for backward compatibility.
 * @param {string} provided
 * @param {string|null} stored
 * @returns {Promise<boolean>}
 */
async function compareInternalCode(provided, stored) {
  const prov = String(provided || '').trim();
  if (!stored) {
    // No stored value -> default code is '1836'
    return prov === '1836';
  }

  const storedStr = String(stored);
  // crude check for bcrypt hash prefix
  if (/^\$2[aby]?\$/.test(storedStr)) {
    try {
      return await bcrypt.compare(prov, storedStr);
    } catch (e) {
      return false;
    }
  }

  // fallback plaintext compare (legacy)
  return prov === storedStr;
}

module.exports = { hashInternalCode, compareInternalCode };

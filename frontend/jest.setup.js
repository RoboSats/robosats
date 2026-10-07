if (typeof crypto === 'undefined' || typeof crypto.getRandomValues !== 'function') {
  const { webcrypto } = require('crypto');
  global.crypto = webcrypto;
}

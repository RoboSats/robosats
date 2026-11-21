if (typeof crypto === 'undefined' || typeof crypto.getRandomValues !== 'function') {
  const { webcrypto } = require('crypto');
  global.crypto = webcrypto;
}

if (typeof global.window === 'undefined') {
  global.window = global;
}

if (typeof global.navigator === 'undefined') {
  global.navigator = { userAgent: 'node' };
}

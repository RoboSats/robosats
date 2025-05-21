import * as CryptoJS from 'crypto-js';
import App from './App';

// Create a polyfill for the WebCrypto API
const getWebCrypto = () => {
  return {
    subtle: {
      digest: (algorithm, data) => {
        return new Promise((resolve, reject) => {
          if (algorithm === 'SHA-256') {
            let message;

            if (data instanceof Uint8Array) {
              message = new TextDecoder().decode(data);
            } else if (data instanceof ArrayBuffer) {
              message = new TextDecoder().decode(new Uint8Array(data));
            } else {
              message = data; // Assume it's a string
            }

            const hash = CryptoJS.SHA256(message).toString();
            const match = hash.match(/.{1,2}/g);
            if (!match) {
              return reject(new Error('Hash computation failed'));
            }

            const hashArray = new Uint8Array(match.map((byte) => parseInt(byte, 16)));
            resolve(hashArray);
          } else {
            reject(new Error('Algorithm not supported'));
          }
        });
      },

      encrypt: (algorithm, key, data) => {
        return new Promise((resolve, reject) => {
          if (algorithm === 'AES-CBC') {
            const iv = CryptoJS.lib.WordArray.random(128 / 8); // Generate a random IV
            const encrypted = CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(data), key, {
              iv: iv,
              mode: CryptoJS.mode.CBC,
              padding: CryptoJS.pad.Pkcs7,
            });

            resolve({
              ciphertext: encrypted.toString(),
              iv: iv.toString(),
            });
          } else {
            reject(new Error('Algorithm not supported'));
          }
        });
      },

      decrypt: (algorithm, key, data) => {
        return new Promise((resolve, reject) => {
          if (algorithm === 'AES-CBC') {
            const { ciphertext, iv } = data;
            const decrypted = CryptoJS.AES.decrypt(ciphertext, key, {
              iv: CryptoJS.enc.Hex.parse(iv),
              mode: CryptoJS.mode.CBC,
              padding: CryptoJS.pad.Pkcs7,
            });

            resolve(decrypted.toString(CryptoJS.enc.Utf8));
          } else {
            reject(new Error('Algorithm not supported'));
          }
        });
      },

      generateKey: (algorithm, extractable, keyUsages) => {
        return new Promise((resolve, reject) => {
          if (algorithm.name === 'AES-CBC') {
            const key = CryptoJS.lib.WordArray.random(256 / 8); // Generate a random AES key
            resolve(key);
          } else {
            reject(new Error('Algorithm not supported'));
          }
        });
      },
    },
  };
};

// Override the global crypto object
if (typeof window !== 'undefined' && !window.crypto.subtle) {
  window.crypto = {
    getRandomValues: (arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
    subtle: getWebCrypto().subtle,
  };
}

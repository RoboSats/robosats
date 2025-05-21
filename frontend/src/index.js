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
              message = data;
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
    },
  };
};

// Override the global crypto object
if (typeof window !== 'undefined' && !window.crypto.getWebCrypto) {
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

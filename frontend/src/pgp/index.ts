import {
  generateKey,
  readKey,
  readPrivateKey,
  decryptKey,
  encrypt,
  decrypt,
  createMessage,
  createCleartextMessage,
  readMessage,
  sign,
} from 'openpgp/lightweight';
import { sha256 } from 'js-sha256';

// Generate KeyPair. Private Key is encrypted with the highEntropyToken
export interface generatedKeyPair {
  publicKeyArmored: string;
  encryptedPrivateKeyArmored: string;
}

export async function genKey(highEntropyToken: string): Promise<generatedKeyPair> {
  const date = new Date();
  date.setDate(date.getDate() - 1); // One day of offset. Helps reducing errors due to client's system time being in the future.

  const keyPair = await generateKey({
    type: 'ecc', // Type of the key, defaults to ECC
    curve: 'curve25519Legacy', // ECC curve name, defaults to curve25519
    userIDs: [{ name: 'RoboSats ID ' + sha256(sha256(highEntropyToken)) }], // Ideally it would be the avatar nickname, but the nickname is generated only after submission. The second SHA256 can be converted into the Nickname using nick_generator package.
    passphrase: highEntropyToken,
    format: 'armored',
    date,
  });

  return {
    publicKeyArmored: String(keyPair.publicKey),
    encryptedPrivateKeyArmored: String(keyPair.privateKey),
  };
}

// Encrypt and sign a message
export async function encryptMessage(
  plaintextMessage: string,
  ownPublicKeyArmored: string,
  peerPublicKeyArmored: string,
  privateKeyArmored: string,
  passphrase: string,
): Promise<string> {
  const ownPublicKey = await readKey({ armoredKey: ownPublicKeyArmored });
  const peerPublicKey = await readKey({ armoredKey: peerPublicKeyArmored });
  const privateKey = await decryptKey({
    privateKey: await readPrivateKey({ armoredKey: privateKeyArmored }),
    passphrase,
  });

  const d = new Date();
  const encryptedMessage = await encrypt({
    message: await createMessage({ text: plaintextMessage }), // input as Message object, message must be string
    encryptionKeys: [ownPublicKey, peerPublicKey],
    signingKeys: privateKey, // optional
    date: d.setDate(d.getDate() - 1), // One day of offset, avoids verification issue due to clock mismatch
  });

  return String(encryptedMessage); // '-----BEGIN PGP MESSAGE ... END PGP MESSAGE-----'
}

// Decrypt and check signature of a message
export interface decryptedValidatedMessage {
  decryptedMessage: string;
  validSignature: boolean;
}

export async function decryptMessage(
  encryptedMessage: string,
  publicKeyArmored: string,
  privateKeyArmored: string,
  passphrase: string,
): Promise<decryptedValidatedMessage> {
  const publicKey = await readKey({ armoredKey: publicKeyArmored });
  const privateKey = await decryptKey({
    privateKey: await readPrivateKey({ armoredKey: privateKeyArmored }),
    passphrase,
  });

  const message = await readMessage({
    armoredMessage: encryptedMessage, // parse armored message
  });
  const { data: decrypted, signatures } = await decrypt({
    message,
    verificationKeys: publicKey, // optional
    decryptionKeys: privateKey,
  });

  // check signature validity (signed messages only)
  try {
    await signatures[0].verified; // throws on invalid signature
    console.log('Signature is valid');
    return { decryptedMessage: String(decrypted), validSignature: true };
  } catch {
    return { decryptedMessage: String(decrypted), validSignature: false };
  }
}

// Sign a cleartext message
export async function signCleartextMessage(
  message: string,
  privateKeyArmored: string,
  passphrase: string,
): Promise<string> {
  const privateKey = await decryptKey({
    privateKey: await readPrivateKey({ armoredKey: privateKeyArmored }),
    passphrase,
  });

  const unsignedMessage = await createCleartextMessage({ text: message });
  const signedMessage = await sign({
    message: unsignedMessage,
    signingKeys: privateKey,
  });

  return signedMessage;
}

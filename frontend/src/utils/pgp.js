import * as openpgp from 'openpgp/lightweight';

// Generate KeyPair. Private Key is encrypted with the highEntropyToken
export async function genKey(highEntropyToken) {

  const keyPair = await openpgp.generateKey({
    type: 'ecc', // Type of the key, defaults to ECC
    curve: 'curve25519', // ECC curve name, defaults to curve25519
    userIDs: [{name: 'RoboSats Avatar ID'+ parseInt(Math.random() * 1000000)}], //Just for identification. Ideally it would be the avatar nickname, but the nickname is generated only after submission
    passphrase: highEntropyToken,
    format: 'armored'
  })

  return {publicKeyArmored: keyPair.publicKey, encryptedPrivateKeyArmored: keyPair.privateKey}
};

// Encrypt and sign a message
export async function encryptMessage(plaintextMessage, ownPublicKeyArmored, peerPublicKeyArmored, privateKeyArmored, passphrase) {

  const ownPublicKey = await openpgp.readKey({ armoredKey: ownPublicKeyArmored });
  const peerPublicKey = await openpgp.readKey({ armoredKey: peerPublicKeyArmored });
  const privateKey = await openpgp.decryptKey({
      privateKey: await openpgp.readPrivateKey({ armoredKey: privateKeyArmored }),
      passphrase
  });

  const encryptedMessage = await openpgp.encrypt({
      message: await openpgp.createMessage({ text: plaintextMessage }), // input as Message object, message must be string
      encryptionKeys: [ ownPublicKey, peerPublicKey ],
      signingKeys: privateKey // optional
  });

  return encryptedMessage; // '-----BEGIN PGP MESSAGE ... END PGP MESSAGE-----'
};

// Decrypt and check signature of a message
export async function decryptMessage(encryptedMessage, publicKeyArmored, privateKeyArmored, passphrase) {

  const publicKey = await openpgp.readKey({ armoredKey: publicKeyArmored });
  const privateKey = await openpgp.decryptKey({
      privateKey: await openpgp.readPrivateKey({ armoredKey: privateKeyArmored }),
      passphrase
  });

  const message = await openpgp.readMessage({
      armoredMessage: encryptedMessage // parse armored message
  });
  const { data: decrypted, signatures } = await openpgp.decrypt({
      message,
      verificationKeys: publicKey, // optional
      decryptionKeys: privateKey
  });
  
  // check signature validity (signed messages only)
  try {
    await signatures[0].verified; // throws on invalid signature
    console.log('Signature is valid');
    return {decryptedMessage: decrypted, validSignature: true}
  } catch (e) {
    return {decryptedMessage: decrypted, validSignature: false};
  }
};
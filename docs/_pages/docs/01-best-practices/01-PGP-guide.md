---
layout: single
title: Easy PGP Encryption
permalink: /docs/pgp-encryption/
toc: true
toc_sticky: true
sidebar:
  title: "<i class='fa-solid fa-fingerprint'></i> Easy PGP Encryption"
  nav: docs
src: "_pages/docs/01-best-practices/01-PGP-guide.md"
--- 
Learn how to use OpenKeychain to cipher sensible data during RoboSats trade.

## Why encryption is needed?

Since RoboSats works over the TOR network all communication is end-to-end encrypted. This helps prevents data in transit from being read or tampered by man-in-the-middle attacks. Also, the TOR protocol ensures that the user is connected to the domain name in the browser address bar, in this case the official RoboSats tor address(robosats6tkf3eva7x2voqso3a5wcorsnw34jveyxfqi2fu7oyheasid.onion). However, in RoboSats v0.1.0 the data is transferred as plain text through the front-end and the back-end of the application. This behavior allows the possibility that sensitive data exchanged regarding fiat payment information could be captured by a malicious sniffer on either party's computer or even on the RoboSats server at application abstraction layer. This would represent an attack to the privacy of the owner of the data. Even if RoboSats chat was completely encrypted at every step, you should still not trust that the sensitive data is encrypted. The best practice to avoid this problem is to use asymmetric encryption during the exchange of sensitive data, this guide shows a method that guarantees sensible data confidentiality using the PGP standard.

## PGP Apps

### Android
OpenKeychain is an open source Android app that allows you to create and manage cryptographic key pairs and sign or/and encrypt/decrypt text and files. OpenKeychain is based on the well established OpenPGP standard making encryption compatible across devices and systems.  OpenKeychain app can be found at F-droid.org [[Link]](https://f-droid.org/packages/org.sufficientlysecure.keychain/) or at Google play store [[Link]](https://play.google.com/store/apps/details?id=org.sufficientlysecure.keychain).

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide/OpenKeychain-logo.png" width="150"/>
</div>

### iOS
PGPro is an open source iOS app that allows you to create and manage cryptographic key pairs and sign or/and encrypt/decrypt text and files. PGPro is based on ObjectivePGP which is compatible with OpenPGP. It can be found on their website [[Link]](https://pgpro.app/) or the Apple App Store [[Link]](https://apps.apple.com/us/app/pgpro/id1481696997).

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide/PGPro-logo.png" width="150"/>
</div>

### Other
For a list of compatible software for Windows, Mac OS, and other operating systems check [openpgp.org/software/](https://openpgp.org/software/). Since the concept is the same, this method can be replicated using any another application.


## Encryption schema.

In most cases, the sensitive information we would want to protect is the seller's fiat payment information, i.e. phone number, PayPal account, etc. So, the image below shows the encryption scheme that ensures that the seller payment information can only be read by the buyer.

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide/encrypted-communication-schema.png" width="900"/>
</div>

The data exchange process has been divided into 3 easy steps:

- Creation of key pairs by the buyer.

- Sharing the buyer's public key with the seller.

- Encrypted data exchange.

## Step by step guide.

### Creation of key pairs by the buyer.

The first step to ensure data confidentiality is to create a public/private key pair. Below are shown the steps to create a key pair in the OpenKeychain app, this procedure only needs to be done by the buyer. This step only needs to be done once, there is no need to repeat it when buyers want to buy again, since in a future trade he will already have the key pair.

<br/>

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide/PGP-keys-creation-steps.png" width="900"/>
</div>

<br/>

### Sharing the buyer's public key with the seller.

Now the buyer is holding two keys, the private key must only be known by his owner (in this specific case the buyer, who has also created it) and the public key can be known by anyone else (the seller). The seller needs the buyer's public key in order to encrypt the sensitive data, so the buyer must send the plain text that represents the public key. The steps below show how to share the plain text that represents the public key, as well as how the seller adds it to his OpenKeychain app to use it later.

<br/>

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide/pub-key-sharing-steps.png" width="900"/>
</div>

<br/>

The key must be copied including the header `(-----BEGIN PGP PUBLIC KEY BLOCK-----)` and footer `(-----END PGP PUBLIC KEY BLOCK-----)` for the correct operation of the application.

### Encrypted data exchange.

Once the seller has the buyer's public key, the encryption schema show above can be applied. The following steps describe the encrypted data exchange process.

<br/>

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide/encrypted-data-sharing-steps.png" width="900"/>
</div>

<br/>

The encrypted data must be copied including the header `(-----BEGIN PGP MESSAGE-----)` and footer `(-----END PGP MESSAGE-----)` for the correct operation of the application. If the buyer obtains interpretable data, it means that the exchange has been successful and the confidentiality of the data is assured since the only key that can decrypt it is the private key of the buyer.

If you would like to read more easily crafted tutorial on how to use OpenKeychain for general purposes check [As Easy as P,G,P](https://diverter.hostyourown.tools/as-easy-as-pgp/)
{% include improve %}
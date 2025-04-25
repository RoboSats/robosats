---
layout: single
title: Easy PGP Encryption
permalink: /docs/pgp-encryption/
toc: true
toc_sticky: true
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/fingerprint.svg"/>PGP Encryption'
  nav: docs
src: "_pages/docs/01-best-practices/01-pgp-guide.md"
---

All comunications in RoboSats are PGP encrypted. The client app is fully transparent and offers an easy way to copy and export the PGP keys.

## Verify the privacy of your communication

You can guarantee your sensible data confidentiality by verifying RoboSats' implementation of the PGP standard. Any third party PGP implementation that allows you to import keys and messages can be used to verify RoboSats' chat. In this small guide we will be using [GnuPG](https://gnupg.org/) command line tool.

### Importing keys into GnuPG
#### Import your encrypted private key
Every robot avatar has a public key and an encrypted private key. We can import the private key to GPG, first we copy it from RoboSats:

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide/copy-private-key.png" width="550"/>
</div>

Then we import it into GnuPG with the following command:

```
echo "<paste_your_encrypted_private_key>" | gpg --import
```

It will look like this:

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide/gpg-1.png" width="450"/>
</div>

You will be prompt to enter the passphrase of the private key. We use our *supersecret* robot **token** to decrypt it, you are the only one who knows the robot token.

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide/gpg-2.png" width="350"/>
</div>

If your token is the right one, you should have imported the private key for communication.
<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide/gpg-3.png" width="650"/>
</div>
We can see how the frontend application named this key `"RoboSats ID<hash>"`. This is the robot ID, the second SHA256 hash of our secret token, and it was used originally to deterministically generate our robot nickname and robot avatar image ([learn more](/docs/private/#robot-avatar-generation-pipeline)).

#### Import your peer's public key
We just need to repeat the steps above to import our counterpart's public key.

```
echo "<paste_peer_public_key>" | gpg --import
```

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide/gpg-4.png" width="650"/>
</div>

We are all set. We have imported our encrypted private key and our peer's public key into GPG. So far everything seems to be right.

### Decrypting and verifying messages with GnuPG
#### Decrypt message
Now let's try to read one of the encrypted messages our peer sent us and see whether they can be decrypted with our private key and they are correctly signed by him.

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide/chat-1.png" width="320"/>
</div>

By clicking on the "eye" icon, we can see the raw Armored ASCII PGP message. We can click on the copy button to take it to GnuPG.

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide/chat-2.png" width="320"/>
</div>

All that is left is decrypt the PGP message of our peer using our private key. It is very likely that GnuPG will ask us again for our *token* to decrypt our private key.

```
echo "<paste_peer_message>" | gpg --decrypt
```

#### Encrypted message verification

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide/gpg-5.png" width="650"/>
</div>

Voilà! Here it is. We can be guaranteed that:
1. The **encrypted message reads** "It's soo cool RoboSats has such a transparent way to verify your encrypted communication!" (Marked in red)
2. The message can only be decrypted by 2 private keys: our own key and our peer's key. **No one else can read it!** (marked in blue)
3. The message **was signed by our peer**, it must be him. No one is infiltrated in this chat pretending to be your peer. (marked in green)

Since messages are signed by the robots keeping the log our robot token is very useful in case of a dispute. If your peer tries to cheat on you and then lies to the staff that is in charge of solving the dispute, you can prove it! It is useful to export the full chat log as Json (click export button) or, at least conserve your robot token. With those you can provide very excellent evidence that he said something different in the private chat with you.

The frontend application of RoboSats that runs on your browser does the job of encrypting, decrypting an verifying every message. But in this tutorial we have independently verified it works as intended: we have verified that **only the person with access to the robot token can read (decrypt) and sign messages** during a RoboSats trade.

**ProTip:** In order to independently verify that your token is absolutely secret and never sent to a third party you will need to run a HTTP request packet sniffer. You can also check by yourself the [frontend source code](https://github.com/RoboSats/robosats/tree/main/frontend/src).
{: .notice--secondary}

## Legacy: Why encryption is needed?

RoboSats initially did not have a built-in PGP encryption set up. Therefore users had to do it manually to ensure their communications were private. What follows is an old document for you to learn how to encrypt your communication by yourself using OpenKeychain in Android. However, the same tool can be used as well to verify the built-in encryption pipeline. Who knows? Maybe you want to double encrypt your messages. Then this is your guide.

Since RoboSats works over the TOR network all communication is end-to-end encrypted. This helps prevents data in transit from being read or tampered by man-in-the-middle attacks. Also, the TOR protocol ensures that the user is connected to the domain name in the browser address bar, in this case the official RoboSats tor address(robosatsy56bwqn56qyadmcxkx767hnabg4mihxlmgyt6if5gnuxvzad.onion). However, in RoboSats v0.1.0 the data was transferred as plain text through the front-end and the back-end of the application. This behavior allowed the possibility that sensitive data exchanged regarding fiat payment information could be captured by a malicious sniffer on either party's computer or even on the RoboSats server at application abstraction layer. This would represent an attack to the privacy of the owner of the data. Even if RoboSats chat was completely encrypted at every step, you should still not trust that the sensitive data is encrypted (see the verification guide above). The best practice to avoid this problem was to use asymmetric encryption during the exchange of sensitive data, this guide shows a method that guarantees sensible data confidentiality using the PGP standard.

### PGP Apps

#### Android
OpenKeychain is an open source Android app that allows you to create and manage cryptographic key pairs and sign or/and encrypt/decrypt text and files. OpenKeychain is based on the well established OpenPGP standard making encryption compatible across devices and systems.  OpenKeychain app can be found at F-droid.org [[Link]](https://f-droid.org/packages/org.sufficientlysecure.keychain/) or at Google play store [[Link]](https://play.google.com/store/apps/details?id=org.sufficientlysecure.keychain).

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide/OpenKeychain-logo.png" width="150"/>
</div>

#### iOS
PGPro is an open source iOS app that allows you to create and manage cryptographic key pairs and sign or/and encrypt/decrypt text and files. PGPro is based on ObjectivePGP which is compatible with OpenPGP. It can be found on their website [[Link]](https://pgpro.app/) or the Apple App Store [[Link]](https://apps.apple.com/us/app/pgpro/id1481696997).

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide/PGPro-logo.png" width="150"/>
</div>

#### Other
For a list of compatible software for Windows, Mac OS, and other operating systems check [openpgp.org/software/](https://openpgp.org/software/). Since the concept is the same, this method can be replicated using any another application.


### Encryption schema.

In most cases, the sensitive information we would want to protect is the seller's fiat payment information, i.e. phone number, PayPal account, etc. So, the image below shows the encryption scheme that ensures that the seller payment information can only be read by the buyer.

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide/encrypted-communication-schema.png" width="900"/>
</div>

The data exchange process has been divided into 3 easy steps:

- Creation of key pairs by the buyer.

- Sharing the buyer's public key with the seller.

- Encrypted data exchange.

### Step by step guide.

#### Creation of key pairs by the buyer.

The first step to ensure data confidentiality is to create a public/private key pair. Below are shown the steps to create a key pair in the OpenKeychain app, this procedure only needs to be done by the buyer. This step only needs to be done once, there is no need to repeat it when buyers want to buy again, since in a future trade he will already have the key pair.

<br/>

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide/PGP-keys-creation-steps.png" width="900"/>
</div>

<br/>

#### Sharing the buyer's public key with the seller.

Now the buyer is holding two keys, the private key must only be known by his owner (in this specific case the buyer, who has also created it) and the public key can be known by anyone else (the seller). The seller needs the buyer's public key in order to encrypt the sensitive data, so the buyer must send the plain text that represents the public key. The steps below show how to share the plain text that represents the public key, as well as how the seller adds it to his OpenKeychain app to use it later.

<br/>

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide/pub-key-sharing-steps.png" width="900"/>
</div>

<br/>

The key must be copied including the header `(-----BEGIN PGP PUBLIC KEY BLOCK-----)` and footer `(-----END PGP PUBLIC KEY BLOCK-----)` for the correct operation of the application.

#### Encrypted data exchange.

Once the seller has the buyer's public key, the encryption schema show above can be applied. The following steps describe the encrypted data exchange process.

<br/>

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide/encrypted-data-sharing-steps.png" width="900"/>
</div>

<br/>

The encrypted data must be copied including the header `(-----BEGIN PGP MESSAGE-----)` and footer `(-----END PGP MESSAGE-----)` for the correct operation of the application. If the buyer obtains interpretable data, it means that the exchange has been successful and the confidentiality of the data is assured since the only key that can decrypt it is the private key of the buyer.

If you would like to read more easily crafted tutorial on how to use OpenKeychain for general purposes check [As Easy as P,G,P](https://diverter.hostyourown.tools/as-easy-as-pgp/)


{% include improve %}
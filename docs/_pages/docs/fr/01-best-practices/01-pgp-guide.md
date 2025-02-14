---
layout: single
title: Chiffrement PGP simplifié
permalink: /docs/fr/pgp-encryption/
toc: true
toc_sticky: true
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/fingerprint.svg"/>Chiffrement PGP'
  nav: docs
src: "_pages/docs/fr/01-best-practices/01-pgp-guide.md"
---

Toutes les communications de RoboSats sont chiffrées par PGP. L'application client est entièrement transparente et offre un moyen facile de copier et d'exporter les clés PGP.

## Vérifier la confidentialité de vos communications

Vous pouvez garantir la confidentialité de vos données sensibles en vérifiant l'implémentation par RoboSats de la norme PGP. Toute implémentation PGP tierce qui vous permet d'importer des clés et des messages peut être utilisée pour vérifier le chat de RoboSats. Dans ce petit guide, nous utiliserons l'outil de ligne de commande [GnuPG](https://gnupg.org/).

### Importer les clés dans GnuPG
#### Importez votre clé privée chiffrée
Chaque avatar de robot possède une clé publique et une clé privée chiffrée. Nous pouvons importer la clé privée dans GPG, en la copiant d'abord depuis RoboSats :

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide/copy-private-key.png" width="550"/>
</div>

Nous l'importons ensuite dans GnuPG à l'aide de la commande suivante :

```
echo "<coller_votre_cle_privee_chiffree>" | gpg --import
```

Cela va ressembler à :

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide/gpg-1.png" width="450"/>
</div>

Vous serez invité à saisir la phrase d'authentification de la clé privée. Nous utilisons notre **jeton** robot *supersecret* pour la déchiffrer, vous êtes le seul à connaître le jeton robot.

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide/gpg-2.png" width="350"/>
</div>

Si votre jeton est le bon, vous devriez avoir importé la clé privée pour la communication.
<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide/gpg-3.png" width="650"/>
</div>
Nous pouvons voir comment l'application frontend a nommé cette clé `"RoboSats ID<hash>"`. Il s'agit de l'identifiant du robot, le deuxième hachage SHA256 de notre jeton secret, et il a été utilisé à l'origine pour générer de manière déterministe le surnom et l'image de l'avatar du robot ([en savoir plus](/docs/fr/private/#robot-avatar-generation-pipeline)).

#### Import your peer's public key
Il suffit de répéter les étapes ci-dessus pour importer la clé publique de notre correspondant.

```
echo "<paste_peer_public_key>" | gpg --import
```

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide/gpg-4.png" width="650"/>
</div>

Tout est prêt. Nous avons importé notre clé privée chiffrée et la clé publique de notre correspondant dans GPG. Jusqu'à présent, tout semble bien aller.

### Déchiffrage et vérification des messages avec GnuPG
#### Déchiffrer le message
Essayons maintenant de lire l'un des messages chiffré que notre correspondant nous a envoyés et voir s'il peut être déchiffré avec notre clé privée et s'il l'a correctement signé.

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide/chat-1.png" width="320"/>
</div>

En cliquant sur l'icône "œil", nous pouvons voir le message PGP ASCII brut d'Armored. Nous pouvons cliquer sur le bouton de copie pour le transférer à GnuPG.

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide/chat-2.png" width="320"/>
</div>

Il ne reste plus qu'à déchiffrer le message PGP de notre correspondant à l'aide de notre clé privée. Il est très probable que GnuPG nous demande à nouveau notre *token* pour déchiffrer notre clé privée.

```
echo "<paste_peer_message>" | gpg --decrypt
```

#### Vérification des messages chiffrés

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide/gpg-5.png" width="650"/>
</div>

Voilà ! Nous y voilà. Nous pouvons être assurés que :
1. Le **message chiffré dit** "C'est tellement cool que RoboSats ait un moyen si transparent de vérifier votre communication chiffrée !" (marqué en rouge)
2. Le message ne peut être déchiffré que par 2 clés privées : notre propre clé et celle de notre pair. **Personne d'autre ne peut le lire (marqué en bleu).
3. Le message **a été signé par notre pair**, il doit s'agir de lui. Personne ne s'est infiltré dans ce chat en prétendant être notre pair. (marqué en vert)

Comme les messages sont signés par les robots qui tiennent le journal, notre jeton robot est très utile en cas de litige. Si votre pair essaie de vous tromper et ment ensuite au personnel chargé de résoudre le litige, vous pouvez le prouver ! Il est utile d'exporter le journal de discussion complet au format Json (cliquez sur le bouton d'exportation) ou, au moins, de conserver votre jeton de robot. Avec cela, vous pouvez fournir d'excellentes preuves qu'il a dit quelque chose de différent dans le chat privé avec vous.

L'application frontale de RoboSats qui tourne sur votre navigateur se charge de chiffrer, déchiffrer et vérifier chaque message. Mais dans ce tutoriel, nous avons vérifié de manière indépendante qu'elle fonctionne comme prévu : nous avons vérifié que **seule la personne ayant accès au jeton du robot peut lire (décrypter) et signer les messages** lors d'un échange avec RoboSats.

**ProTip:** Afin de vérifier indépendamment que votre jeton est absolument secret et qu'il n'est jamais envoyé à un tiers, vous devrez utiliser un renifleur de paquets de requêtes HTTP. Vous pouvez également vérifier par vous-même le [code source du frontend] (https://github.com/RoboSats/robosats/tree/main/frontend/src).
{: .notice--secondary}

## L'héritage : Pourquoi le chiffrement est-il nécessaire ?

Au départ, RoboSats ne disposaient pas d'un système de chiffrement PGP intégré. Les utilisateurs devaient donc le faire manuellement pour s'assurer que leurs communications étaient privées. Ce qui suit est un ancien document vous permettant d'apprendre à chiffrer vos communications par vous-même en utilisant OpenKeychain dans Android. Toutefois, le même outil peut également être utilisé pour vérifier le processus de cryptage intégré. Qui sait ? Peut-être souhaitez-vous chiffrer doublement vos messages. Dans ce cas, ce guide est fait pour vous.

Comme RoboSats fonctionne sur le réseau TOR, toutes les communications sont chiffrées de bout en bout. Cela permet d'éviter que les données en transit soient lues ou modifiées par des attaques de type "man-in-the-middle". De plus, le protocole TOR garantit que l'utilisateur est connecté au nom de domaine figurant dans la barre d'adresse du navigateur, dans ce cas l'adresse tor officielle de RoboSats (robosatsy56bwqn56qyadmcxkx767hnabg4mihxlmgyt6if5gnuxvzad.onion). Cependant, dans RoboSats v0.1.0, les données étaient transférées en texte clair à travers le front-end et le back-end de l'application. Ce comportement permettait la possibilité que les données sensibles échangées concernant les informations de paiement en monnaie fiduciaire soient capturées par un pirate malveillant sur l'ordinateur de l'une ou l'autre des parties ou même sur le serveur RoboSats au niveau de la couche d'abstraction de l'application. Cela représenterait une atteinte à la vie privée du propriétaire des données. Même si le chat de RoboSats était complètement chiffré à chaque étape, vous ne devriez pas croire que les données sensibles sont chiffrées (voir le guide de vérification ci-dessus).
La meilleure pratique pour éviter ce problème est d'utiliser un chiffrement asymétrique lors de l'échange de données sensibles. Ce guide présente une méthode qui garantit la confidentialité des données sensibles à l'aide de la norme PGP.

### Applications PGP

#### Android
OpenKeychain est une application Android open source qui vous permet de créer et de gérer des paires de clés cryptographiques et de signer ou/et de chiffrer/déchiffrer du texte et des fichiers. OpenKeychain est basé sur le standard bien établi OpenPGP, ce qui rend le chiffrement compatible avec tous les appareils et systèmes.  L'application OpenKeychain est disponible à l'adresse suivante F-droid.org [[Link]](https://f-droid.org/packages/org.sufficientlysecure.keychain/) ou sur le Google play store [[Link]](https://play.google.com/store/apps/details?id=org.sufficientlysecure.keychain).

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide/OpenKeychain-logo.png" width="150"/>
</div>

#### iOS
PGPro est une application iOS open source qui vous permet de créer et de gérer des paires de clés cryptographiques et de signer ou/et de chiffrer/déchiffrer du texte et des fichiers. PGPro est basé sur ObjectivePGP qui est compatible avec OpenPGP. Il peut être trouvé sur leur site web [[Link]](https://pgpro.app/) or the Apple App Store [[Link]](https://apps.apple.com/us/app/pgpro/id1481696997).

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide/PGPro-logo.png" width="150"/>
</div>

#### Autre
Pour obtenir une liste de logiciels compatibles avec Windows, Mac OS et d'autres systèmes d'exploitation, consultez [openpgp.org/software/](https://openpgp.org/software/). Le concept étant le même, cette méthode peut être reproduite à l'aide de n'importe quelle autre application.

### Schéma de chiffrement.

Dans la plupart des cas, les informations sensibles que nous souhaitons protéger sont les informations de paiement en monnaie fiduciaire du vendeur, c'est-à-dire son numéro de téléphone, son compte PayPal, etc. L'image ci-dessous montre donc le schéma de chiffrement qui garantit que les informations de paiement du vendeur ne peuvent être lues que par l'acheteur.

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide/encrypted-communication-schema.png" width="900"/>
</div>

Le processus d'échange de données a été divisé en trois étapes simples :

- Création de paires de clés par l'acheteur.

- Partage de la clé publique de l'acheteur avec le vendeur.

- Échange de données chiffrées.

### Guide pas-à-pas.

#### Création de paires de clés par l'acheteur.

La première étape pour assurer la confidentialité des données est de créer une paire de clés publiques/privées. Ci-dessous sont montrées les étapes pour créer une paire de clés dans l'application OpenKeychain, cette procédure ne doit être faite que par l'acheteur. Cette étape ne doit être effectuée qu'une seule fois, il n'est pas nécessaire de la répéter lorsque les acheteurs veulent acheter à nouveau, puisque dans un futur échange, il aura déjà la paire de clés.

<br/>

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide/PGP-keys-creation-steps.png" width="900"/>
</div>

<br/>

#### Partage de la clé publique de l'acheteur avec le vendeur.

L'acheteur détient maintenant deux clés : la clé privée ne doit être connue que de son propriétaire (dans ce cas précis, l'acheteur, qui l'a également créée) et la clé publique peut être connue de n'importe qui d'autre (le vendeur). Le vendeur a besoin de la clé publique de l'acheteur pour chiffrer les données sensibles ; l'acheteur doit donc envoyer le texte en clair qui représente la clé publique. Les étapes ci-dessous montrent comment partager le texte brut qui représente la clé publique, ainsi que la façon dont le vendeur l'ajoute à son application OpenKeychain pour l'utiliser plus tard.

<br/>

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide/pub-key-sharing-steps.png" width="900"/>
</div>

<br/>

La clé doit être copiée en incluant l'en-tête `(-----BEGIN PGP PUBLIC KEY BLOCK-----)` et le pied de page `(-----END PGP PUBLIC KEY BLOCK-----)` pour le bon fonctionnement de l'application.

#### Échange de données chiffrées.

Une fois que le vendeur dispose de la clé publique de l'acheteur, le schéma de chiffrement présenté ci-dessus peut être appliqué. Les étapes suivantes décrivent le processus d'échange de données chiffrées.

<br/>

<div align="center">
    <img src="/assets/images/sensitive-data-PGP-guide/encrypted-data-sharing-steps.png" width="900"/>
</div>

<br/>

Les données chiffrées doivent être copiées, y compris l'en-tête `(-----BEGIN PGP MESSAGE-----)` et le pied de page `(-----END PGP MESSAGE-----)` pour le bon fonctionnement de l'application. Si l'acheteur obtient des données interprétables, cela signifie que l'échange a réussi et que la confidentialité des données est assurée puisque la seule clé qui peut les déchiffrer est la clé privée de l'acheteur.

Si vous souhaitez lire un tutoriel plus facile sur la façon d'utiliser OpenKeychain à des fins générales, consultez [As Easy as P,G,P](https://diverter.hostyourown.tools/as-easy-as-pgp/).


{% include improve_fr %}

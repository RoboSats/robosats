---
layout: single
title: Wallets Compatibility with RoboSats
permalink: /docs/fr/wallets/
toc: true
toc_sticky: true
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/wallet.svg"/>Wallets'
  nav: docs
src: "_pages/docs/fr/03-understand/07-wallets.md"

# Icons
good: "<i style='color:#1976d2' class='fa-solid fa-square-check fa-2xl'></i>"
soso: "<i style='color:#9c27b0' class='fa fa-triangle-exclamation fa-2xl'></i>"
bad: "<i style='color:#ef5350' class='fa-solid fa-xmark fa-3x'></i>"
phone: "<i class='fa-solid fa-mobile-screen fa-xl'></i>"
laptop: "<i class='fa-solid fa-laptop fa-xl'></i>"
cli: "<i class='fa-solid fa-terminal fa-xl'></i>"
laptop_phone: "<i class='fa-solid fa-laptop-mobile fa-xl'></i>"
remote: "<i class='fa-solid fa-house fa-xl'></i>"
thumbsup: "<i style='color:#1976d2' class='fa-solid fa-thumbs-up fa-2xl'></i>"
thumbsdown: "<i style='color:#9c27b0' class='fa-solid fa-thumbs-down fa-2xl'></i>"
unclear: "<i style='color:#ff9800' class='fa-solid fa-question fa-2xl'></i>"
bitcoin: "<i class='fa-solid fa-bitcoin-sign'></i>"
---
Il s'agit d'une compilation non exhaustive basée sur l'expérience des utilisateurs. Nous n'avons pas testé tous les portefeuilles, si vous testez un portefeuille qui n'est pas encore couvert, veuillez le [signaler ici](https://github.com/RoboSats/robosats/issues/44).

| Wallet | Version | Device | UX<sup>1</sup> | Bonds<sup>2</sup> | Payout<sup>3</sup> | Comp<sup>4</sup> | Total<sup>5</sup> |
|:---|:---|:--:|:--:|:--:|:--:|:--:|:--:|
|[Alby](#alby-browser-extension)|[v1.14.2](https://github.com/getAlby/lightning-browser-extension)|{{page.laptop}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.good}} |{{page.thumbsup}}|
|[Blink](#blink-mobile-former-bitcoin-beach-wallet)|[2.2.73](https://www.blink.sv/)|{{page.phone}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.good}} |{{page.thumbsup}}|
|[Blixt](#blixt-androidios-lnd-light-backend-on-device)|[v0.4.1](https://github.com/hsjoberg/blixt-wallet)|{{page.phone}}|{{page.soso}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.thumbsup}}|
|[Blue](#bluewallet-mobile)|[1.4.4](https://bluewallet.io/)|{{page.phone}}|{{page.good}}|{{page.unclear}}|{{page.unclear}}|{{page.good}}|{{page.unclear}}|
|[Cash App](#cash-app-mobile)|[4.7](https://cash.app/)|{{page.phone}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.good}} |{{page.thumbsup}}|
|[Core Lightning](#core-lightning--cln-cli-interface)|[v0.11.1](https://github.com/ElementsProject/lightning)|{{page.cli}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.thumbsup}}|
|[Electrum](#electrum-desktop)|[4.1.4](https://github.com/spesmilo/electrum)|{{page.laptop}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.thumbsup}}||
|[LND](#lnd-cli-interface)|[v0.14.2](https://github.com/LightningNetwork/lnd)|{{page.cli}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.thumbsup}}|
|[lntxbot](https://github.com/RoboSats/robosats/issues/44#issuecomment-1054607956)|[NA](https://t.me/lntxbot)|{{page.laptop}}{{page.phone}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.good}} | [{{page.thumbsup}}](https://github.com/RoboSats/robosats/issues/44#issuecomment-1054607956)|
|[Mash](https://app.mash.com/wallet)|[Beta](https://mash.com/consumer-experience/)|{{page.laptop}}{{page.phone}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.good}} | {{page.thumbsup}}|
|[Muun](#muun-mobile)|[47.3](https://muun.com/)|{{page.phone}}|{{page.good}}|{{page.good}}|{{page.bad}}|{{page.bad}}|{{page.thumbsdown}}|
|[Phoenix](#phoenix-mobile)|[35-1.4.20](https://phoenix.acinq.co/)|{{page.phone}}|{{page.good}}|{{page.soso}}|{{page.good}}|{{page.good}}|{{page.unclear}}|
|[SBW](https://github.com/RoboSats/robosats/issues/44#issue-1135544303)|[2.4.27](https://github.com/btcontract/wallet/)|{{page.phone}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.thumbsup}}|
|[WoS](https://github.com/RoboSats/robosats/issues/44#issue-1135544303)|[1.15.0](https://www.walletofsatoshi.com/)|{{page.phone}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.thumbsup}}|
|[Zeus](#zeus-mobile-lnd-cln-eclair-remote-backend)|[v0.6.0-rc3](https://github.com/ZeusLN/zeus)|{{page.phone}}{{page.remote}}|{{page.soso}}|{{page.good}}|{{page.good}}|{{page.good}}|{{page.thumbsup}}|

1. **UX:** Le portefeuille indique-t-il clairement qu'il s'agit d'un paiement "en cours" (hodl invoice) ?
2. **Obligations:** Le portefeuille peut-il verrouiller les factures avec un long délai d'expiration nécessaire pour les dépôts ?
3. **Payout:** Le portefeuille peut-il recevoir des paiements de RoboSats après que l'utilisateur ait acheté des Sats ?
4. **Compatible:** Le portefeuille est-il compatible de bout en bout avec RoboSats ?
5. **Total:** Le portefeuille est-il compatible et suffisamment stable pour être utilisé régulièrement sans problème ?

### Alby (browser extension)
Alby est une extension de navigateur compatible avec la norme WebLN. Etant donné que RoboSats supporte WebLN, l'expérience avec Alby est probablement la meilleure de sa catégorie : vous n'aurez pas à scanner les codes QR ou à copier/coller les factures générées. Il suffit de cliquer sur la fenêtre contextuelle d'Alby pour confirmer les actions. Vous pouvez connecter l'extension Alby à la plupart des nœuds et portefeuilles populaires ou simplement laisser Alby héberger un portefeuille pour vous.

Instructions pour installer Alby dans le navigateur Tor :
1. Installez l'extension Alby depuis le [Firefox add-ons store](https://addons.mozilla.org/en-US/firefox/addon/alby/)
2. Cliquez sur l'extension Alby et suivez les instructions pour configurer votre portefeuille.

### Blink (Mobile, précédemment Bitcoin Beach Wallet)
Fonctionne bien avec RoboSats. Les factures Hodl (dépôt) apparaissent comme "en attente" dans l'historique des transactions. Les paiements au portefeuille Blink fonctionnent comme prévu. Portefeuille géré par un tiers par Galoy qui provient du projet Bitcoin Beach au Salvador (anciennement connu sous le nom de "Bitcoin Beach Wallet").

### Blixt (Android/iOS, LND light backend on device)
La plupart des tests de développement pour RoboSats ont été réalisés à l'aide de Blixt. Il s'agit de l'un des portefeuilles Lightning les plus complets. Cependant, il conduit à des malentendus lorsque les factures en attente sont verrouillées, car il affiche un spinner avec le paiement en transit. L'utilisateur doit vérifier sur le site web pour obtenir une confirmation. Blixt permet d'avoir plusieurs HTLC en attente ; c'est nécessaire en tant que vendeur puisque vous devez verrouiller une obligation preneur/créateur et ensuite un dépôt de garantie (2 HTLC simultanées en attente). Les factures payées/chargées qui sont encore en attente peuvent éventuellement être affichées, en particulier si l'utilisateur ferme Blixt de force et le rouvre. Occasionnellement, il peut afficher comme facturées des dépôts de garantie qui ont en fait été retournées.

### Bluewallet (Mobile)
Cela fonctionne bien. Bluewallet a mis fin à son service de garde. Auparavant, le service de garde causait des problèmes lorsque les dépôt de garantie que RoboSats retourne sont facturés aux utilisateurs et lorsque les obligations coupées sont facturées deux fois par Bluewallet ! Il s'agissait d'un bug connu depuis longtemps chez Bluewallet, qui a donc fermé son service de garde de LN (ce qui a permis à RoboSats d'améliorer l'expérience des utilisateurs).

### Cash App (Mobile)
Fonctionne bien avec RoboSats. Les factures Hodl (dépôt de garantie) apparaissent comme "en attente" dans l'historique des transactions. Les paiements vers le portefeuille Cash App fonctionnent comme prévu. Portefeuille de garde de Block, Inc, anciennement connu sous le nom de Square, Inc, qui est dirigé par Jack Dorsey.

### Core Lightning / CLN (Interface CLI)
Fonctionne comme prévu. La commande `lightning-cli pay <invoice>` ne se termine pas tant que le paiement est en attente, mais on peut utiliser `lightning-cli paystatus <invoice>` pour surveiller l'état.

### Electrum (Desktop)
L'expérience d'Electrum est limitée. Il ne semble pas supporter plus d'un HTLC en attente (même s'il y a plusieurs canaux). Il n'est pas recommandé d'utiliser ce portefeuille avec RoboSats. Cependant, il fonctionne bien si vous êtes un acheteur, car une seule facture de retenue pour la caution de fidélité est nécessaire. Le paiement est affiché comme étant en attente avec une roulette pour la durée de la période de blocage.

### LND (Interface CLI)
Brut ; il montre exactement ce qui se passe et ce qu'il sait "ON_FLY". Il n'est pas facile à utiliser et n'est donc pas recommandé aux débutants pour interagir avec RoboSats. Cependant, tout fonctionne très bien. Si vous utilisez LNCLI régulièrement, vous n'aurez aucun problème à l'utiliser avec RoboSats.

### Mash Wallet App (Mobile PWA & Desktop Web-Wallet)
Dans l'ensemble, le portefeuille [Mash](https://mash.com/consumer-experience/) fonctionne de bout en bout avec Robosats pour la vente et l'achat via Lightning. La plupart des détails pertinents de la facture dans le portefeuille Mash sont affichés et clairs pour les utilisateurs tout au long du processus. Lorsque les transactions sont terminées, elles s'ouvrent dans l'application mobile du côté de l'expéditeur et du destinataire pour souligner que les transactions sont terminées. Le seul problème d'interface utilisateur est que la liste des factures en attente ne montre pas explicitement les factures HOLD et qu'il y a un écran "tournant" lors du premier paiement d'une facture HOLD. L'équipe a ouvert un bug pour résoudre ce problème prochainement (cette note date du 21 août 2023).

### Muun (Mobile)
Comme Blixt ou LND, Muun fonctionne bien avec les factures en attente. Vous pouvez être vendeur sur RoboSats en utilisant Muun et l'expérience utilisateur sera excellente. Cependant, pour être acheteur lorsque vous utilisez Muun, vous devez soumettre une adresse sur la chaîne pour le paiement, car une facture Lightning ne fonctionnera pas. Muun est une _attaque de siphonnage de frais_ pour tout expéditeur vers le portefeuille Muun. Il y a un saut obligatoire à travers un canal privé avec des frais de +1500ppm. RoboSats n'acheminera pas les paiements d'un acheteur en cas de perte nette. Étant donné que les frais d'échange de RoboSats sont de {{site.robosats.total_fee}}% et qu'il doit couvrir les frais d'acheminement, **RoboSats ne trouvera jamais d'itinéraire convenable pour un utilisateur du portefeuille Muun**. Pour l'instant, RoboSats analyse votre facture à la recherche d'indices de routage qui peuvent potentiellement encoder une _attaque de siphonnage de frais_. Si cette astuce est trouvée, la facture sera rejetée : soumettez plutôt une adresse sur la chaîne pour un échange à la volée. Reportez-vous à [Comprendre > Paiements sur la chaîne](/docs/fr/on-chain-payouts/) pour plus d'informations sur les échanges à la volée. Il est important de noter que Muun rencontre des problèmes pendant les périodes où les frais de la chaîne sont élevés. Quoi qu'il en soit, la solution pour recevoir Muun est la suivante : soumettre une adresse sur la chaîne ou choisir un budget de routage plus élevé après avoir activé le commutateur "Options avancées".

### OBW (Mobile)
L'un des plus simples et l'un des meilleurs. La facture hodl s'affiche comme "on fly", elle n'est pas dépositaire et vous pouvez créer vos propres canaux. Achetez-en un auprès d'un fournisseur de liquidités ou utilisez les canaux hébergés. Il est maintenu par le grand Fiatjaf et c'est un fork de l'abandonné SBW.

### Phoenix (Mobile)
Phoenix fonctionne très bien en tant que preneur d'ordres. Phoenix fonctionne également très bien en tant que preneur d'ordres tant que les paramètres de l'ordre `durée publique` + `durée de dépôt` sont inférieurs à 10 heures. Dans le cas contraire, vous risquez d'avoir des problèmes pour bloquer l'obligation du donneur d'ordre. Si la durée totale des dépôts/factures de séquestre dépasse 450 blocs, Phoenix ne permettra pas aux utilisateurs de verrouiller l'obligation (`Cannot add htlc (...) reason=expiry too big`).

### Zeus (Mobile, LND, CLN, Eclair backend distant)
Il s'agit d'une interface pour LND, CLN et Eclair. Il fonctionne comme prévu. Il est extrêmement trompeur avec un écran rouge complet "TIME OUT" quelques secondes après l'envoi du HTLC. Pourtant, si l'utilisateur vérifie sur le site web, la facture est correctement verrouillée.

## <i class="fa-solid fa-code-pull-request"></i> Aidez à maintenir cette page à jour
Il existe de nombreux portefeuilles et tous s'améliorent à la vitesse de l'éclair. Vous pouvez contribuer au projet RoboSats Open Source en testant des portefeuilles, en éditant [le contenu de cette page](https://github.com/RoboSats/robosats/tree/main/docs/fr/{{page.src}}) et en ouvrant une [Pull Request](https://github.com/RoboSats/robosats/pulls).

## Informations complémentaires

La réception de Sats via Lightning n'est pas totalement privée. Reportez-vous à [Best Practices > Proxy Wallets](/docs/fr/proxy-wallets/) pour plus d'informations sur la réception de Sats en privé.

Si vous rencontrez des problèmes pour recevoir des fonds sur votre portefeuille (en raison de problèmes de gestion des canaux, de problèmes de routage, de problèmes côté portefeuille, etc.), une solution rapide pour recevoir un paiement serait d'avoir un deuxième portefeuille à portée de main, bien connecté et avec une capacité de canal suffisante. Vous pourriez recevoir des Sats sur votre deuxième portefeuille et, une fois les problèmes résolus, les envoyer sur votre portefeuille principal.

N'hésitez pas à contacter le groupe de discussion public RoboSats [SimpleX](/contribute/code/#communication-channels) pour obtenir des conseils ou de l'aide sur l'utilisation des portefeuilles !

{% include improve %}

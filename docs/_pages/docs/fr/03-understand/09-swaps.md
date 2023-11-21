---
layout: single
title: P2P Swaps
permalink: /docs/fr/swaps/
toc: true
toc_sticky: true
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/arrow-right-arrow-left.svg"/>Swaps'
  nav: docs
src: "_pages/docs/fr/03-understand/09-swaps.md"
---

Outre les différentes méthodes de paiement en monnaie fiat disponibles, il existe également ce que l'on appelle les *destinations d'échange*. Il s'agit de méthodes de paiement, mais pour les BTC, sur un réseau autre que le Lightning Network.

C'est utile si vous voulez échanger des Sats Lightning contre des Sats on-chain (ou sur tout autre réseau comme Liquid BTC si vous préférez). Ce processus d'échange de Sats sur le Lightning Network contre des Sats sur la chaîne est généralement appelé "swap".

Le tableau ci-dessous simplifie la compréhension du swap en termes d'"acheteur" et de "vendeur" :

| Side      | Sends         | Receives     | Swap type |
|-----------|---------------|--------------|-----------|
| Vendeur   | ⚡BTC         | 🔗 BTC       | Swap out  |
| Acheteur  | 🔗 BTC        | ⚡BTC        | Swap in   |

### Comment faire un échange P2P Swap

Rappelez-vous que dans RoboSats, vous achetez ou vendez toujours des Sats du Lightning Network. Si vous souhaitez recevoir des Sats sur le Lightning Network en échange de vos Sats on-chain, vous devez créer un ordre **ACHETER**. Au contraire, si vous souhaitez recevoir des Sats on-chain en échange de vos Sats Lightning Network, vous devez créer un ordre de *VENTE*.

Dans l'écran de création d'un ordre, sélectionnez "BTC" dans le menu déroulant des devises :

<div align="center">
    <img src="/assets/images/understand/btc-swap-in-dropdown.png"/>
</div>

Sélectionnez votre destination d'échange dans la liste déroulante :

<div align="center">
    <img src="/assets/images/understand/swap-destination-selection.png"/>
</div>

Vous définissez ensuite le montant ou la fourchette que vous souhaitez échanger. Rappelez-vous que si vous êtes un vendeur, vous recevrez des BTC de la chaîne et que si vous êtes un acheteur, vous enverrez des BTC de la chaîne :

<div align="center">
    <img src="/assets/images/understand/amount-swap.png"/>
</div>

Il vous suffit alors de créer la commande et d'attendre qu'un preneur prenne votre commande. Dans le salon de discussion, vous procédez comme d'habitude, mais cette fois, le mode de paiement est simplement une adresse bitcoin sur la chaîne.

### Order amount and mining fees

Le montant à envoyer sur la chaîne doit correspondre à la valeur exacte mentionnée dans le montant de la commande. L'expéditeur de crédits on-chain doit couvrir les frais d'exploitation minière (frais de transaction on-chain).

### Quelle est la prime à fixer ?

Dans le cas d'un swap, il est préférable de maintenir la prime à 0 % ; mais si vous souhaitez rendre l'offre un peu plus attrayante pour votre contrepartie, vous pouvez suivre les recommandations ci-dessous :
1. Si vous êtes le **vendeur** - vous **recevrez** des BTC on-chain ; fixer la prime légèrement en dessous de 0% (par exemple, -0,1%, -0,5%) rendra votre offre plus attrayante. Le preneur paie déjà {{site.robosats.taker_fee}}% des frais sur la transaction et doit payer des frais de minage pour l'envoi des BTC on-chain.
2. Si vous êtes l'**acheteur** - vous allez **envoyer** des BTC on-chain ; fixer la prime légèrement au-dessus de 0 % (par exemple, 0,1 %, 0,5 %) rendra votre offre plus attrayante.

Il ne s'agit que de recommandations générales sur la prime à fixer pour démarrer avec les swaps, mais en fin de compte, c'est le marché qui fixe le prix... Alors, expérimentez et voyez ce qui fonctionne pour vous !

{% include improve %}

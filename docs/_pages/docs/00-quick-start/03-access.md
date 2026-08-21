---
layout: single
title: "Accessing RoboSats"
permalink: /docs/access/
toc: true
toc_sticky: true
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/arrow-up-right-from-square.svg"/>Access'
  nav: docs
src: "_pages/docs/00-quick-start/03-access.md"
---

## <img style='width:32px;height:32px' src='/assets/vector/tor.svg'/> RoboSats federated client with TOR

A safe and very private way to access RoboSats federated client is through the Onion address. You need [TOR browser](/docs/tor/) and access via the link:

>
[<b>RoboSats</b>y56bwqn56qyadmcxkx767hnabg4mihxlmgyt6if5gnuxvzad.onion](http://robosatsy56bwqn56qyadmcxkx767hnabg4mihxlmgyt6if5gnuxvzad.onion/)


**Private:** Your connection is encrypted end-to-end and relaid by several layers of nodes, thus making tracking harder.
{: .notice--primary}

## <img style='width:32px;height:32px' src='/assets/vector/tor.svg'/> Privately with TOR-enabled Android App

RoboSats can be safely and privately accessed via the Android app. The app is available via the RoboSats GitHub release page:

> [Download the <b>latest release</b> of the universal RoboSats APK for Android](https://github.com/RoboSats/robosats/releases)

## <img style='width:36px;height:38px;-webkit-filter:grayscale(1);filter:grayscale(1);' src='/assets/vector/Itoopie.svg'/> Privately with I2P

I2P is another safe and private way to access RoboSats. You need [I2P browser](https://geti2p.com/en/download) and access via the link:

> [<b>robosats.i2p</b>?i2paddresshelper=r7r4sckft<br/>6ptmk4r2jajiuqbowqyxiwsle4iyg4fijtoordc6z7a.b32.i2p](http://robosats.i2p?i2paddresshelper=r7r4sckft6ptmk4r2jajiuqbowqyxiwsle4iyg4fijtoordc6z7a.b32.i2p)

## <i class="fa-solid fa-window-maximize"></i> Unsafely in Clearnet

There is an unsafe way to view the RoboSats order book without TOR that relies on third party tor2web services. With this URL, you can access RoboSats from any browser, but using this URL is **strongly ill-advised!**

> [unsafe.robosats.org](https://unsafe.robosats.org)

**Unsafe:** Your privacy can be compromised if you use the unsafe clearnet URL in a regular web browser.
{: .notice--secondary}

If you use the clearnet URL, you should assume you are being spied on. However, most sensitive features on RoboSats are disabled (e.g., the P2P chat) so users cannot give away sensitive personal data. Only use the clearnet URL to take a quick peek at the order book. Never use it for trading or logging into manage active orders.

## <i class="fa-solid fa-person-dots-from-line"></i> All-in-One URL

To keep it simple, the URL "robosats.org" has been created to serve as an easy-to-remember and all-in-one link for browsers. If you are using TOR or I2P browser, then you are directed to the Onion or I2P site, respectively. Otherwise, you are directed to the unsafe clearnet site.

> [<span style="font-size:larger;">robosats.org</span>](https://robosats.org)

## Others

### Testnet

You can practice and test all of the functionalities in RoboSats without risk of losing funds by using [testnet bitcoin](https://en.bitcoin.it/wiki/Testnet). All you need is a testnet Lightning wallet and to access to the platform and change to Testnet on the *Settings* tab


### Clearnet Mirrors

There are several tor2web services that serve as mirrors in case one of them is unavailable:

> [unsafe.robosats.org](https://unsafe.robosats.org/) <br/>
> [unsafe.testnet.robosats.org](http://unsafe.testnet.robosats.org/)

{% include improve %}

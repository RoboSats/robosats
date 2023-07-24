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

## <img style='width:32px;height:32px' src='/assets/vector/tor.svg'/> Privately with TOR

A safe and very private way to access RoboSats is through the Onion address. You need [TOR browser](/docs/tor/) and access via the link:

> [<b>robosats</b>6tkf3eva7x2voqso3a5wcorsnw34j<br/>veyxfqi2fu7oyheasid.onion](http://robosats6tkf3eva7x2voqso3a5wcorsnw34jveyxfqi2fu7oyheasid.onion/)

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

> [unsafe.robosats.com](https://unsafe.robosats.com)

**Unsafe:** Your privacy can be compromised if you use the unsafe clearnet URL in a regular web browser.
{: .notice--secondary}

If you use the clearnet URL, you should assume you are being spied on. However, most sensitive features on RoboSats are disabled (e.g., the P2P chat) so users cannot give away sensitive personal data. Only use the clearnet URL to take a quick peek at the order book. Never use it for trading or logging into manage active orders.

## <i class="fa-solid fa-person-dots-from-line"></i> All-in-One URL

To keep it simple, the URL "robosats.com" has been created to serve as an easy-to-remember and all-in-one link for browsers. If you are using TOR or I2P browser, then you are directed to the Onion or I2P site, respectively. Otherwise, you are directed to the unsafe clearnet site.

> [<span style="font-size:larger;">robosats.com</span>](https://robosats.com)

## Others

### Testnet

You can practice and test all of the functionalities in RoboSats without risk of losing funds by using [testnet bitcoin](https://en.bitcoin.it/wiki/Testnet). All you need is a testnet Lightning wallet and to access the testnet platform via the link:

> [<b>robotest</b>agw3dcxmd66r4rgksb4nmmr43fh7<br/>7bzn2ia2eucduyeafnyd.onion](http://robotestagw3dcxmd66r4rgksb4nmmr43fh77bzn2ia2eucduyeafnyd.onion/)

Or, unsafely access the testnet clearnet bridge via the link:

> [unsafe.testnet.robosats.com](http://unsafe.testnet.robosats.com)

### Onion Mirrors

It is possible to access the **testnet** platform on the port 8001 of the mainnet Onion:

> [robosats6tkf3eva7x2voqso3a5wcorsnw34j<br/>veyxfqi2fu7oyheasid.onion:8001](http://robosats6tkf3eva7x2voqso3a5wcorsnw34jveyxfqi2fu7oyheasid.onion:8001)

It is also possible to access the **mainnet** platform on the port 8001 of the testnet Onion:

> [robotestagw3dcxmd66r4rgksb4nmmr43fh7<br/>7bzn2ia2eucduyeafnyd.onion:8001](http://robotestagw3dcxmd66r4rgksb4nmmr43fh77bzn2ia2eucduyeafnyd.onion:8001)

### Clearnet Mirrors

There are several tor2web services that serve as mirrors in case one of them is unavailable:

> [unsafe.robosats.com](https://unsafe.robosats.com/) <br/>
> [unsafe2.robosats.com](https://unsafe2.robosats.com/) <br/>
> [unsafe3.robosats.com](https://unsafe3.robosats.com/) <br/>
> [unsafe.testnet.robosats.com](http://unsafe.testnet.robosats.com/) <br/>
> [unsafe2.testnet.robosats.com](http://unsafe2.testnet.robosats.com/)

{% include improve %}

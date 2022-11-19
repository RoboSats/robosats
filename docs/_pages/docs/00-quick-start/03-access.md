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
A safe and very private way to use RoboSats is through the Onion address. You need [Tor Browser](/docs/tor/).

> [<b>robosats</b>6tkf3eva7x2voqso3a5wcorsnw34j<br/>veyxfqi2fu7oyheasid.onion](http://robosats6tkf3eva7x2voqso3a5wcorsnw34jveyxfqi2fu7oyheasid.onion/)

**Private:** your connection will be encrypted end-to-end and relaid by several layers of nodes making tracking harder.
{: .notice--primary}

## <img style='width:36px;height:38px;-webkit-filter:grayscale(1);filter:grayscale(1);' src='/assets/vector/Itoopie.svg'/> Privately with I2P
I2P is another safe and private way to use RoboSats. You need to install [I2P](https://geti2p.com/en/download).

> [<b>robosats.i2p</b>?i2paddresshelper=r7r4sckft<br/>6ptmk4r2jajiuqbowqyxiwsle4iyg4fijtoordc6z7a.b32.i2p](http://robosats.i2p?i2paddresshelper=r7r4sckft6ptmk4r2jajiuqbowqyxiwsle4iyg4fijtoordc6z7a.b32.i2p)

## <i class="fa-solid fa-window-maximize"></i> Unsafely in Clearnet
There is an unsafe way to view RoboSats without TOR that relies on third party tor2web services. With this URL you can access RoboSats from any browser, but using this URL is **highly unrecommended!**

> [unsafe.robosats.com](https://unsafe.robosats.com)

**Unsafe:** your privacy can be compromised if you use the unsafe clearnet url in a regular web browser.
{: .notice--secondary}

TIf you use the clearnet url, you should assume are being spied on. However, most sensitive RoboSats features are disabled (e.g. the chat) so users cannot give away sensitive personal data. Use this URL only to have a quick look to the book orders. Never use it for trading or logging into active Robot avatars.

## <i class="fa-solid fa-person-dots-from-line"></i> All in one

In order to more easily remember how to access, we have set up robosats.com . If you are using Tor Browser, it will directly take you to the Onion Site. Otherwise, it will take you to the unsafe site.

> [<span style="font-size:larger;">robosats.com</span>](https://robosats.com)


## Others
### Testnet
You can practice and test all of the functionalities in RoboSats without of losing funds by using [Testnet Bitcoin](https://en.bitcoin.it/wiki/Testnet). All you need is a Testnet Lightning wallet and access the testnet platform

> [<b>robotest</b>agw3dcxmd66r4rgksb4nmmr43fh7<br/>7bzn2ia2eucduyeafnyd.onion](http://robotestagw3dcxmd66r4rgksb4nmmr43fh77bzn2ia2eucduyeafnyd.onion/)

Or unsafely on the testnet clearnet bridge.

> [unsafe.testnet.robosats.com](http://unsafe.testnet.robosats.com)

### Onion Mirrors

It is possible to access the **testnet** platform on the port 8001 of the mainnet onion

> [robosats6tkf3eva7x2voqso3a5wcorsnw34j<br/>veyxfqi2fu7oyheasid.onion:8001](http://robosats6tkf3eva7x2voqso3a5wcorsnw34jveyxfqi2fu7oyheasid.onion:8001)

It is also possible to access the **mainnet** platform on the port 8001 of the testnet onion

> [robotestagw3dcxmd66r4rgksb4nmmr43fh7<br/>7bzn2ia2eucduyeafnyd.onion:8001](http://robotestagw3dcxmd66r4rgksb4nmmr43fh77bzn2ia2eucduyeafnyd.onion:8001)

### Clearnet Mirrors
There are several tor2web services that serve as mirrors in case one of them is unavailable

> [unsafe.robosats.com](https://unsafe.robosats.com/) <br/>
> [unsafe2.robosats.com](https://unsafe2.robosats.com/) <br/>
> [unsafe3.robosats.com](https://unsafe3.robosats.com/) <br/>
> [unsafe.testnet.robosats.com](http://unsafe.testnet.robosats.com/) <br/>
> [unsafe2.testnet.robosats.com](http://unsafe2.testnet.robosats.com/)


{% include improve %}

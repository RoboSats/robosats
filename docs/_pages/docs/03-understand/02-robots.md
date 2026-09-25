---
layout: single
title: Robot Avatars
permalink: /docs/robots/
toc: true
toc_sticky: true
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/robot.svg"/>Robots'
  nav: docs
src: "_pages/docs/03-understand/02-robots.md"
---

Your Garage is your collection of robot identities in RoboSats. It is controlled by a single **Garage Key**: one master key that deterministically generates every robot you will ever trade with. Back up the Garage Key once, and you can recover your entire identity history forever.  
  
Each robot is generated from its own account derived from your Garage Key (Account #0, #1, #2...), so every trade gets a fresh, unlinkable identity automatically. Use this anonymous identity to begin making and taking orders with RoboSats!  
  
Therefore, make sure to **safely store your Garage Key**. It is the only backup you need: anyone holding it controls all your robots, past and future — treat it like a seed phrase.

Remember to be concise but courteous when chatting with your robot peers!

## **Why the Privacy?**

Prioritizing absolute privacy for the end-user provides the highest degree of protection. User data is especially ripe for exploitation by hackers and cybercriminals; to avoid such scenarios in the first place, RoboSats does not collect any end-user data.

Platforms collecting personal information present a real risk to the end-user. Data breaches in just the past decade have altogether leaked billions of users' sensitive information through a combination of hackings and poor platform security.

Privacy is extremely important for RoboSats; however, your transactions on RoboSats are only as private as you make them. Users should take care to use privacy-preserving methods when interacting with RoboSats and your robot peers. Refer to [Quick Start > Access](/docs/access/) for additional information.

## **Robot Rotation: Automatic. Re-Use: Not Recommended**

RoboSats automatically rotates to a fresh robot after each completed trade to enhance your privacy. Robot re-use has the potential to expose end-user information since multiple orders can be linked to a single avatar, which is why a robot that has finished an order can no longer make or take new ones. To start a new trade, simply navigate to a new account in your Garage.  
  
Your Garage Key acts like a password for accessing all of your accounts: ongoing orders, active disputes and past robots. Please safely store it or risk losing access to your entire Garage.  
  
Recovering your Garage is easy: paste your Garage Key in the recovery screen. The app consults the Nostr relays, discovers how many accounts you have used, and rebuilds every robot — no need to back up individual tokens.  
  
While we may become fond of our one-time robot identity during the short time an order is made or taken, the app moves you on to a new avatar automatically. Think of all the great times you'll have making and taking orders with new robot identities!  
  
As stated, robot re-use degrades privacy — so RoboSats simply does not allow it anymore.

## **Robot Construction Process**

RoboSats references the source code for RoboHash.org as a quick way to generate fresh avatars for a website. Your robot is "built" from a unique token, a random string of characters (ZD3I7XH...), where only those characters in their exact order can generate that exact robot avatar.

Account tokens are deterministically derived from your Garage Key, one per robot. You may still view and back up an individual account token if you want, but it is not necessary: the Garage Key regenerates them all. Every token still requires sufficient entropy to be accepted as valid.


Under the hood, each account token derived from your Garage Key is used on the client side to generate and encrypt your PGP private key, derive your Nostr keypair, and request from the RoboSats node an avatar and nickname; returning to you the corresponding robot identity. See the graphic below:


![RoboSats Identity Generation Pipeline](https://learn.robosats.org/assets/images/private/usergen-pipeline.png)

## **Communicating With Your Fellow Robots**

Your identity may be concealed by a robot identity, yet that is no excuse for being a difficult peer during trades. Other robots have robo-feelings too! Be succinct and respectful when chatting with peers; this will make for an easier and smoother experience on RoboSats. Never share more information than is absolutely necessary to complete the order.

All communications in RoboSats are PGP encrypted. The encrypted peer-to-peer chat messages are signed by each robot peer which proves no one intercepted the chat and is useful for resolving disputes. Refer to [Best Practices > PGP Encryption](/docs/pgp-encryption/) for additional information.

{% include improve %}

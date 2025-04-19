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

Assume the identity of a robot with a corresponding private token. Use this anonymous identity to begin making and taking orders with RoboSats! It is not recommended to use the same robot twice as this degrades end-user privacy.

Each new webpage visit to the RoboSats site will present the end-user with an automatically and randomly generated robot avatar and username to provide default privacy for the end-user.

Therefore, make sure to **safely store the private token** associated with that specific avatar. Without the token, you will not be able to access nor re-generate that unique avatar again.

Remember to be concise but courteous when chatting with your robot peers!

## **Why the Privacy?**

Prioritizing absolute privacy for the end-user provides the highest degree of protection. User data is especially ripe for exploitation by hackers and cybercriminals; to avoid such scenarios in the first place, RoboSats does not collect any end-user data.

Platforms collecting personal information present a real risk to the end-user. Data breaches in just the past decade have altogether leaked billions of users' sensitive information through a combination of hackings and poor platform security.

Privacy is extremely important for RoboSats; however, your transactions on RoboSats are only as private as you make them. Users should take care to use privacy-preserving methods when interacting with RoboSats and your robot peers. Refer to [Quick Start > Access](/docs/access/) for additional information.

## **Robot Re-Use: Not Recommended**

It is strongly recommended to generate a new, random robot after each trade to enhance your privacy. Robot re-use has the potential to expose end-user information since multiple orders can be linked to a single avatar.

The unique token associated with each avatar is not intended for robot re-use; rather, it is intended to act like a password for accessing ongoing orders and resolving active disputes. Please safely store this token or risk never accessing that particular robot avatar again.

Recovering a robot is easy: simply replace the randomly generated token with your backed-up token and select "Generate Robot" to recover your robot's profile.

While we may become fond of our one-time robot identity during the short time an order is made or taken, it is better to move on to a new avatar. Think of all the great times you'll have making and taking orders with new robot identities!

As stated, robot re-use is ill-advised and can ultimately become a detriment to end-user privacy.

## **Robot Construction Process**

RoboSats references the source code for RoboHash.org as a quick way to generate fresh avatars for a website. Your robot is "built" from a unique token, a random string of characters (ZD3I7XH...), where only those characters in their exact order can generate that exact robot avatar.

A token is automatically generated for you each time the RoboSats webpage is accessed. Users may re-generate as many randomized tokens as they'd like, which is strongly encouraged after each trade. As a note, you can enter a token of sufficient entropy created by yourself instead of relying on RoboSats; but because only you know the token, it is wise to safely back up your token.

Under the hood, token creation in the RoboSats homepage is the process of generating and encrypting your PGP private key with your token on the client side of the app. The end-user requests from the RoboSats node an avatar and nickname generated from your encrypted token and returns to you the corresponding robot identity. See the graphic below:

![RoboSats Identity Generation Pipeline](https://learn.robosats.org/assets/images/private/usergen-pipeline.png)

## **Communicating With Your Fellow Robots**

Your identity may be concealed by a robot identity, yet that is no excuse for being a difficult peer during trades. Other robots have robo-feelings too! Be succinct and respectful when chatting with peers; this will make for an easier and smoother experience on RoboSats. Never share more information than is absolutely necessary to complete the order.

All communications in RoboSats are PGP encrypted. The encrypted peer-to-peer chat messages are signed by each robot peer which proves no one intercepted the chat and is useful for resolving disputes. Refer to [Best Practices > PGP Encryption](/docs/pgp-encryption/) for additional information.

{% include improve %}

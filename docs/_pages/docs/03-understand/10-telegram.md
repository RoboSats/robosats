---
layout: single
title: Telegram Notifications, Alert and Groups
permalink: /docs/telegram/
toc: true
toc_sticky: true
sidebar:
  title: '<img id="side-icon-verybig" src="/assets/vector/telegram.svg"/>Telegram'
  nav: docs
src: "_pages/docs/03-understand/10-telegram.md"
---

<!-- Cover: telegram notification bot: how to enable (on phone and desktop). What are the privacy trade offs. Alert bot (Jacky). Telegram public support group, different language group. Warning: never reply to privates. Never share your robot token -->

## **RoboSats Alert bot 🔔**

You can find it on Telegram with the username @RobosatsAlertBot, whose admin is @jakyhack.

## **What Can I Do with @RobosatsAlertBot?**

It is a bot designed to notify you when an order that meets your requirements is posted on RoboSats.

This means that if you want to "BUY" Sats with "EUROS" with a maximum premium of "5%" through the payment methods "BIZUM,PAYPAL,SEPA,STRIKE", tell @RobosatsAlertBot and he will take care of it to notify you when a trade that meets these requirements is published on RoboSats.

## **User Guide**

Access @RobosatsAlertBot and start the bot with the /start command.

Next, it will give you a choice between 2 options: add a new alert or list the alerts that you already have configured. Obviously, when you start the bot for the first time, you will not have any alerts configured.

![image](https://user-images.githubusercontent.com/47178010/170114653-f1d22f61-1db3-4a6a-b38c-5542a1b76648.png)

Proceed to create a new alert by clicking on the "+ Add new alert" button or using the /new command.

From that moment, the bot is ready to save your preferences. It will ask you 4 questions:
- What do you want to do? You will be able to choose between buying or selling; this means telling the bot what you want to do within RoboSats.

![image](https://user-images.githubusercontent.com/47178010/170114706-a4226028-50a5-414e-8ae8-c44f90833ff6.png)

- What is your fiat currency? It will give you a list of fiat currencies, just choose yours.

![image](https://user-images.githubusercontent.com/47178010/170114837-3e83f1c9-035a-4b59-8c8e-043f77995a33.png)

- What is the maximum premium you are willing to pay? Or, what is the minimum premium you are willing to accept? Depending on whether you want to buy or sell Sats, it will ask you one question or another.

![image](https://user-images.githubusercontent.com/47178010/170115618-66117113-e702-4faa-b02d-a8101244f7da.png)

- What payment methods do you accept to make/receive payment with fiat? Simply tell the bot what payment methods you would be willing to accept for your trade. Inform them in the following format: "Révolut,SEPA,Strike,Bizum" (without quotes). If you are indifferent to the fiat payment method, simply send it: "Any" (without quotes).

![image](https://user-images.githubusercontent.com/47178010/170115693-7378b25a-93af-4ad3-ad7e-d0185364003d.png)

Once all this has been reported, your alert is configured correctly. In the event an order is posted on RoboSats that meets your conditions, @RobosatsAlertBot will notify you via Telegram with a link to the order book so you can proceed with your trade if you wish. Below is an example of an alert.

![image](https://user-images.githubusercontent.com/47178010/170116003-6316c10a-0c6f-44bc-8eb6-17a1df8e1f3f.png)

## **How Often Does RoboSats Look at the Order Book?**

RoboSats checks the order book every minute; this means that the maximum time that will pass from when an order that meets your conditions is published until @RobosatsAlertBot notifies you will be 1 minute.

## **Once @RobosatsAlertBot Has Notified Me, Can I Use that Same Alert Again?**

Yes, once @RobosatsAlertBot notifies you, your alert stays in the disabled state, simply turn it back on and @RobosatsAlertBot will notify you again when an order meets your conditions.

## **What Can Go Wrong?**

Nothing wrong, but there can be disappointments. It is possible that the conditions of your alert are conditions shared by many users, this means that there are many users who want to find a trade with the same (or very similar) conditions as you. This means that an order with very restrictive conditions may be in the order book for a very short time because some other user accepts it before you do, which is why the bot's creator recommends always having it with sound.

## **LOSS OF PRIVACY**

RoboSats is an exchange focused on user privacy because personal information is not required. The optimal setup for RoboSats is through a recommended access method like the private TOR browser.

Once you leave TOR to a third party application (i.e., Telegram) you lose privacy.

This bot, like any other, will store your Telegram user ID as it is necessary to contact the user. It will also store the data of your alert.

That is, the bot will know that user 123456789 has an alert to buy Sats with EUROS with a maximum of 5% premium through Bizum, PayPal, or Strike.

It is important to always keep this in mind. Some are willing to sacrifice a degree of privacy in favor of convenient notifications, but you must consider the tradeoffs associated with revealing the aforementioned information. Privacy is what we choose to selectively reveal and is ultimately up to the end-user as to how private they want to make their RoboSats experience.

{% include improve %}

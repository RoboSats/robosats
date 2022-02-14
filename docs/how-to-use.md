# How to use RoboSats with step by step walktrough

RoboSats is focused on user friendliness. The platform is totally self-explaining, and a tutorial or walktrough is really not necessary. However, it really helps to feel comfortable when trading if you already know what are the next steps to come and nothing surprises you. After all, bitcoin p2p exchanges are very intimidating! Fear no more, RoboSats keeps it really simple and you simply cannot do things wrong! :D

This document has two complete walktroughs: 1) as a buyer that takes an order, and as a seller that makes an order. Given that the platform explains to the user exactly everything in the menus, we are going to dedicate some lines to some tricks and give tips for safe trading in between.

## User Generation Home Page
![](images/how-to-use/homepage-1.png)

RoboSats welcomes you with your new unique robot avatar for trading. The robot is generated based on the token you see below it. This token is all you need to recover the avatar in the future, so make sure to **back it up safely!**

The tokens are generated in your own browser, so there is no risk of someone else knowing them. However, if you do not trust your machine randomness, you can also input your own entropy token. *Note that low entropy tokens are not valid.*

On this example, I was really not really not happy of being "HomelessCash"! :D So I just click on the dice icon to generate a new token and tap `Generate avatar` to get a new one
![](images/how-to-use/homepage-2.png)

Ah, "JoyfulPain", so much better!! :) The token will live in your browser memory for some time so you still might have a chance to copy it later by tapping in the profile icon in the bottom left corner. However, your browser will forget your token if you refresh or close it! 
![](images/how-to-use/homepage-3.png)
It is best to write it down in paper... but that's a lot of work!! Most often it is good enough to simply copy it to clipboard and save it somewhere else. **If your browser crashes, your phone battery dies, or you lose connection during trading, you will need the token to log in again and continue with the trade!**

## Trade

In RoboSats you can make new orders, or take orders made by others. To be an _order maker_ simply click on Create Order in the homepage. To take an order, click on "View Book" so you can explore the orders created by other robots.
![](images/how-to-use/homepage-buttons.png)


### Exploring the Order Book

We click in View book and have a look to the orders in the book page.

![](images/how-to-use/book-desktop.png)
On a desktop browser, you can see at a glance all of the revelant information about the orders so you can decide which one to take. By default, the book will show as 'ANY' type of order (Buy and Sell) and 'ANY' currency. Use the drop down menus at the top to select your preferences.
![](images/how-to-use/book-phone.png)
On a smartphone, however, not all of the columns fits on the screen. The nicknames, the type of order, the payment method and the exchange rate are hidden by default. You can tap on any column and tap "Show columns" to select what columns to make visible 
![](images/how-to-use/book-show-columns.png)
Another trick, is to do a long tap or a swipe:
 -  On Avatar: you get Nickname and Activity status
 -  On Amount: you get whether the maker is a seller or a buyer
 -  On Currency: you get the preferred payment methods
 -  On premium: you get the current exchange rate.
Example of long tapping / swipping above the currency:
![](images/how-to-use/book-tap-1.png)
Example of long tapping / swipping above the premium:
![](images/how-to-use/book-tap-2.png)
You can also tap on any order to see the full order page:
![](images/how-to-use/order-page-1.png)

Every order has an expiration counter. By default, in RoboSats v0.1.0 new orders will stay public in the book for 6 hours.

### Taking an order as a buyer (1)

When you are decided for an order to take simply tap the "Take Order" button. You will see the contract box. Follow the contract box indications until you complete the trade! :) 

First thing is to lock a fidelity bond so the maker knows you can be trusted. The satoshis in this bond will just freeze in your wallet. If you try to cheat or cancel unilaterally you will lose the satoshis locked in the bond.
![](images/how-to-use/contract-box-1.png)

Scan or copy the invoice into your lightning wallet. It might show as a payment that is on transit, freeze or even aparently break your wallet. You should always check on the robosats website whether the bond has been locked (you wallet will probably not tell you! check [wallet compatibility list](https://github.com/Reckless-Satoshi/robosats/issues/44)) 

![](images/how-to-use/contract-box-2.png)
As soon as or bond is locked, RoboSats will ask you to provide a lightning invoice to send you the satoshis. Generate an invoice with the exact amount in your lightning wallet and submit it. 

![](images/how-to-use/contract-box-3.png)
While we you were submitting your payout invoice, the seller was asked to lock the trade escrow hold invoice. If we were faster than him, we will have to wait. Otherwise we would already be able to chat with him. The step to submit the invoice (buyer) and lock the trade escrow (seller) has a time-out of 30 minutes. If the time runs out, the order will expire and the robot who did not follow with the contract obligations will lose the bond. This is a mechanism to prevent fake order spamming.

![](images/how-to-use/contract-box-4.png)
As soon as the seller locks the satoshis, it is safe to send the fiat currency! As a buyer, you will have to ask the seller for the details to send fiat. Remember to only share the information needed about yourself to not compromise your privacy. Remember, in RoboSats v0.1.0 this chat is memoryless, so the conversation will be lost if you refresh the browser.

![](images/how-to-use/contract-box-5.png)
As soon as you have sent the fiat, you should tap on "Confirm fiat sent" button! After that, the seller will have to confirm the fiat was received. As soon as he confirms the trade is finished and you will be paid out to your lightning wallet. You might see that it is "sending satoshis to buyer" but usually it is so fast you will simply see this screen. Enjoy your sats!
![](images/how-to-use/contract-box-6.png)
Rating the platform and leaving tips for improvement in our Telegram group or Github Issues is super appreciated!



### Making an order as a seller (2)

It might happen that there is no active orders for the positioning and currency you want. In this case, there is no orders to SELL bitcoin for GBP.

![](images/how-to-use/book-no-orders.png)

We can create ourself the order exactly has we want it, there might be someone who wants to take it! 

![](images/how-to-use/maker-page.png)

In the maker page you are only required to enter the currency, order type (buy/sell) and amount. However, it is best practice to specify the payment methods you allow. it might be also helpful to set a premium/discount for your order to be taken faster. Remember that as a seller you can incentivice buyers of taking your order by lowering the premium. if there is too many buyers, however, you can increase the premium to have a trading profit. Alternatively, you can set a fix amount of Satoshis.

*Limits: in Robosats v0.1.0 an order cannot be smaller than 10.000 Satoshis. It cannot be larger than 500.000 Satoshis in order to avoid lightning routing failures. This limit will be increased in the future.*


![](images/how-to-use/contract-box-7.png)

You have to copy or scan the invoice with your lightning wallet in order to lock your fidelity maker bond. By locking this bond, the takers know you can be trusted and are commited to follow with this trade. In your wallet it might show as a payment that is on transit, freeze or even aparently break your wallet. You should always check on the robosats website whether the bond has been locked (your wallet will probably not tell you! check [wallet compatibility list](https://github.com/Reckless-Satoshi/robosats/issues/44)) 


![](images/how-to-use/contract-box-8.png)

Your order will be public for 6 hours. You can check the time left to expiration by checking the "Order" tab. It can be canceled at any time without penalty before it is taken by another robot. Keep the contract tab open to be notified [with this sound](https://github.com/Reckless-Satoshi/robosats/raw/main/frontend/static/assets/sounds/taker-found.mp3). It might be best to do this on a desktop computer and turn on the volume, so you do not miss when your order is taken. It might take long! Maybe you even forget! *Note: If you forget your order and a robot takes it and locks his fidelity bond, you risk losing your own fidelity bond by not fulfilling the next contract steps.*

![](images/how-to-use/contract-box-9.png)

Hurray, someone took the order! They have 4 minutes to lock a taker fidelity bond, if they do not proceed, your order will be made public again automatically.

![](images/how-to-use/contract-box-10.png)

As soon as the taker locks the bond you will have to lock the trade escrow. This is a lightning hold invoice and will also freeze in your wallet. It will be released only when you confirm you received the fiat payment or if there is a dispute between you and the taker.

![](images/how-to-use/contract-box-11.png)

Once you lock the trade escrow and the buyer submit the payout invoice it is safe to send fiat! Share with the buyer the minimal information needed to send you fiat. Remember, in RoboSats v0.1.0 this chat is memoryless, so the conversation will be lost if you refresh the browser.

![](images/how-to-use/contract-box-12.png)

The buyer has just confirmed he did his part! Now check until the fiat is in your account.

![](images/how-to-use/contract-box-13.png)

By confirming that you received the fiat, the escrow will be charged and send to the buyer. So only do this once you are 100% sure the fiat is with you!

![](images/how-to-use/contract-box-14.png)

All done!! :D

## Collaborative cancellation

After the trade escrow has been posted and before the buyer confirms he sent the fiat it is possible to cancel the order. It might just happen that you both do not have a common way to send and receive fiat after all. You can agree to tap on the "Collaborative cancel" button. After the "Fiat sent" button is pressed by the buyer, the only way to cancel an order is by opening a dispute and involving the staff. 
![](images/how-to-use/contract-box-15.png)

This is totally not recommended, one of the two traders will lose his fidelity bond except in exceptional cases (up to the discretion of the staff)

## Collaborative cancellation

Missunderstandings happen. But also, there might be people willing to try to scam others. In this case *MakeshiftSource875* thought he could get away by not confirming he received the fiat, as if he was going to be able to keep the satoshis. 

![](images/how-to-use/contract-box-16.png)

This is in fact not possible, as a dispute will be automatically open at expiration. However, if you know something fishy is going on, you should open a dispute.

![](images/how-to-use/contract-box-17.png)

In RoboSats v0.1.0 the dispute pipeline is not fully implemented in web. Therefore, most contact and resolution has to happen trough alternative methods. Be sure to send a contact method to the staff. You will have to write down full statement of facts, remember that the staff cannot read your private chat to judge about what happened. It is useful to send images/screenshots. For maximum privacy, these can be encrypted via PGP key and uplaoded into any anonymous file sharing system.

![](images/how-to-use/contract-box-18.png)

Once the staff has resolved the dispute, the final order status will display the resolution. Make sure to check on the contact method provided to the staff. If you are a dispute winner, the staff will ask you again for a lightning network invoice to send the payout+bond (your old invoice is probably expired!)

![](images/how-to-use/contract-box-19.png)

# วิธีการใช้งาน RoboSats (v0.1.0)

RoboSats จะเน้นที่ความสะดวกในการใช้งานการใช้งานแพล้ตฟอร์มมีลักษณะตรงไปตรงมาบางคนอาจคิดว่าวิธีใช้งานไม่มีความจำเป็น อย่างไรก็ตาม การที่เรารู้ว่าเราจะต้องทำอะไรบ้างในแต่ละขั้นตอนก็จะช่วยให้การเทรดมีความสบายมากขึ้นและทำให้เราไม่ตกใจในการเทรด ไม่ว่ายังไงการซื้อขาย bitcoin แบบ P2P ก็เป็นสิ่งที่ฟังดูน่ากลัวมากจริงๆนั่นแหละ แต่ว่าคุณจะไม่ต้องกลัวอีกต่อไปเพราะ RoboSats จะทำให้มันเป็นเรื่องง่ายและคุณจะไม่มีทางพลาดอย่างแน่นอน! :D

บทความนี้ประกอบด้วยขั้นตอนการใช้งาน 2 ส่วน: 
1) การใช้งานในฐานะผู้ซื้อเหรียญและเป็นฝ่ายคนขอซื้อ 
2) การใช้งานในฐานะผู้ขายเหรียญและเป็นฝ่ายร้านเสนอขายเนื่องจากว่าแพล้ตฟอร์มได้อธิบายทุกอย่างด้วยตัวมันเองอยู่แล้วเราจะเน้นที่จุดสำคัญหรือเทคนิคเล็กๆที่จะทำให้คุณเทรดได้อย่างปลอดภัย

<!---RoboSats is focused on user friendliness. The platform is totally self-explanatory, so one could say a tutorial is really not necessary. 
However, it really helps to feel comfortable when trading if you already know what are the next steps to come so nothing surprises you. 
After all, bitcoin p2p exchanges are very intimidating! Fear no more, RoboSats keeps it really simple and you simply cannot do things wrong! :D

This document has two complete walkthroughs: 1) as a buyer that takes an order and; 2) as a seller that makes an order. 
Given that the platform explains to the user exactly everything in the menus, 
we are going to dedicate some lines to some tricks and give tips for safe trading in between.--->

## หน้าโฮมเพจและการสร้างผู้ใช้งาน
RoboSats จะช่วยรักษาความเป็นส่วนตัวโดยสร้างอวตารใหม่ให้แก่ผู้ใช้งานทุกครั้งที่ทำการซื้อขาย อวตารนั้นสามารถสร้างได้อย่างง่ายดายมากๆ!
<div align="center">
<img src="images/how-to-use/homepage-1.png"  width="370" />
</div>


ทันทีที่คุณเริ่มใช้งาน RoboSats คุณจะได้รับหุ่นอวตารของคุณ หุ่นอวตารจะถูกสร้างขึ้นจากชุดตัวอักษร Token ที่อยู่ด้านใต้ ซึ่งคุณจะต้องใช้ Token นี้ในการเรียกหุ่นอวตารตัวเดิมกลับมาใช้งานอีกครั้งในอนาคต ดังนั้นคุณควรบันทึก Token ดังกล่าวและ **เก็บรักษาชุดตัวอักษร Token ไว้ให้ดี**

Token นั้นถูกสร้างขึ้นในบราวเซอร์ของคุณ อย่างไรก็ตาม ถ้าหากคุณไม่เชื่อมั่นในการสุ่มของอุปกรณ์ของคุณ คุณสามารถระบุ Entropy Token ของคุณเองก็ได้ *หมายเหตุ Token ที่มี Entropy ต่ำเกินไปหรือมีความเดาสุ่มต่ำเกินไปจะไม่สามารถนำมาใช้งานได้

ยกตัวอย่าง หากเราไม่ชอบชื่อ "HomelessCash"! ให้เราคลิ้กที่ไอคอนรูปลูกเต๋าเพื่อทำการสุ่มชุดคำ Token ใหม่ จากนั้นให้กดที่ "Generate avatar" เพื่อสร้างหุ่นอวตารใหม่จาก Token ใหม่ที่เราเพิ่งระบุลงไป

<div align="center">
<img src="images/how-to-use/homepage-2.png"  width="370" />
</div>

ผมได้หุ่นอวตารใหม่ชื่อ "JoyfulPain" ซึ่งหากเราชอบชื่อนี้ให้เราทำการเซฟ Token ไว้
ชุด Token จะถูกเก็บไว้ในบราวเซอร์เราต่อไปอีกซักพัก คุณสามารถทำการคัดลอก (copy) Token ได้ในภายหลัง โดยกดที่รูปโปรไฟล์หุ่นอวตารเราบริเวณมุมซ้ายล่าง
อย่างไรก็ตาม หากเราทำการรีเฟรชหรือปิดบราวเซอร์ บราวเซอร์จะลืม Token ของคุณทันที!

<div align="center">
<img src="images/how-to-use/homepage-3.png"  width="370" />
</div>

การเก็บรักษา Token โดยการจดลงในกระดาษจะทำได้ลำบาก คุณสามารถเก็บรักษามันโดยการคัดลอกไปวางไว้ที่อื่นเช่นโปรแกรม notepad หรือ note สำหรับการจดบันทึก **หากบราวเซอร์ของคุณมีการปิดไปเอง หรือแบตมือถือของคุณหมด หรือเน็ตคุณหลุดระหว่างการซื้อขาย คุณจะต้องใช้ Token ในการกลับเข้ามาใช้งานหุ่นอวตารเดิมและดำเนินการซื้อขายแลกเปลี่ยนต่อ

<!---RoboSats help users preserve their privacy by using newly generated avatars in every trade. Avatars are super easy to generate!
<div align="center">
<img src="images/how-to-use/homepage-1.png"  width="370" />
</div>

RoboSats welcomes you right away with your unique robot avatar. The robot is deterministically generated based on the token you see below it. This token is all you need to recover the avatar in the future, so make sure to **back it up safely!**

The tokens are generated in your own browser. However, if you do not trust your machine randomness, you can also input your own entropy token. *Note that low entropy tokens are not valid.*

I was really not happy of being "HomelessCash"! :D So I just click on the dice icon to generate a new token and tap "Generate avatar" to get a new one
 
<div align="center">
<img src="images/how-to-use/homepage-2.png"  width="370" />
</div>

Ah, "JoyfulPain", so much better!! :) 
The token will live in your browser memory for some time, so you still might have a chance to copy it later by tapping in the profile icon in the bottom left corner. However, your browser will forget your token if you refresh or close it! 
 
<div align="center">
<img src="images/how-to-use/homepage-3.png"  width="370" />
</div>

It is best to write it down in paper... but that's a lot of work!! Most often it is good enough to simply copy it to clipboard and save it somewhere else. **If your browser crashes, your phone battery dies, or you lose connection during trading, you will need the token to log in again and continue with the trade!**--->

### การเรียกหุ่นอวตารเดิมกลับมาใช้งาน

หากคุณต้องการเรียกหุ่นอวตารเดิมกลับมาใช้งาน ให้คุณวาง Token ของคุณแทนที่ไปในช่อง จากนั้นกดที่ "Generate Robot" จากนั้นแพลทฟอร์มจะแจ้งว่า "We found your Robot avatar. Welcome back!" ซึ่งบ่งชี้ว่าเราเรียกหุ่นอวตารเดิมกลับมาใช้งานได้สำเร็จ

<!--To recover a backed-up token, simply replace the token in the textbox and tap "Generate Robot". The site will greet you with "We found your Robot avatar. Welcome back!"-->

## การซื้อขาย

ใน RoboSats คุณสามารถเป็นได้ทั้งผู้สร้างรายการซื้อขาย (Maker) และผู้รับรายการซื้อขาย (Taker) ในการเป็น _(ผู้สร้างรายการซื้อขาย) order maker_ ให้กดที่ "Create Order" ในหน้าโฮมเพจ หากต้องการรับรายการซื้อขายที่ผู้ใช้งานท่านอื่นสร้างไว้ ให้กดที่ "View Book" เพื่อสำรวจรายการซื้อขายที่สร้างโดยหุ่นอวตารของคนอื่น

<!--In RoboSats you can make new orders or take orders made by others. To be an _order maker_ simply click on "Create Order" in the homepage. To take an order, click on "View Book" so you can explore the orders created by other robots.-->

### Exploring the Order Book

We click on "View book" and have a look at the orders in the book page.

<div align="center">
<img src="images/how-to-use/book-desktop.png"/>
</div>

On a desktop browser, you can see at a glance all of the revelant information about the orders so you can decide which one to take. By default, the book will show "ANY" type of order (buy and sell) and "ANY" currency. Use the drop down menus at the top to select your preferences.

<div align="center">
<img src="images/how-to-use/book-phone.png"  width="370" />
</div>

On a smartphone, however, not all of the columns fit on the screen. The nicknames, the type of order, the payment method and the exchange rate are hidden by default. You can tap on any column and tap "Show columns" to select what columns to make visible.

<div align="center">
<img src="images/how-to-use/book-show-columns.png"  width="230" />
</div>

Another trick is to do a long tap or a swipe:
 -  On Avatar: you get Nickname and Activity status.
 -  On Amount: you get whether the maker is a seller or a buyer.
 -  On Currency: you get the preferred payment methods.
 -  On premium: you get the current exchange rate.
Example of long tapping/swiping above the currency:

<div align="center">
<img src="images/how-to-use/book-tap-1.png"  width="370" />
</div>

Example of long tapping/swiping above the premium:

<div align="center">
<img src="images/how-to-use/book-tap-2.png"  width="370" />
</div>

You can also tap on any order to see the full order page:

<div align="center">
<img src="images/how-to-use/order-page-1.png"  width="370" />
</div>

Every order has an expiration counter. By default, in RoboSats v0.1.0 new orders will stay public in the book for 6 hours.

### Walktrough-1: Taking an order as a buyer

When you are decided for an order to take simply tap the "Take Order" button. You will see the contract box. Follow the contract box indications until you complete the trade! :) 

First thing is to lock a small fidelity bond (just 1% of the trade amount), so the seller knows you can be trusted. The satoshis in this bond will just freeze in your wallet. If you try to cheat or cancel unilaterally, you will lose the satoshis locked in the bond.

<div align="center">
<img src="images/how-to-use/contract-box-1.png"  width="370" />
</div>

Scan or copy the invoice into your lightning wallet. It might show as a payment that is on transit, freeze or even seemingly break your wallet. You should always check on the RoboSats website whether the bond has been locked (your wallet will probably not tell you! Check [wallet compatibility list](https://github.com/Reckless-Satoshi/robosats/issues/44))

<div align="center">
<img src="images/how-to-use/contract-box-2.png"  width="370" />
</div>

As soon as our bond is locked, RoboSats will ask you to provide a lightning invoice to send you the satoshis. Generate an invoice with the exact amount in your lightning wallet and submit it. 

<div align="center">
<img src="images/how-to-use/contract-box-3.png"  width="370" />
</div>

While you are submitting your payout invoice, the seller is asked to lock the trade escrow hold invoice. If you are faster than him, you would have to wait. Otherwise, you would already be able to chat with him. 

There is a time limit of 3 hours to submit the invoice (buyer) and lock the trade escrow (seller). If the time runs out, the order will expire and the robot who did not follow with the contract obligations will lose the bond. This is a mechanism that helps prevent fake order spamming, wasting time of counterparts and DDOSing the order book.

<div align="center">
<img src="images/how-to-use/contract-box-4.png"  width="370" />
</div>

As soon as the seller locks the satoshis, it is safe to send the fiat currency! As a buyer, you will have to ask the seller for the details to send fiat. Only share the strictly needed information about yourself to not compromise your privacy. Remember, in RoboSats v0.1.0 this chat is memoryless, so the conversation will be lost if you refresh the browser.
 
<div align="center">
<img src="images/how-to-use/contract-box-5.png"  width="370" />
</div>

There is a time limit of 24 hours to complete the fiat exchange. If the time runs out, the order will expire and a dispute will be opened automatically. To avoid order expiration, **use always instant fiat payment methods**. For example, sending cash by ordinary mail is slow and will always trigger a dispute in v0.1.0. In the future longer expiry times will be possible.

As soon as you have sent the fiat, you should tap on "Confirm fiat sent" button. After that, the seller will have to confirm the fiat was received. As soon as he confirms the trade is finished and you will be paid out to your lightning wallet. You might see that it is "sending satoshis to buyer" but usually it is so fast you will simply see this screen. Enjoy your sats!

<div align="center">
<img src="images/how-to-use/contract-box-6.png"  width="370" />
</div>

Rating the platform and leaving tips for improvement in our Telegram group or Github Issues is super appreciated!

### Walktrough-2: Making an order as a seller

It might happen that there are no active orders for the positioning and currency you want. In this case, there is no orders to SELL bitcoin for GBP.
 
<div align="center">
<img src="images/how-to-use/book-no-orders.png"  width="370" />
</div>

We can create the order exactly has we want it. But mind that you need to publish an order that others want to take too! 
 
<div align="center">
<img src="images/how-to-use/maker-page.png"  width="370" />
</div>

In the maker page you are only required to enter the currency, order type (buy/sell) and amount. However, it is best practice to specify the payment methods you allow. It might be also helpful to set a premium/discount for your order to be taken faster. Remember that as a seller you can incentivze buyers to take your order by lowering the premium. If there are too many buyers, however, you can increase the premium to have a trading profit. Alternatively, you can set a fixed amount of Satoshis.

*Limits: in Robosats v0.1.0 an order cannot be smaller than 20.000 Satoshis. It cannot be larger than 800.000 Satoshis in order to avoid lightning routing failures. This limit will be increased in the future.*

<div align="center">
<img src="images/how-to-use/contract-box-7.png"  width="370" />
</div>

You have to copy or scan the invoice with your lightning wallet in order to lock your fidelity maker bond (just 1% of the trade amount)). By locking this bond, the takers know you can be trusted and are committed to follow with this trade. In your wallet it might show as a payment that is on transit, freeze or even seemingly break your wallet. You should always check on the RoboSats website whether the bond has been locked (your wallet will probably not tell you! Check [wallet compatibility list](https://github.com/Reckless-Satoshi/robosats/issues/44))

<div align="center">
<img src="images/how-to-use/contract-box-8.png"  width="370" />
</div>

Your order will be public for 24 hours. You can check the time left to expiration by checking the "Order" tab. It can be canceled at any time without penalty before it is taken by another robot. Keep the contract tab open to be notified [with this sound](https://github.com/Reckless-Satoshi/robosats/raw/main/frontend/static/assets/sounds/taker-found.mp3). It might be best to do this on a desktop computer and turn on the volume, so you do not miss when your order is taken. It might take long! Maybe you even forget! You can also enable telegram notifications by pressing "Enable Telegram Notification" and then pressing "Start" in the chat. You will receive a welcome message as confirmation of the enabled notifications. Another message will be sent once a taker for your order is found.

*Note: If you forget your order and a robot takes it and locks his fidelity bond, you risk losing your own fidelity bond by not fulfilling the next contract steps.*

In the contract tab you can also see how many other orders are public for the same currency. You can also see how well does your premium ranks among all other orders for the same currency.

<div align="center">
<img src="images/how-to-use/contract-box-9.png"  width="370" />
</div>

Hurray, someone took the order! They have 4 minutes to lock a taker fidelity bond, if they do not proceed, your order will be made public again automatically.

<div align="center">
<img src="images/how-to-use/contract-box-10.png"  width="370" />
</div>

As soon as the taker locks the bond, you will have to lock the trade escrow. This is a lightning hold invoice and will also freeze in your wallet. It will be released only when you confirm you received the fiat payment or if there is a dispute between you and the taker.

<div align="center">
<img src="images/how-to-use/contract-box-11.png"  width="370" />
</div>

Once you lock the trade escrow and the buyer submit the payout invoice it is safe to send fiat! Share with the buyer the minimal information needed to send you fiat. Remember, in RoboSats v0.1.0 this chat is memoryless, so the conversation will be lost if you refresh the browser.

<div align="center">
<img src="images/how-to-use/contract-box-12.png"  width="370" />
</div>

The buyer has just confirmed he did his part! Now check until the fiat is in your account.

<div align="center">
<img src="images/how-to-use/contract-box-13.png"  width="370" />
</div>

By confirming that you received the fiat, the escrow will be charged and sent to the buyer. So only do this once you are 100% sure the fiat is with you!

<div align="center">
<img src="images/how-to-use/contract-box-14.png"  width="370" />
</div>

All done!! :D

## Collaborative cancellation

After the trade escrow has been posted and before the buyer confirms he sent the fiat it is possible to cancel the order. It might just happen that you both do not have a common way to send and receive fiat after all. You can agree to tap on the "Collaborative cancel" button. After the "Fiat sent" button is pressed by the buyer, the only way to cancel an order is by opening a dispute and involving the staff. 

<div align="center">
<img src="images/how-to-use/contract-box-15.png"  width="370" />
</div>

This is totally not recommended, one of the two traders would lose his fidelity bond except in exceptional cases (up to the discretion of the staff)

## Disputes

Misunderstandings happen. But also, there might be people willing to try to scam others. In this case *MakeshiftSource875* thought he could get away by not confirming he received the fiat, as if he was going to be able to keep the satoshis. 

<div align="center">
<img src="images/how-to-use/contract-box-16.png"  width="370" />
</div>

This is in fact not possible, as a dispute will be automatically open at expiration. However, if you know something fishy is going on, you should open a dispute.

<div align="center">
<img src="images/how-to-use/contract-box-17.png"  width="370" />
</div>

In RoboSats v0.1.0 the dispute pipeline is not fully implemented in the web. Therefore, most contact and resolution has to happen through alternative methods. Be sure to send a contact method to the staff. You will have to write down full statement of facts, remember that the staff cannot read your private chat to judge about what happened. It is useful to send images/screenshots. For maximum privacy, these can be encrypted via PGP key and uploaded into any anonymous file sharing system.

<div align="center">
<img src="images/how-to-use/contract-box-18.png"  width="370" />
</div>

Once the staff has resolved the dispute, the final order status will display the resolution. Make sure to check on the contact method provided to the staff. If you are a dispute winner, the staff will ask you again for a lightning network invoice to send the payout+bond (Your old invoice is probably expired!)

<div align="center">
<img src="images/how-to-use/contract-box-19.png"  width="370" />
</div>

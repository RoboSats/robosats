
import {Typography, DialogActions,  DialogContent, Button } from "@mui/material"
import React, { Component } from 'react'

export default class InfoDialog extends Component {
  render() {
    return (
      <div>
        <DialogContent>
          <Typography component="h5" variant="h5">What is <i>RoboSats</i>?</Typography>
          <Typography component="body2" variant="body2">
            <p>It is a BTC/FIAT peer-to-peer exchange over lightning. It simplifies 
              matchmaking and minimizes the need of trust. RoboSats focuses in privacy and speed.</p>
            
            <p>RoboSats is an open source project <a 
              href='https://github.com/reckless-satoshi/robosats'>(GitHub).</a>
            </p>
          </Typography>
          
          <Typography component="h5" variant="h5">How does it work?</Typography>
          <Typography component="body2" variant="body2">
            <p> AnonymousAlice01 wants to sell bitcoin. She posts a sell order. 
              BafflingBob02 wants to buy bitcoin and he takes Alice's order. 
              Both have to post a small bond using lightning to prove they are real 
              robots. Then, Alice posts the trade collateral also using a lightning 
              hold invoice. <i>RoboSats</i> locks the invoice until Alice confirms she 
              received the fiat, then the satoshis are released to Bob. Enjoy your satoshis, 
              Bob!</p>

            <p>At no point, AnonymousAlice01 and BafflingBob02 have to trust the 
              bitcoin funds to each other. In case they have a conflict, <i>RoboSats</i> staff 
              will help resolving the dispute. You can find a step-by-step 
              description of the trade pipeline in <a href='https://github.com/Reckless-Satoshi/robosats/blob/main/README.md#how-it-works'>How it works</a></p>
          </Typography>

          <Typography component="h5" variant="h5">What payment methods are accepted?</Typography>
          <Typography component="body2" variant="body2">
            <p>Basically all of them. You can write down your preferred payment 
              method(s). You will have to match with a peer who also accepts 
              that method. Lightning is fast, so we highly recommend using instant 
              fiat payment rails. </p>
          </Typography>

          <Typography component="h5" variant="h5">Are there trade limits?</Typography>
          <Typography component="body2" variant="body2">
            <p>Maximum single trade size is 500,000 Satoshis to minimize lightning
              routing failure. There is no limits to the number of trades per day. A robot
              can only have one order at a time. However, you can use multiple
              robots simultatenously in different browsers (remember to back up your robot tokens!). </p>
          </Typography>

          <Typography component="h5" variant="h5">Is <i>RoboSats</i> private?</Typography>
          <Typography component="body2" variant="body2">
            <p> RoboSats will never ask you for your name, country or ID. RoboSats does
              not custody your funds, and doesn't care who you are. For best anonymity
              use Tor Browser and access the .onion hidden service. </p>

            <p>Your trading peer is the only one who can potentially guess 
              anything about you. Keep your chat short and concise. Avoid 
              providing non-essential information other than strictly necessary 
              for the fiat payment. </p>
          </Typography>

          <Typography component="h5" variant="h5">What are the risks?</Typography>
          <Typography component="body2" variant="body2">
            <p> This is an experimental application, things could go wrong. 
              Trade small amounts!  </p>

            <p>The seller faces the same chargeback risk as with any 
              other peer-to-peer service. Paypal or credit cards are 
              not recommened.</p>
          </Typography>

          <Typography component="h5" variant="h5">What is the trust model?</Typography>
          <Typography component="body2" variant="body2">
            <p> The buyer and the seller never have to trust each other. 
              Some trust on <i>RoboSats</i> is needed since linking the
              seller's hold invoice and buyer payment is not atomic (yet). 
              In addition, disputes are solved by the <i>RoboSats</i> staff.
            </p> 

            <p> To be totally clear. Trust requirements are minimized. However, there is still 
            one way <i>RoboSats </i> could run away with your satoshis: by not releasing 
               the satoshis to the buyer. It could be argued that such move is not in <i>RoboSats' </i> 
              interest as it would damage the reputation for a small payout. 
              However, you should hesitate and only trade small quantities at a 
              time. For large amounts use an onchain escrow service such as <i>Bisq</i>
            </p> 

            <p> You can build more trust on <i>RoboSats</i> by <a href='https://github.com/reckless-satoshi/robosats'>
              inspecting the source code. </a> </p>
          </Typography>

          <Typography component="h5" variant="h5">What happens if <i>RoboSats</i> suddenly disapears?</Typography>
          <Typography component="body2" variant="body2">
            <p> Your sats will return to you. Any hold invoice that is not 
              settled would be automatically returned even if <i>RoboSats</i> goes down 
              forever. This is true for both, locked bonds and trading escrows. However, 
              there is a small window between the seller confirms FIAT RECEIVED and the moment 
              the buyer receives the satoshis when the funds could be permanentely lost if
              <i> RoboSats</i> disappears. This window is about 1 second long. Make sure to have enough
              inbound liquidity to avoid routing failures. If you have any problem, reach out
              trough the <i>RoboSats</i> public channels.
            </p>
          </Typography>

          <Typography component="h5" variant="h5">Is <i>RoboSats</i> legal in my country?</Typography>
          <Typography component="body2" variant="body2">
            <p> In many countries using <i>RoboSats</i> is no different than using Ebay 
              or Craiglist. Your regulation may vary. It is your responsibility
              to comply.
            </p>
          </Typography>

          <Typography component="h5" variant="h5">Disclaimer</Typography>
          <Typography component="body2" variant="body2">
            <p> This lightning application is provided as is. It is in active 
              development: trade with the utmost caution. There is no private 
              support. Support is only offered via public channels <a href='https://t.me/robosats'>
              (Telegram)</a>. <i>RoboSats</i> will never contact you. <i>
              RoboSats</i> will definitely never ask for your robot token.
            </p>
          </Typography>
          <DialogActions>
            <Button onClick={this.props.handleCloseInfo}>Close</Button>
          </DialogActions>
        </DialogContent>
      </div>
    )
  }
}
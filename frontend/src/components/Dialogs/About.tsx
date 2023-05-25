import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  Typography,
  Link,
  DialogActions,
  DialogContent,
  Button,
  Accordion,
  AccordionDetails,
  AccordionSummary,
} from '@mui/material';
import { pn } from '../../utils';

// Icons
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface Props {
  maxAmount: string;
  open: boolean;
  onClose: () => void;
}

const AboutDialog = ({ maxAmount, open, onClose }: Props): JSX.Element => {
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby='info-dialog-title'
      aria-describedby='info-dialog-description'
      scroll='paper'
    >
      <DialogContent>
        <Typography component='h4' variant='h4'>
          {t('What is RoboSats?')}
        </Typography>
        <Typography component='div' variant='body2'>
          <p>
            {t('It is a BTC/FIAT peer-to-peer exchange over lightning.') + ' '}{' '}
            {t(
              'It simplifies matchmaking and minimizes the need of trust. RoboSats focuses in privacy and speed.',
            )}
          </p>
          <p>
            {t('RoboSats is an open source project ')}{' '}
            <Link href='https://github.com/RoboSats/robosats'>{t('(GitHub).')}</Link>
          </p>
        </Typography>

        <Accordion disableGutters={true}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>{t('How does it work?')}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography component='div' variant='body2'>
              <p>
                {' '}
                {t(
                  "AnonymousAlice01 wants to sell bitcoin. She posts a sell order. BafflingBob02 wants to buy bitcoin and he takes Alice's order. Both have to post a small bond using lightning to prove they are real robots. Then, Alice posts the trade collateral also using a lightning hold invoice. RoboSats locks the invoice until Alice confirms she received the fiat, then the satoshis are released to Bob. Enjoy your satoshis, Bob!",
                )}
              </p>
              <p>
                {t(
                  'At no point, AnonymousAlice01 and BafflingBob02 have to entrust the bitcoin funds to each other. In case they have a conflict, RoboSats staff will help resolving the dispute.',
                )}
                {t('You can find a step-by-step description of the trade pipeline in ')}
                <Link target='_blank' href='https://learn.robosats.com/docs/trade-pipeline/'>
                  {t('How it works')}
                </Link>
                .{' ' + t('You can also check the full guide in ')}
                <Link target='_blank' href='https://learn.robosats.com/read/en'>
                  {t('How to use')}
                </Link>
                .
              </p>
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion disableGutters={true}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>{t('What payment methods are accepted?')}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography component='div' variant='body2'>
              <p>
                {t(
                  'All of them as long as they are fast. You can write down your preferred payment method(s). You will have to match with a peer who also accepts that method. The step to exchange fiat has a expiry time of 24 hours before a dispute is automatically open. We highly recommend using instant fiat payment rails.',
                )}{' '}
              </p>
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion disableGutters={true}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>{t('Are there trade limits?')}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography component='div' variant='body2'>
              <p>
                {t(
                  'Maximum single trade size is {{maxAmount}} Satoshis to minimize lightning routing failure. There is no limits to the number of trades per day. A robot can only have one order at a time. However, you can use multiple robots simultaneously in different browsers (remember to back up your robot tokens!).',
                  { maxAmount: pn(maxAmount) },
                )}{' '}
              </p>
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion disableGutters={true}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>{t('What are the fees?')}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography component='div' variant='body2'>
              <p>
                {t(
                  'RoboSats total fee for an order is {{tradeFee}}%. This fee is split to be covered by both: the order maker ({{makerFee}}%) and the order taker ({{takerFee}}%). In case an onchain address is used to received the Sats a variable swap fee applies. Check the exchange details by tapping on the bottom bar icon to see the current swap fee.',
                  { tradeFee: '0.2', makerFee: '0.025', takerFee: '0.175' },
                )}{' '}
              </p>
              <p>
                {t(
                  'Be aware your fiat payment provider might charge extra fees. In any case, the buyer bears the costs of sending fiat. That includes banking charges, transfer fees and foreign exchange spreads. The seller must receive exactly the amount stated in the order details.',
                )}{' '}
              </p>
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion disableGutters={true}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>{t('Is RoboSats private?')}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography component='div' variant='body2'>
              <p>
                {' '}
                {t(
                  'RoboSats will never ask you for your name, country or ID. RoboSats does not custody your funds and does not care who you are. RoboSats does not collect or custody any personal data. For best anonymity use Tor Browser and access the .onion hidden service.',
                )}{' '}
              </p>
              <p>
                {t(
                  'Your trading peer is the only one who can potentially guess anything about you. Keep your chat short and concise. Avoid providing non-essential information other than strictly necessary for the fiat payment.',
                )}{' '}
              </p>
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion disableGutters={true}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>{t('What are the risks?')}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography component='div' variant='body2'>
              <p>
                {' '}
                {t(
                  'This is an experimental application, things could go wrong. Trade small amounts!',
                )}
              </p>
              <p>
                {' '}
                {t(
                  'The seller faces the same charge-back risk as with any other peer-to-peer service. Paypal or credit cards are not recommended.',
                )}
              </p>
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion disableGutters={true}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>{t('What is the trust model?')}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography component='div' variant='body2'>
              <p>
                {' '}
                {t(
                  "The buyer and the seller never have to trust each other. Some trust on RoboSats is needed since linking the seller's hold invoice and buyer payment is not atomic (yet). In addition, disputes are solved by the RoboSats staff.",
                )}
              </p>
              <p>
                {' '}
                {t(
                  "To be totally clear. Trust requirements are minimized. However, there is still one way RoboSats could run away with your satoshis: by not releasing the satoshis to the buyer. It could be argued that such move is not in RoboSats' interest as it would damage the reputation for a small payout. However, you should hesitate and only trade small quantities at a time. For large amounts use an onchain escrow service such as Bisq",
                )}
              </p>
              <p>
                {' '}
                {t('You can build more trust on RoboSats by inspecting the source code.')}{' '}
                <Link href='https://github.com/RoboSats/robosats'> {t('Project source code')}</Link>
                .{' '}
              </p>
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion disableGutters={true}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>{t('What happens if RoboSats suddenly disappears?')}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography component='div' variant='body2'>
              <p>
                {' '}
                {t(
                  'Your sats will return to you. Any hold invoice that is not settled would be automatically returned even if RoboSats goes down forever. This is true for both, locked bonds and trading escrows. However, there is a small window between the seller confirms FIAT RECEIVED and the moment the buyer receives the satoshis when the funds could be permanently lost if RoboSats disappears. This window is about 1 second long. Make sure to have enough inbound liquidity to avoid routing failures. If you have any problem, reach out trough the RoboSats public channels.',
                )}
              </p>
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion disableGutters={true}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>{t('Is RoboSats legal in my country?')}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography component='div' variant='body2'>
              <p>
                {' '}
                {t(
                  'In many countries using RoboSats is no different than using Ebay or Craiglist. Your regulation may vary. It is your responsibility to comply.',
                )}
              </p>
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion disableGutters={true}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>{t('Disclaimer')}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography component='div' variant='body2'>
              <p>
                {' '}
                {t(
                  'This lightning application is provided as is. It is in active development: trade with the utmost caution. There is no private support. Support is only offered via public channels ',
                )}
                <Link href='https://t.me/robosats'>{t('(Telegram)')}</Link>
                {t(
                  '. RoboSats will never contact you. RoboSats will definitely never ask for your robot token.',
                )}
              </p>
            </Typography>
          </AccordionDetails>
        </Accordion>

        <DialogActions>
          <Button onClick={onClose}>{t('Close')}</Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
};

export default AboutDialog;

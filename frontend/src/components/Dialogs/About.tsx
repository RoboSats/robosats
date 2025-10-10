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

// Icons
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface Props {
  open: boolean;
  onClose: () => void;
}

const AboutDialog = ({ open, onClose }: Props): React.JSX.Element => {
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
                  'At no point, AnonymousAlice01 and BafflingBob02 have to entrust the bitcoin funds to each other. In case they have a conflict, the RoboSats coordinator will help resolving the dispute.',
                )}
                {t('You can find a step-by-step description of the trade pipeline in ')}
                <Link target='_blank' href='https://learn.robosats.org/docs/trade-pipeline/'>
                  {t('How it works')}
                </Link>
                .{' ' + t('You can also check the full guide in ')}
                <Link target='_blank' href='https://learn.robosats.org/read/en'>
                  {t('How to use')}
                </Link>
                .
              </p>
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion disableGutters={true}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>{t('What is a coordinator?')}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography component='div' variant='body2'>
              <p>
                {' '}
                {t(
                  'RoboSats is a decentralized exchange with multiple, fully redundant, trade coordinators. The coordinator provides the infrastructure for your trade: mantains the intermediary lightning node, does book keeping, and relays your encrypted chat messages. The coordinator is also the judge in case your order enters a dispute. The coordinator is a trusted role, make sure you trust your coordinator by exploring its profile, webpage, social media and the comments from other users online.',
                )}
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
                  'Each RoboSats coordinator will set a maximum trade size to minimize the hassle of lightning routing failures. There is no limits to the number of trades per day. A robot can only have one order at a time. However, you can use multiple robots simultaneously using the Robot garage. Remember to back up your robot tokens!',
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
                  'The trade fee is collected by the robosats coordinator as a compensation for their service. You can see the fees of each coordinator by checking out their profile. The trade fee is split to be covered by both: the order maker and the order taker. Typically, the maker fee will be significantly smaller than the taker fee. In case an onchain address is used to received the Sats a variable swap fee applies. The onchain payout fee can also be seen in the profile of the coordinator.',
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
                  'The RoboSats client, which you run on your local machine or browser, does not collect or share your IP address, location, name, or personal data. The client encrypts your private messages, which can only be decrypted by your trade partner.',
                )}{' '}
              </p>
              <p>
                {' '}
                {t(
                  'The coordinator you choose will maintain a database of pseudonymous robots and orders for the application to function correctly. You can further enhance your privacy by using proxy nodes or coinjoining.',
                )}{' '}
              </p>
              <p>
                {' '}
                {t(
                  'Your trade partner will not know the destination of the Lightning payment. The permanence of the data collected by the coordinators depend on their privacy and data policies. If a dispute arises, a coordinator may request additional information. The specifics of this process can vary from coordinator to coordinator.',
                )}{' '}
              </p>
              <p>
                {t(
                  'During a typical order, your trading peer is the only one who can potentially guess anything about you. Keep your chat short and concise. Avoid providing non-essential information other than strictly necessary for the fiat payment.',
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
                  "The buyer and the seller never have to trust each other. Some trust on the coordinator is needed since linking the seller's hold invoice and buyer payment is not atomic. In addition, disputes are solved by the coordinator. Make sure to select a coordinator with good reputation.",
                )}
              </p>
              <p>
                {' '}
                {t(
                  "While trust requirements are minimized, there are ways for the coordinator to run away with your satoshis: for example, by not releasing the satoshis to the buyer. It could be argued that such move is not in the coordinator's interest as it would damage the reputation for a small payout. However, you should hesitate and only trade small quantities at a time. For large amounts you can use a high reputation DAO based escrow service such as Bisq",
                )}
              </p>
              <p>
                {' '}
                {t(
                  'You can build more trust on the RoboSats and coordinator infrastructure by inspecting the source code.',
                )}{' '}
                <Link href='https://github.com/RoboSats/robosats'> {t('Project source code')}</Link>
                .{' '}
              </p>
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion disableGutters={true}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>{t('What happens if my coordinator goes offline forever?')}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography component='div' variant='body2'>
              <p>
                {' '}
                {t(
                  'Your sats will return to you. Any hold invoice that is not settled would be automatically returned even if the coordinator goes down forever. This is true for both, locked bonds and trading escrows. However, there is a small window between the seller confirms FIAT RECEIVED and the moment the buyer receives the satoshis when the funds could be permanently lost if the coordinator disappears. This window is usually about 1 second long. Make sure to have enough inbound liquidity to avoid routing failures. If you have any problem, reach out trough the RoboSats public channels or directly to your trade coordinator using one of the contact methods listed on their profile.',
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
                <Link href='https://simplex.chat/contact/#/?v=1-2&smp=smp%3A%2F%2F0YuTwO05YJWS8rkjn9eLJDjQhFKvIYd8d4xG8X1blIU%3D%40smp8.simplex.im%2FyEX_vdhWew_FkovCQC3mRYRWZB1j_cBq%23%2F%3Fv%3D1-2%26dh%3DMCowBQYDK2VuAyEAnrf9Jw3Ajdp4EQw71kqA64VgsIIzw8YNn68WjF09jFY%253D%26srv%3Dbeccx4yfxxbvyhqypaavemqurytl6hozr47wfc7uuecacjqdvwpw2xid.onion&data=%7B%22type%22%3A%22group%22%2C%22groupLinkId%22%3A%22hWnMVPnJl-KT3-virDk0JA%3D%3D%22%7D'>
                  {t('(SimpleX)')}
                </Link>
                {t(
                  '. RoboSats developers will never contact you. The developers or the coordinators will definitely never ask for your robot token.',
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

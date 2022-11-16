import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Grid, Typography, Tooltip, Collapse, IconButton } from '@mui/material';
import currencies from '../../../../static/assets/currencies.json';

import { Order } from '../../../models';
import { pn } from '../../../utils';
import { WifiTetheringError } from '@mui/icons-material';
import EncryptedChat, { EncryptedChatMessage } from '../EncryptedChat';
import Countdown, { zeroPad } from 'react-countdown';
import { LoadingButton } from '@mui/lab';

interface ChatPromptProps {
  order: Order;
  onClickConfirmSent: () => void;
  loadingSent: boolean;
  onClickConfirmReceived: () => void;
  loadingReceived: boolean;
  onClickDispute: () => void;
  loadingDispute: boolean;
  baseUrl: string;
  messages: EncryptedChatMessage[];
  setMessages: (state: EncryptedChatMessage[]) => void;
}

export const ChatPrompt = ({
  order,
  onClickConfirmSent,
  onClickConfirmReceived,
  loadingSent,
  loadingReceived,
  onClickDispute,
  loadingDispute,
  baseUrl,
  messages,
  setMessages,
}: ChatPromptProps): JSX.Element => {
  const { t } = useTranslation();

  const [turtleMode, setTurtleMode] = useState<boolean>(window.ReactNativeWebView !== undefined);
  const [sentButton, setSentButton] = useState<boolean>(false);
  const [receivedButton, setReceivedButton] = useState<boolean>(false);
  const [enableDisputeButton, setEnableDisputeButton] = useState<boolean>(false);
  const [enableDisputeTime, setEnableDisputeTime] = useState<Date>(new Date(order.expires_at));
  const [text, setText] = useState<string>('');

  const currencyCode: string = currencies[`${order.currency}`];
  const amount: string = pn(
    parseFloat(parseFloat(order.amount).toFixed(order.currency == 1000 ? 8 : 4)),
  );

  const disputeCountdownRenderer = function ({ hours, minutes }) {
    return (
      <span>{`${t('To open a dispute you need to wait')} ${hours}h ${zeroPad(minutes)}m `}</span>
    );
  };

  useEffect(() => {
    // open dispute button enables 12h before expiry
    const now = Date.now();
    const expires_at = new Date(order.expires_at);
    setEnableDisputeButton(now > expires_at);
    setEnableDisputeTime(expires_at.getHours() - 12);

    if (order.status == 9) {
      // No fiat sent yet
      if (order.is_buyer) {
        setSentButton(true);
        setReceivedButton(false);
        setText(
          t(
            "Say hi! Ask for payment details and click 'Confirm Sent' as soon as the payment is sent.",
          ),
        );
      } else {
        setSentButton(false);
        setReceivedButton(false);
        setText(
          t(
            'Say hi! Be helpful and concise. Let them know how to send you {{amount}} {{currencyCode}}.',
            {
              currencyCode,
              amount,
            },
          ),
        );
      }
    } else if (order.status == 10) {
      // Fiat has been sent already
      if (order.is_buyer) {
        setSentButton(false);
        setReceivedButton(false);
        setText(t('Wait for the seller to confirm he has received the payment.'));
      } else {
        setSentButton(false);
        setReceivedButton(true);
        setText(t("The buyer has sent the fiat. Click 'Confirm Received' once you receive it."));
      }
    }
  }, [order]);

  return (
    <Grid container spacing={1}>
      {window.ReactNativeWebView === undefined ? (
        <Grid item xs={12}>
          <Tooltip
            enterTouchDelay={0}
            placement='top'
            title={t('Activate slow mode (use it when the connection is slow)')}
          >
            <IconButton
              size='small'
              color={turtleMode ? 'primary' : 'inherit'}
              onClick={() => setTurtleMode(!turtleMode)}
            >
              <WifiTetheringError sx={{ color: 'text.secondary' }} />
            </IconButton>
          </Tooltip>
        </Grid>
      ) : (
        <></>
      )}
      <Grid item xs={12}>
        <Typography variant='body2' align='center'>
          {text}
        </Typography>
      </Grid>

      <EncryptedChat
        turtleMode={turtleMode}
        chatOffset={order.chat_last_index}
        orderId={order.id}
        takerNick={order.taker_nick}
        makerNick={order.maker_nick}
        userNick={order.ur_nick}
        baseUrl={baseUrl}
        messages={messages}
        setMessages={setMessages}
      />
      <Grid item xs={12}>
        <Tooltip
          placement='top'
          componentsProps={{
            tooltip: { sx: { position: 'relative', top: '3em' } },
          }}
          disableHoverListener={enableDisputeButton}
          disableTouchListener={enableDisputeButton}
          enterTouchDelay={0}
          title={<Countdown date={enableDisputeTime} renderer={disputeCountdownRenderer} />}
        >
          <Grid item xs={12}>
            <LoadingButton
              loading={loadingDispute}
              disabled={!enableDisputeButton}
              color='inherit'
              onClick={onClickDispute}
            >
              {t('Open Dispute')}
            </LoadingButton>
          </Grid>
        </Tooltip>
        <Collapse in={sentButton}>
          <LoadingButton
            loading={loadingSent}
            variant='contained'
            color='secondary'
            onClick={onClickConfirmSent}
          >
            {t('Confirm {{amount}} {{currencyCode}} sent', { currencyCode, amount })}
          </LoadingButton>
        </Collapse>
        <Collapse in={receivedButton}>
          <LoadingButton
            loading={loadingReceived}
            variant='contained'
            color='secondary'
            onClick={onClickConfirmReceived}
          >
            {t('Confirm {{amount}} {{currencyCode}} received', { currencyCode, amount })}
          </LoadingButton>
        </Collapse>
      </Grid>
    </Grid>
  );
};

export default ChatPrompt;

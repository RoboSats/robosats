import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Grid, Typography, Tooltip, Collapse } from '@mui/material';
import currencies from '../../../../static/assets/currencies.json';

import { type Order } from '../../../models';
import { pn } from '../../../utils';
import EncryptedChat, { type EncryptedChatMessage } from '../EncryptedChat';
import Countdown, { zeroPad } from 'react-countdown';
import { LoadingButton } from '@mui/lab';
import { type UseGarageStoreType, GarageContext } from '../../../contexts/GarageContext';

interface ChatPromptProps {
  order: Order;
  onClickConfirmSent: () => void;
  onClickUndoConfirmSent: () => void;
  loadingSent: boolean;
  loadingUndoSent: boolean;
  onClickConfirmReceived: () => void;
  loadingReceived: boolean;
  onClickDispute: () => void;
  loadingDispute: boolean;
  messages: EncryptedChatMessage[];
  setMessages: (state: EncryptedChatMessage[]) => void;
}

export const ChatPrompt = ({
  order,
  onClickConfirmSent,
  onClickUndoConfirmSent,
  onClickConfirmReceived,
  loadingSent,
  loadingUndoSent,
  loadingReceived,
  onClickDispute,
  loadingDispute,
  messages,
  setMessages,
}: ChatPromptProps): React.JSX.Element => {
  const { t } = useTranslation();
  const { slotUpdatedAt } = useContext<UseGarageStoreType>(GarageContext);

  const [sentButton, setSentButton] = useState<boolean>(false);
  const [receivedButton, setReceivedButton] = useState<boolean>(false);
  const [undoSentButton, setUndoSentButton] = useState<boolean>(false);
  const [enableDisputeButton, setEnableDisputeButton] = useState<boolean>(false);
  const [enableDisputeTime, setEnableDisputeTime] = useState<Date>(new Date(order.expires_at));
  const [text, setText] = useState<string>('');
  const [showWarning, setShowWarning] = useState<boolean>(false);

  const currencyCode: string = currencies[`${order.currency}`];
  const amount: string = pn(
    Number(parseFloat(order.amount ?? 0).toFixed(order.currency === 1000 ? 8 : 4)),
  );

  const disputeCountdownRenderer = function ({
    hours,
    minutes,
  }: {
    hours: number;
    minutes: number;
  }): React.JSX.Element {
    return (
      <span>{`${t('To open a dispute you need to wait')} ${hours}h ${zeroPad(minutes)}m `}</span>
    );
  };

  useEffect(() => {
    // open dispute button enables 18h before expiry
    const now = Date.now();
    const expiresAt = new Date(order.expires_at);
    expiresAt.setHours(expiresAt.getHours() - 18);
    setEnableDisputeButton(now > expiresAt);
    setEnableDisputeTime(expiresAt);

    if (order.status === 9) {
      // No fiat sent yet
      if (order.is_buyer) {
        setSentButton(true);
        setReceivedButton(false);
        setUndoSentButton(false);
        setText(
          t(
            "Say hi! Ask for payment details and click 'Confirm Sent' as soon as the payment is sent.",
          ),
        );
      } else {
        setSentButton(false);
        setUndoSentButton(false);
        setReceivedButton(false);
        setShowWarning(true);
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
    } else if (order.status === 10) {
      // Fiat has been sent already
      if (order.is_buyer) {
        setSentButton(false);
        setUndoSentButton(true);
        setReceivedButton(false);
        setText(t('Wait for the seller to confirm he has received the payment.'));
      } else {
        setSentButton(false);
        setUndoSentButton(false);
        setReceivedButton(true);
        setText(t("The buyer has sent the fiat. Click 'Confirm Received' once you receive it."));
      }
    }
  }, [slotUpdatedAt]);

  return (
    <Grid
      container
      padding={0}
      direction='column'
      justifyContent='flex-start'
      alignItems='center'
      spacing={0}
    >
      <Grid item>
        <Typography variant='body2' align='center'>
          {text}{' '}
          {showWarning ? (
            <>
              {'⚠️ '}
              <a
                href='https://robosats.org/docs/payment-methods/#scams'
                target='_blank'
                rel='noreferrer'
              >
                {t('Beware scams')}
              </a>
            </>
          ) : (
            ''
          )}
        </Typography>
      </Grid>

      <Grid item>
        <EncryptedChat
          status={order.status}
          chatOffset={order.chat_last_index}
          order={order}
          messages={messages}
          setMessages={setMessages}
        />
      </Grid>

      <Grid item>
        <Tooltip
          placement='top'
          componentsProps={{
            tooltip: { sx: { position: 'relative', top: '3em' } },
          }}
          disableHoverListener={enableDisputeButton}
          disableTouchListener={enableDisputeButton}
          enterTouchDelay={0}
          title={
            <Countdown date={new Date(enableDisputeTime)} renderer={disputeCountdownRenderer} />
          }
        >
          <div>
            <LoadingButton
              loading={loadingDispute}
              disabled={!enableDisputeButton}
              color='inherit'
              onClick={onClickDispute}
            >
              {t('Open Dispute')}
            </LoadingButton>
          </div>
        </Tooltip>
      </Grid>
      <Grid item padding={0.5}>
        {sentButton ? (
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
        ) : (
          <></>
        )}
        {undoSentButton ? (
          <Collapse in={undoSentButton}>
            <LoadingButton
              size='small'
              sx={{ color: 'text.secondary' }}
              loading={loadingUndoSent}
              onClick={onClickUndoConfirmSent}
            >
              {t('Payment failed?')}
            </LoadingButton>
          </Collapse>
        ) : (
          <></>
        )}
        {receivedButton ? (
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
        ) : (
          <></>
        )}
      </Grid>
    </Grid>
  );
};

export default ChatPrompt;

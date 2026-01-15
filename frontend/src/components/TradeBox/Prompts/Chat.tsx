import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Grid,
  Typography,
  Tooltip,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import currencies from '../../../../static/assets/currencies.json';

import { type Order } from '../../../models';
import { pn, saveAsJson } from '../../../utils';
import EncryptedChat, { type EncryptedChatMessage } from '../EncryptedChat';
import Countdown, { zeroPad } from 'react-countdown';
import { LoadingButton } from '@mui/lab';
import { type UseGarageStoreType, GarageContext } from '../../../contexts/GarageContext';
import { MoreHoriz, Key, Handshake, Balance } from '@mui/icons-material';
import AuditPGPDialog from '../../Dialogs/AuditPGP';
import { ExportIcon } from '../../Icons';
import { UseAppStoreType, AppContext } from '../../../contexts/AppContext';

interface ChatPromptProps {
  order: Order;
  onClickConfirmSent: () => void;
  onClickUndoConfirmSent: () => void;
  onClickCollabCancel: () => void;
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
  onClickCollabCancel,
  loadingSent,
  loadingUndoSent,
  loadingReceived,
  onClickDispute,
  loadingDispute,
  messages,
  setMessages,
}: ChatPromptProps): React.JSX.Element => {
  const { t } = useTranslation();
  const { garage } = useContext<UseGarageStoreType>(GarageContext);
  const { client, slotUpdatedAt } = useContext<UseAppStoreType>(AppContext);

  const [sentButton, setSentButton] = useState<boolean>(false);
  const [receivedButton, setReceivedButton] = useState<boolean>(false);
  const [undoSentButton, setUndoSentButton] = useState<boolean>(false);
  const [audit, setAudit] = useState<boolean>(false);
  const [peerPubKey, setPeerPubKey] = useState<string>();
  const [enableCollaborativeButton, setEnableCollaborativeButton] = useState<boolean>(false);
  const [enableDisputeButton, setEnableDisputeButton] = useState<boolean>(false);
  const [enableDisputeTime, setEnableDisputeTime] = useState<Date>(new Date(order.expires_at));
  const [text, setText] = useState<string>('');
  const [openOrderOptions, setOpenOrderOptions] = useState<boolean>(false);

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
      setEnableCollaborativeButton(true);

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
        setReceivedButton(true);
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
      setEnableCollaborativeButton(false);

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

  const createJsonFile = (): object => {
    return {
      credentials: {
        own_public_key: garage.getSlot()?.getRobot()?.pubKey,
        peer_public_key: peerPubKey,
        encrypted_private_key: garage.getSlot()?.getRobot()?.encPrivKey,
        passphrase: garage.getSlot()?.token,
      },
      messages,
    };
  };

  return (
    <Grid
      container
      padding={0}
      direction='column'
      justifyContent='flex-start'
      alignItems='center'
      spacing={0}
    >
      <Grid item style={{ mb: 1 }}>
        <Typography variant='body2' align='center'>
          {text} <br />
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
        </Typography>
      </Grid>

      <Grid item>
        <EncryptedChat
          chatOffset={order.chat_last_index}
          order={order}
          messages={messages}
          setMessages={setMessages}
          peerPubKey={peerPubKey}
          setPeerPubKey={setPeerPubKey}
        />
      </Grid>

      <Grid
        item
        direction='row'
        sx={{ width: '100%', display: 'flex', justifyContent: 'space-around', mt: 2.5 }}
      >
        <Button
          size='large'
          color='primary'
          variant='outlined'
          aria-label='open options'
          onClick={() => setOpenOrderOptions(true)}
        >
          <MoreHoriz />
        </Button>
        {sentButton ? (
          <LoadingButton
            loading={loadingSent}
            variant='contained'
            color='secondary'
            onClick={onClickConfirmSent}
          >
            {t('Confirm {{amount}} {{currencyCode}} sent', { currencyCode, amount })}
          </LoadingButton>
        ) : (
          <></>
        )}
        {undoSentButton ? (
          <LoadingButton
            size='small'
            sx={{ color: 'text.secondary' }}
            loading={loadingUndoSent}
            onClick={onClickUndoConfirmSent}
          >
            {t('Payment failed?')}
          </LoadingButton>
        ) : (
          <></>
        )}
        {receivedButton ? (
          <LoadingButton
            loading={loadingReceived}
            variant='contained'
            color='secondary'
            onClick={onClickConfirmReceived}
            disabled={order.status < 10}
          >
            {t('Confirm {{amount}} {{currencyCode}} received', { currencyCode, amount })}
          </LoadingButton>
        ) : (
          <></>
        )}
      </Grid>
      <Dialog
        open={openOrderOptions}
        onClose={() => {
          setOpenOrderOptions(false);
        }}
        aria-labelledby='order-options-dialog-title'
        aria-describedby='order-options-description'
      >
        <DialogTitle>{t('Order options')}</DialogTitle>
        <DialogContent>
          <DialogContent>
            <Grid container direction='column' alignItems='center' spacing={1} padding={2}>
              <Grid item xs={1} style={{ width: '100%' }}>
                <Button
                  fullWidth
                  disabled={false}
                  onClick={() => setAudit(true)}
                  variant='contained'
                  color='primary'
                  size='large'
                  startIcon={<Key />}
                >
                  {t('Audit Chat')}
                </Button>
              </Grid>

              <Grid item xs={1} style={{ width: '100%', marginTop: 20 }}>
                <Button
                  fullWidth
                  onClick={() =>
                    saveAsJson(`complete_log_chat_${order.id}.json`, createJsonFile(), client)
                  }
                  variant='contained'
                  color='primary'
                  size='large'
                  startIcon={<ExportIcon />}
                >
                  {t('Export')}
                </Button>
              </Grid>
              <Tooltip
                placement='top'
                enterTouchDelay={0}
                title={
                  <Countdown
                    date={new Date(enableDisputeTime)}
                    renderer={disputeCountdownRenderer}
                  />
                }
              >
                <Grid item xs={1} style={{ width: '100%', marginTop: 20 }}>
                  <Button
                    fullWidth
                    loading={loadingDispute}
                    disabled={!enableDisputeButton}
                    color='warning'
                    variant='contained'
                    size='large'
                    onClick={() => {
                      setOpenOrderOptions(false);
                      onClickDispute();
                    }}
                    startIcon={<Balance />}
                  >
                    {t('Open Dispute')}
                  </Button>
                </Grid>
              </Tooltip>

              <Tooltip
                placement='top'
                enterTouchDelay={0}
                title={t("Orders can't be cancelled if fiat has been sent.")}
              >
                <Grid item xs={1} style={{ width: '100%', marginTop: 20 }}>
                  <Button
                    fullWidth
                    onClick={() => {
                      setOpenOrderOptions(false);
                      onClickCollabCancel();
                    }}
                    size='large'
                    variant='contained'
                    color='secondary'
                    startIcon={<Handshake />}
                    disabled={!enableCollaborativeButton}
                  >
                    {t('Collaborative Cancel')}
                  </Button>
                </Grid>
              </Tooltip>
            </Grid>
          </DialogContent>
        </DialogContent>
      </Dialog>

      <AuditPGPDialog
        open={audit}
        onClose={() => {
          setAudit(false);
        }}
        order={order}
        messages={messages}
        peerPubKey={peerPubKey ?? ''}
        onClickBack={() => {
          setAudit(false);
        }}
      />
    </Grid>
  );
};

export default ChatPrompt;

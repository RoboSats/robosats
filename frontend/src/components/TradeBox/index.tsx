import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Collapse, Divider, Grid } from '@mui/material';

import { apiClient } from '../../services/api';
import { getWebln } from '../../utils';

import {
  ConfirmCancelDialog,
  ConfirmCollabCancelDialog,
  ConfirmDisputeDialog,
  ConfirmFiatReceivedDialog,
  WebLNDialog,
} from './Dialogs';

import Title from './Title';
import { LockInvoicePrompt, TakerFoundPrompt, PublicWaitPrompt } from './Prompts';
import BondStatus from './BondStatus';
import CancelButton from './CancelButton';

import { Order } from '../../models';

// const audio = {
//   chat: new Audio(`/static/assets/sounds/chat-open.mp3`),
//   takerFound: new Audio(`/static/assets/sounds/taker-found.mp3`),
//   lockedInvoice: new Audio(`/static/assets/sounds/locked-invoice.mp3`),
//   successful: new Audio(`/static/assets/sounds/successful.mp3`),
// };

interface loadingButtonsProps {
  cancel: boolean;
  fiatSent: boolean;
  fiatReceived: boolean;
  submitInvoice: boolean;
  submitAddress: boolean;
  openDispute: boolean;
  pauseOrder: boolean;
}

const noLoadingButtons: loadingButtonsProps = {
  cancel: false,
  fiatSent: false,
  fiatReceived: false,
  submitInvoice: false,
  submitAddress: false,
  openDispute: false,
  pauseOrder: false,
};

interface OpenDialogProps {
  confirmCancel: boolean;
  confirmCollabCancel: boolean;
  confirmFiatReceived: boolean;
  confirmDispute: boolean;
  webln: boolean;
}

const closeAll: OpenDialogProps = {
  confirmCancel: false,
  confirmCollabCancel: false,
  confirmFiatReceived: false,
  confirmDispute: false,
  webln: false,
};

interface OnchainFormProps {
  address: string;
  miningFee: number;
  badAddress: string;
}

interface LightningFormProps {
  invoice: string;
  routingBudget: number;
  badInvoice: string;
  useLnproxy: boolean;
  lnproxyServer: string;
  lnproxyBudget: number;
  badLnproxy: string;
}

const defaultOnchain: OnchainFormProps = {
  address: '',
  miningFee: 140,
  badAddress: '',
};

const defaultLightning: LightningFormProps = {
  invoice: '',
  routingBudget: 0,
  badInvoice: '',
  useLnproxy: false,
  lnproxyServer: '',
  lnproxyBudget: 0,
  badLnproxy: '',
};

interface TradeBoxProps {
  order: Order;
  setOrder: (state: Order) => void;
  setBadRequest: (state: stirng) => void;
  baseUrl: string;
}

const TradeBox = ({ order, setOrder, baseUrl, setBadRequest }: TradeBoxProps): JSX.Element => {
  const { t } = useTranslation();

  // Buttons and Dialogs
  const [loadingButtons, setLoadingButtons] = useState<loadingButtonsProps>(noLoadingButtons);
  const [open, setOpen] = useState<OpenDialogProps>(closeAll);
  const [waitingWebln, setWaitingWebln] = useState<boolean>(false);
  const [lastOrderStatus, setLastOrderStatus] = useState<number>(-1);

  // Forms
  const [onchain, setOnchain] = useState<OnchainFormProps>(defaultOnchain);
  const [lightning, setLightning] = useState<LightningFormProps>(defaultLightning);
  const [statement, setStatement] = useState<string>('');

  // Sounds
  // useEffect(() => {
  //   if (order.status) {
  //     if (order.status === 1) {
  //       audio.lockedInvoice.play();
  //     }
  //   }
  // }, [order.status]);

  const submitAction = function (action: string, invoice?: string) {
    console.log(action, invoice);
    apiClient
      .post(baseUrl, '/api/order/?order_id=' + order.id, { action, invoice })
      .then((data: Order | undefined) => {
        if (data.bad_request) {
          setBadRequest(data.bad_request);
        } else {
          setOrder({ ...order, ...data });
          setBadRequest(undefined);
        }
        setOpen(closeAll);
        setLoadingButtons({ ...noLoadingButtons });
      });
  };

  const cancel = function () {
    setLoadingButtons({ ...noLoadingButtons, cancel: true });
    submitAction('cancel');
  };

  const openDispute = function () {
    setLoadingButtons({ ...noLoadingButtons, openDispute: true });
    submitAction('dispute');
  };

  const confirmFiatReceived = function () {
    setLoadingButtons({ ...noLoadingButtons, fiatReceived: true });
    submitAction('confirm');
  };

  const updateInvoice = function (invoice: string) {
    setLoadingButtons({ ...noLoadingButtons, submitInvoice: true });
    submitAction('update_invoice', invoice);
  };

  const pauseOrder = function () {
    setLoadingButtons({ ...noLoadingButtons, pauseOrder: true });
    submitAction('pause');
  };

  const handleWebln = async (order: Order) => {
    const webln = await getWebln();
    // If Webln implements locked payments compatibility, this logic might be simplier
    if (order.is_maker && order.status == 0) {
      webln.sendPayment(order.bond_invoice);
      setWaitingWebln(true);
      setOpen({ ...open, webln: true });
    } else if (order.is_taker && order.status == 3) {
      webln.sendPayment(order.bond_invoice);
      setWaitingWebln(true);
      setOpen({ ...open, webln: true });
    } else if (order.is_seller && (order.status == 6 || order.status == 7)) {
      webln.sendPayment(order.escrow_invoice);
      setWaitingWebln(true);
      setOpen({ ...open, webln: true });
    } else if (order.is_buyer && (order.status == 6 || order.status == 8)) {
      setWaitingWebln(true);
      setOpen({ ...open, webln: true });
      webln
        .makeInvoice(order.trade_satoshis)
        .then((invoice: any) => {
          if (invoice) {
            updateInvoice(invoice.paymentRequest);
            setWaitingWebln(false);
            setOpen(closeAll);
          }
        })
        .catch(() => {
          setWaitingWebln(false);
          setOpen(closeAll);
        });
    } else {
      setWaitingWebln(false);
    }
  };

  // Effect on Order Status change (used for WebLN)
  useEffect(() => {
    if (order.status != lastOrderStatus) {
      setLastOrderStatus(order.status);
      handleWebln(order);
    }
  }, [order.status]);

  // SHOW IF THE USER OR CONTERPART ASKED FOR CANCEL BELOW THE BOND STATUS!!!

  // {/* If the counterparty asked for collaborative cancel */}
  // {order.pending_cancel ? (
  //   <>
  //     <Divider />
  //     <Grid item xs={12} align='center'>
  //       <Alert severity='warning' sx={{ maxWidth: 360 }}>
  //         {t('{{nickname}} is asking for a collaborative cancel', {
  //           nickname: order.is_maker ? order.taker_nick : order.maker_nick,
  //         })}
  //       </Alert>
  //     </Grid>
  //   </>
  // ) : null}

  // {/* If the user has asked for a collaborative cancel */}
  // {order.asked_for_cancel ? (
  //   <>
  //     <Divider />
  //     <Grid item xs={12} align='center'>
  //       <Alert severity='warning' sx={{ maxWidth: 360 }}>
  //         {t('You asked for a collaborative cancellation')}
  //       </Alert>
  //     </Grid>
  //   </>
  // ) : null}

  console.log(order.status);
  const Steps = [
    // 0: 'Waiting for maker bond'
    {
      isMaker: {
        title: '',
        prompt: () => {
          return <LockInvoicePrompt order={order} concept={'bond'} />;
        },
        bondStatus: 'hide',
      },
      isTaker: {
        title: '',
        prompt: <></>,
        bondStatus: 'hide',
      },
    },
    // 1: 'Public'
    {
      isMaker: {
        title: '',
        prompt: () => {
          return (
            <PublicWaitPrompt
              order={order}
              pauseLoading={loadingButtons.pauseOrder}
              onClickPauseOrder={pauseOrder}
            />
          );
        },
        bondStatus: 'locked',
      },
      isTaker: {
        title: '',
        prompt: <></>,
        bondStatus: 'hide',
      },
    },
    // 2: 'Paused'

    // 3: 'Waiting for taker bond'

    // 4: 'Cancelled'
    // 5: 'Expired'
    // 6: 'Waiting for trade collateral and buyer invoice'
    // 7: 'Waiting only for seller trade collateral'
    // 8: 'Waiting only for buyer invoice'
    // 9: 'Sending fiat - In chatroom'
    // 10: 'Fiat sent - In chatroom'
    // 11: 'In dispute'
    // 12: 'Collaboratively cancelled'
    // 13: 'Sending satoshis to buyer'
    // 14: 'Sucessful trade'
    // 15: 'Failed lightning network routing'
    // 16: 'Wait for dispute resolution'
    // 17: 'Maker lost dispute'
    // 18: 'Taker lost dispute'
  ];

  const StepContent = Steps[order.status][order.is_maker ? 'isMaker' : 'isTaker'];

  return (
    <Box>
      <WebLNDialog
        open={open.webln}
        onClose={() => setOpen(closeAll)}
        waitingWebln={waitingWebln}
        isBuyer={order.is_buyer}
      />
      <ConfirmDisputeDialog
        open={open.confirmDispute}
        onClose={() => setOpen(closeAll)}
        onAgreeClick={openDispute}
      />
      <ConfirmCancelDialog
        open={open.confirmCancel}
        onClose={() => setOpen(closeAll)}
        onCancelClick={cancel}
      />
      <ConfirmCollabCancelDialog
        open={open.confirmCollabCancel}
        onClose={() => setOpen(closeAll)}
        onCollabCancelClick={cancel}
        peerAskedCancel={order.pending_cancel}
      />
      <ConfirmFiatReceivedDialog
        open={open.confirmFiatReceived}
        order={order}
        loadingButton={loadingButtons.fiatReceived}
        onClose={() => setOpen(closeAll)}
        onConfirmClick={confirmFiatReceived}
      />
      <Grid
        container
        padding={1}
        direction='column'
        justifyContent='flex-start'
        alignItems='center'
        spacing={0}
      >
        <Grid item>
          <Title order={order} />
        </Grid>
        <Divider />
        <Grid item>
          <StepContent.prompt />
        </Grid>

        {StepContent.bondStatus != 'hide' ? (
          <Grid item sx={{ width: '100%' }}>
            <Divider />
            <BondStatus status={StepContent.bondStatus} isMaker={order.is_maker} />
          </Grid>
        ) : (
          <></>
        )}

        {/* // SHOW IF THE USER OR CONTERPART ASKED FOR CANCEL BELOW THE BOND STATUS!!! */}
        {/* Participants can see the "Cancel" Button, but cannot see the "Back" or "Take Order" buttons */}

        <Grid item>
          <CancelButton
            order={order}
            onClickCancel={cancel}
            openCancelDialog={() => setOpen({ ...closeAll, confirmCancel: true })}
            openCollabCancelDialog={() => setOpen({ ...closeAll, confirmCollabCancel: true })}
            loading={loadingButtons.cancel}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default TradeBox;

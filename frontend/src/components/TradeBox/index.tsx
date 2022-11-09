import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Collapse, Divider, Grid } from '@mui/material';

import { systemClient } from '../../services/System';
import { apiClient } from '../../services/api';
import {
  ConfirmCancelDialog,
  ConfirmCollabCancelDialog,
  ConfirmDisputeDialog,
  ConfirmFiatReceivedDialog,
} from './Dialogs';

import Title from './Title';
import { LockInvoicePrompt, TakerFoundPrompt } from './Prompts';
import BondStatus from './BondStatus';
import CancelButton from './CancelButton';

import { Order } from '../../models';

const audio = {
  chat: new Audio(`/static/assets/sounds/chat-open.mp3`),
  takerFound: new Audio(`/static/assets/sounds/taker-found.mp3`),
  lockedInvoice: new Audio(`/static/assets/sounds/locked-invoice.mp3`),
  successful: new Audio(`/static/assets/sounds/successful.mp3`),
};

interface loadingButtonsProps {
  cancel: boolean;
  fiatSent: boolean;
  fiatReceived: boolean;
  submitInvoice: boolean;
  submitAddress: boolean;
  openDispute: boolean;
}

const noLoadingButtons: loadingButtonsProps = {
  cancel: false,
  fiatSent: false,
  fiatReceived: false,
  submitInvoice: false,
  submitAddress: false,
  openDispute: false,
};

interface OpenDialogProps {
  confirmCancel: boolean;
  confirmCollabCancel: boolean;
  confirmFiatReceived: boolean;
  confirmDispute: boolean;
}

const closeAll: OpenDialogProps = {
  confirmCancel: false,
  confirmCollabCancel: false,
  confirmFiatReceived: false,
  confirmDispute: false,
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
  baseUrl: string;
}

const TradeBox = ({ order, setOrder, baseUrl }: TradeBoxProps): JSX.Element => {
  const { t } = useTranslation();

  // Buttons and Dialogs
  const [loadingButtons, setLoadingButtons] = useState<loadingButtonsProps>(noLoadingButtons);
  const [open, setOpen] = useState<OpenDialogProps>(closeAll);

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

  const submitAction = function (action: string) {
    apiClient
      .post(baseUrl, '/api/order/?order_id=' + order.id, { action })
      .then((data: Order | undefined) => {
        setOrder({ ...order, ...data });
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
        spacing={1}
      >
        <Grid item>
          <Title order={order} />
        </Grid>
        <Divider />
        <Grid item>
          <StepContent.prompt />
        </Grid>
        <Grid item>
          <Collapse in={StepContent.bondStatus != 'hide'}>
            <Divider />
            <BondStatus status={StepContent.bondStatus} isMaker={order.is_maker} />
          </Collapse>
        </Grid>

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

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Divider, Grid } from '@mui/material';

import { apiClient } from '../../services/api';
import { getWebln, pn } from '../../utils';

import {
  ConfirmCancelDialog,
  ConfirmCollabCancelDialog,
  ConfirmDisputeDialog,
  ConfirmFiatReceivedDialog,
  WebLNDialog,
} from './Dialogs';

import Title from './Title';
import {
  LockInvoicePrompt,
  TakerFoundPrompt,
  PublicWaitPrompt,
  PausedPrompt,
  ExpiredPrompt,
  PayoutPrompt,
} from './Prompts';
import BondStatus from './BondStatus';
import CancelButton from './CancelButton';
import { defaultLightning, LightningForm, defaultOnchain, OnchainForm } from './Forms';

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
  renewOrder: boolean;
}

const noLoadingButtons: loadingButtonsProps = {
  cancel: false,
  fiatSent: false,
  fiatReceived: false,
  submitInvoice: false,
  submitAddress: false,
  openDispute: false,
  pauseOrder: false,
  renewOrder: false,
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

interface TradeBoxProps {
  order: Order;
  setOrder: (state: Order) => void;
  setBadRequest: (state: string | undefined) => void;
  onRenewOrder: () => void;
  baseUrl: string;
}

const TradeBox = ({
  order,
  setOrder,
  baseUrl,
  setBadRequest,
  onRenewOrder,
}: TradeBoxProps): JSX.Element => {
  const { t } = useTranslation();

  // Buttons and Dialogs
  const [loadingButtons, setLoadingButtons] = useState<loadingButtonsProps>(noLoadingButtons);
  const [open, setOpen] = useState<OpenDialogProps>(closeAll);
  const [waitingWebln, setWaitingWebln] = useState<boolean>(false);
  const [lastOrderStatus, setLastOrderStatus] = useState<number>(-1);

  // Forms
  const [onchain, setOnchain] = useState<OnchainForm>(defaultOnchain);
  const [lightning, setLightning] = useState<LightningForm>(defaultLightning);
  const [statement, setStatement] = useState<string>('');

  // Sounds
  // useEffect(() => {
  //   if (order.status) {
  //     if (order.status === 1) {
  //       audio.lockedInvoice.play();
  //     }
  //   }
  // }, [order.status]);

  const submitAction = function (
    action: string,
    invoice?: string,
    address?: string,
    mining_fee_rate?: number,
  ) {
    apiClient
      .post(baseUrl, '/api/order/?order_id=' + order.id, {
        action,
        invoice,
        address,
        mining_fee_rate,
      })
      .catch(() => {
        setOpen(closeAll);
        setLoadingButtons({ ...noLoadingButtons });
      })
      .then((data: Order | undefined) => {
        if (data.bad_request) {
          if (action == 'update_invoice') {
            setLightning({ ...lightning, badInvoice: data.bad_request });
          } else if (action == 'update_address') {
            setOnchain({ ...onchain, badAddress: data.bad_request });
          } else {
            setBadRequest(data.bad_request);
          }
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

  const updateAddress = function (address: string, mining_fee_rate: number) {
    setLoadingButtons({ ...noLoadingButtons, submitAddress: true });
    submitAction('update_address', onchain.address, onchain.miningFee);
  };

  const pauseOrder = function () {
    setLoadingButtons({ ...noLoadingButtons, pauseOrder: true });
    submitAction('pause');
  };

  const handleWebln = async (order: Order) => {
    const webln = await getWebln().catch(() => console.log('Web LN not available'));
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

  const statusToContract = function (order: Order) {
    const status = order.status;
    const isBuyer = order.is_buyer;
    const isMaker = order.is_maker;

    let title: string = 'Unknown Order Status';
    let titleVariables: object = {};
    let titleColor: string = 'primary';
    let prompt = () => <span>Wops!</span>;
    let bondStatus: 'hide' | 'lockec' | 'unlocked' | 'settled' = 'hide';

    if (status == 0) {
      // 0: 'Waiting for maker bond'
      if (isMaker) {
        return {
          title: 'Lock {{amountSats}} Sats to PUBLISH order',
          titleVariables: { amountSats: pn(order.bond_satoshis) },
          prompt: () => {
            return <LockInvoicePrompt order={order} concept={'bond'} />;
          },
          bondStatus: 'hide',
        };
      }
    } else if (status == 1) {
      // 1: 'Public'
      if (isMaker) {
        return {
          title: 'Your order is public',
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
        };
      }
    } else if (status == 2) {
      // 2: 'Paused'
      if (isMaker) {
        return {
          title: 'Your order is paused',
          prompt: () => {
            return (
              <PausedPrompt
                pauseLoading={loadingButtons.pauseOrder}
                onClickResumeOrder={pauseOrder}
              />
            );
          },
          bondStatus: 'locked',
        };
      }
    } else if (status == 3) {
      // 3: 'Waiting for taker bond'
      if (isMaker) {
        return {
          title: 'A taker has been found!',
          prompt: () => {
            return <TakerFoundPrompt />;
          },
          bondStatus: 'locked',
        };
      } else {
        return {
          title: 'Lock {{amountSats}} Sats to TAKE order',
          titleVariables: { amountSats: pn(order.bond_satoshis) },
          prompt: () => {
            return <LockInvoicePrompt order={order} concept={'bond'} />;
          },
          bondStatus: 'hide',
        };
      }
    } else if (status == 5) {
      // 5: 'Expired'
      return {
        title: 'The order has expired',
        prompt: () => {
          return (
            <ExpiredPrompt
              renewLoading={loadingButtons.renewOrder}
              order={order}
              onClickRenew={() => {
                onRenewOrder();
                setLoadingButtons({ ...noLoadingButtons, renewOrder: true });
              }}
            />
          );
        },
        bondStatus: 'hide', // To do: show bond status according to expiry message.
      };
    } else if (status == 6) {
      // 6: 'Waiting for trade collateral and buyer invoice'
      if (isBuyer) {
        return {
          title: 'Submit payout info for {{amountSats}} Sats',
          titleVariables: { amountSats: pn(order.invoice_amount) },
          prompt: () => {
            return (
              <PayoutPrompt
                order={order}
                onClickSubmitInvoice={updateInvoice}
                loadingLightning={loadingButtons.submitInvoice}
                lightning={lightning}
                setLightning={setLightning}
                onClickSubmitAddress={updateAddress}
                loadingOnchain={loadingButtons.submitAddress}
                onchain={onchain}
                setOnchain={setOnchain}
              />
            );
          },
          bondStatus: 'locked',
        };
      } else {
        return {
          title: 'Lock {{amountSats}} Sats as collateral',
          titleVariables: { amountSats: pn(order.escrow_satoshis) },
          titleColor: 'warning',
          prompt: () => {
            return <LockInvoicePrompt order={order} concept={'escrow'} />;
          },
          bondStatus: 'locked',
        };
      }
    } else if (status == 7) {
      // 7: 'Waiting only for seller trade collateral'
    } else if (status == 8) {
      // 8: 'Waiting only for buyer invoice'
    } else if (status == 9) {
      // 9: 'Sending fiat - In chatroom'
    } else if (status == 10) {
      // 10: 'Fiat sent - In chatroom'
    } else if (status == 11) {
      // 11: 'In dispute'
    } else if (status == 12) {
      // 12: 'Collaboratively cancelled'
    } else if (status == 13) {
      // 13: 'Sending satoshis to buyer'
    } else if (status == 14) {
      // 14: 'Sucessful trade'
    } else if (status == 15) {
      // 15: 'Failed lightning network routing'
    } else if (status == 16) {
      // 16: 'Wait for dispute resolution'
    } else if (status == 17) {
      // 17: 'Maker lost dispute'
    } else if (status == 18) {
      // 18: 'Taker lost dispute'
    }
    return { title, titleVariables, titleColor, prompt, bondStatus };
  };

  {
    /* Maker and taker Bond request */
  }
  //             {this.props.data.is_maker & (this.props.data.status == 0) ? this.showQRInvoice() : ''}
  //             {this.props.data.is_taker & (this.props.data.status == 3) ? this.showQRInvoice() : ''}

  //             {/* Waiting for taker and taker bond request */}
  //             {this.props.data.is_maker & (this.props.data.status == 2) ? this.showPausedOrder() : ''}
  //             {this.props.data.is_maker & (this.props.data.status == 1) ? this.showMakerWait() : ''}
  //             {this.props.data.is_maker & (this.props.data.status == 3) ? this.showTakerFound() : ''}

  //             {/* Send Invoice (buyer) and deposit collateral (seller) */}
  //             {this.props.data.is_seller &
  //             (this.props.data.status == 6 || this.props.data.status == 7)
  //               ? this.showEscrowQRInvoice()
  //               : ''}
  //             {this.props.data.is_buyer & (this.props.data.status == 6 || this.props.data.status == 8)
  //               ? this.showInputInvoice()
  //               : ''}
  //             {this.props.data.is_buyer & (this.props.data.status == 7)
  //               ? this.showWaitingForEscrow()
  //               : ''}
  //             {this.props.data.is_seller & (this.props.data.status == 8)
  //               ? this.showWaitingForBuyerInvoice()
  //               : ''}

  //             {/* In Chatroom  */}
  //             {this.props.data.status == 9 || this.props.data.status == 10 ? this.showChat() : ''}

  //             {/* Trade Finished */}
  //             {this.props.data.is_seller & [13, 14, 15].includes(this.props.data.status)
  //               ? this.showRateSelect()
  //               : ''}
  //             {this.props.data.is_buyer & (this.props.data.status == 14) ? this.showRateSelect() : ''}

  //             {/* Trade Finished - Payment Routing Failed */}
  //             {this.props.data.is_buyer & (this.props.data.status == 13)
  //               ? this.showSendingPayment()
  //               : ''}

  //             {/* Trade Finished - Payment Routing Failed */}
  //             {this.props.data.is_buyer & (this.props.data.status == 15)
  //               ? this.showRoutingFailed()
  //               : ''}

  //             {/* Trade Finished - TODO Needs more planning */}
  //             {this.props.data.status == 11 ? this.showInDisputeStatement() : ''}
  //             {this.props.data.status == 16 ? this.showWaitForDisputeResolution() : ''}
  //             {(this.props.data.status == 17) & this.props.data.is_taker ||
  //             (this.props.data.status == 18) & this.props.data.is_maker
  //               ? this.showDisputeWinner()
  //               : ''}
  //             {(this.props.data.status == 18) & this.props.data.is_taker ||
  //             (this.props.data.status == 17) & this.props.data.is_maker
  //               ? this.showDisputeLoser()
  //               : ''}

  //             {/* Order has expired */}
  //             {this.props.data.status == 5 ? this.showOrderExpired() : ''}

  const contract = statusToContract(order);

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
          <Title
            order={order}
            text={contract.title}
            color={contract.titleColor}
            variables={contract.titleVariables}
          />
        </Grid>
        <Divider />
        <Grid item>
          <contract.prompt />
        </Grid>

        {contract.bondStatus != 'hide' ? (
          <Grid item sx={{ width: '100%' }}>
            <Divider />
            <BondStatus status={contract.bondStatus} isMaker={order.is_maker} />
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

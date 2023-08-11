import React, { useState, useEffect } from 'react';
import { Box, Divider, Grid } from '@mui/material';

import { apiClient } from '../../services/api';
import { getWebln, pn } from '../../utils';

import {
  ConfirmCancelDialog,
  ConfirmCollabCancelDialog,
  ConfirmDisputeDialog,
  ConfirmFiatSentDialog,
  ConfirmUndoFiatSentDialog,
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
  PayoutWaitPrompt,
  EscrowWaitPrompt,
  ChatPrompt,
  DisputePrompt,
  DisputeWaitPeerPrompt,
  DisputeWaitResolutionPrompt,
  SendingSatsPrompt,
  SuccessfulPrompt,
  RoutingFailedPrompt,
  DisputeWinnerPrompt,
  DisputeLoserPrompt,
} from './Prompts';
import BondStatus from './BondStatus';
import CancelButton from './CancelButton';
import {
  defaultLightning,
  type LightningForm,
  defaultOnchain,
  type OnchainForm,
  type DisputeForm,
  defaultDispute,
} from './Forms';

import { type Order, type Robot, type Settings } from '../../models';
import { type EncryptedChatMessage } from './EncryptedChat';
import CollabCancelAlert from './CollabCancelAlert';
import { Bolt } from '@mui/icons-material';
import { signCleartextMessage } from '../../pgp';

interface loadingButtonsProps {
  cancel: boolean;
  fiatSent: boolean;
  fiatReceived: boolean;
  submitInvoice: boolean;
  submitAddress: boolean;
  submitStatement: boolean;
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
  submitStatement: false,
  openDispute: false,
  pauseOrder: false,
  renewOrder: false,
};

interface OpenDialogProps {
  confirmCancel: boolean;
  confirmCollabCancel: boolean;
  confirmFiatSent: boolean;
  confirmUndoFiatSent: boolean;
  confirmFiatReceived: boolean;
  confirmDispute: boolean;
  webln: boolean;
}

const closeAll: OpenDialogProps = {
  confirmCancel: false,
  confirmCollabCancel: false,
  confirmFiatSent: false,
  confirmUndoFiatSent: false,
  confirmFiatReceived: false,
  confirmDispute: false,
  webln: false,
};

interface TradeBoxProps {
  order: Order;
  setOrder: (state: Order) => void;
  robot: Robot;
  setBadOrder: (state: string | undefined) => void;
  onRenewOrder: () => void;
  onStartAgain: () => void;
  settings: Settings;
  baseUrl: string;
}

const TradeBox = ({
  order,
  setOrder,
  robot,
  settings,
  baseUrl,
  setBadOrder,
  onRenewOrder,
  onStartAgain,
}: TradeBoxProps): JSX.Element => {
  // Buttons and Dialogs
  const [loadingButtons, setLoadingButtons] = useState<loadingButtonsProps>(noLoadingButtons);
  const [open, setOpen] = useState<OpenDialogProps>(closeAll);
  const [waitingWebln, setWaitingWebln] = useState<boolean>(false);
  const [lastOrderStatus, setLastOrderStatus] = useState<number>(-1);

  // Forms
  const [onchain, setOnchain] = useState<OnchainForm>(defaultOnchain);
  const [lightning, setLightning] = useState<LightningForm>(defaultLightning);
  const [dispute, setDispute] = useState<DisputeForm>(defaultDispute);

  // Chat
  const [messages, setMessages] = useState<EncryptedChatMessage[]>([]);

  interface SubmitActionProps {
    action:
      | 'cancel'
      | 'dispute'
      | 'pause'
      | 'confirm'
      | 'undo_confirm'
      | 'update_invoice'
      | 'update_address'
      | 'submit_statement'
      | 'rate_platform';
    invoice?: string;
    routing_budget_ppm?: number;
    address?: string;
    mining_fee_rate?: number;
    statement?: string;
    rating?: number;
  }

  const submitAction = function ({
    action,
    invoice,
    routing_budget_ppm,
    address,
    mining_fee_rate,
    statement,
    rating,
  }: SubmitActionProps): void {
    void apiClient
      .post(
        baseUrl,
        `/api/order/?order_id=${order.id}`,
        {
          action,
          invoice,
          routing_budget_ppm,
          address,
          mining_fee_rate,
          statement,
          rating,
        },
        { tokenSHA256: robot.tokenSHA256 },
      )
      .then((data: Order) => {
        setOpen(closeAll);
        setLoadingButtons({ ...noLoadingButtons });
        if (data.bad_request !== undefined) {
          setBadOrder(data.bad_request);
        } else if (data.bad_address !== undefined) {
          setOnchain({ ...onchain, badAddress: data.bad_address });
        } else if (data.bad_invoice !== undefined) {
          setLightning({ ...lightning, badInvoice: data.bad_invoice });
        } else if (data.bad_statement !== undefined) {
          setDispute({ ...dispute, badStatement: data.bad_statement });
        } else {
          setOrder({ ...order, ...data });
          setBadOrder(undefined);
        }
      })
      .catch(() => {
        setOpen(closeAll);
        setLoadingButtons({ ...noLoadingButtons });
      });
  };

  const cancel = function (): void {
    setLoadingButtons({ ...noLoadingButtons, cancel: true });
    submitAction({ action: 'cancel' });
  };

  const openDispute = function (): void {
    setLoadingButtons({ ...noLoadingButtons, openDispute: true });
    submitAction({ action: 'dispute' });
  };

  const confirmFiatReceived = function (): void {
    setLoadingButtons({ ...noLoadingButtons, fiatReceived: true });
    submitAction({ action: 'confirm' });
  };

  const confirmFiatSent = function (): void {
    setLoadingButtons({ ...noLoadingButtons, fiatSent: true });
    submitAction({ action: 'confirm' });
  };

  const confirmUndoFiatSent = function (): void {
    setLoadingButtons({ ...noLoadingButtons, undoFiatSent: true });
    submitAction({ action: 'undo_confirm' });
  };

  const updateInvoice = function (invoice: string): void {
    setLoadingButtons({ ...noLoadingButtons, submitInvoice: true });
    void signCleartextMessage(invoice, robot.encPrivKey, robot.token).then((signedInvoice) => {
      submitAction({
        action: 'update_invoice',
        invoice: signedInvoice,
        routing_budget_ppm: lightning.routingBudgetPPM,
      });
    });
  };

  const updateAddress = function (): void {
    setLoadingButtons({ ...noLoadingButtons, submitAddress: true });
    void signCleartextMessage(onchain.address, robot.encPrivKey, robot.token).then(
      (signedAddress) => {
        submitAction({
          action: 'update_address',
          address: signedAddress,
          mining_fee_rate: onchain.miningFee,
        });
      },
    );
  };

  const pauseOrder = function (): void {
    setLoadingButtons({ ...noLoadingButtons, pauseOrder: true });
    submitAction({ action: 'pause' });
  };

  const submitStatement = function (): void {
    let statement = dispute.statement;
    if (dispute.attachLogs) {
      const payload = { statement, messages, token: robot.token };
      statement = JSON.stringify(payload, null, 2);
    }
    setLoadingButtons({ ...noLoadingButtons, submitStatement: true });
    submitAction({ action: 'submit_statement', statement });
  };
  const ratePlatform = function (rating: number): void {
    submitAction({ action: 'rate_platform', rating });
  };

  const handleWebln = async (order: Order): void => {
    const webln = await getWebln().catch(() => {
      console.log('WebLN not available');
    });
    // If Webln implements locked payments compatibility, this logic might be simplier
    if (webln === undefined) {
      return null;
    } else if (order.is_maker && order.status === 0) {
      webln.sendPayment(order.bond_invoice);
      setWaitingWebln(true);
      setOpen({ ...open, webln: true });
    } else if (order.is_taker && order.status === 3) {
      webln.sendPayment(order.bond_invoice);
      setWaitingWebln(true);
      setOpen({ ...open, webln: true });
    } else if (order.is_seller && (order.status === 6 || order.status === 7)) {
      webln.sendPayment(order.escrow_invoice);
      setWaitingWebln(true);
      setOpen({ ...open, webln: true });
    } else if (order.is_buyer && (order.status === 6 || order.status === 8)) {
      setWaitingWebln(true);
      setOpen({ ...open, webln: true });
      webln
        .makeInvoice(() => lightning.amount)
        .then((invoice: any) => {
          if (invoice !== undefined) {
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
    if (order.status !== lastOrderStatus) {
      setLastOrderStatus(order.status);
      handleWebln(order);
    }
  }, [order.status]);

  const statusToContract = function (order: Order): JSX.Element {
    const status = order.status;
    const isBuyer = order.is_buyer;
    const isMaker = order.is_maker;

    let title: string = 'Unknown Order Status';
    let titleVariables: object = {};
    let titleColor: string = 'primary';
    let titleIcon: () => JSX.Element = function () {
      return <></>;
    };
    let prompt = (): JSX.Element => <span>Wops!</span>;
    let bondStatus: 'hide' | 'locked' | 'unlocked' | 'settled' = 'hide';

    switch (status) {
      // 0: 'Waiting for maker bond'
      case 0:
        if (isMaker) {
          title = 'Lock {{amountSats}} Sats to PUBLISH order';
          titleVariables = { amountSats: pn(order.bond_satoshis) };
          prompt = () => {
            return <LockInvoicePrompt order={order} concept={'bond'} />;
          };
          bondStatus = 'hide';
        }
        break;
      // 1: 'Public'
      case 1:
        if (isMaker) {
          title = 'Your order is public';
          prompt = () => {
            return (
              <PublicWaitPrompt
                order={order}
                pauseLoading={loadingButtons.pauseOrder}
                onClickPauseOrder={pauseOrder}
              />
            );
          };
          bondStatus = 'locked';
        }
        break;
      // 2: 'Paused'
      case 2:
        if (isMaker) {
          title = 'Your order is paused';
          prompt = () => {
            return (
              <PausedPrompt
                pauseLoading={loadingButtons.pauseOrder}
                onClickResumeOrder={pauseOrder}
              />
            );
          };
          bondStatus = 'locked';
        }
        break;

      // 3: 'Waiting for taker bond'
      case 3:
        if (isMaker) {
          title = 'A taker has been found!';
          prompt = () => {
            return <TakerFoundPrompt />;
          };
          bondStatus = 'locked';
        } else {
          title = 'Lock {{amountSats}} Sats to TAKE order';
          titleVariables = { amountSats: pn(order.bond_satoshis) };
          prompt = () => {
            return <LockInvoicePrompt order={order} concept={'bond'} />;
          };
          bondStatus = 'hide';
        }
        break;

      // 5: 'Expired'
      case 5:
        title = 'The order has expired';
        prompt = () => {
          return (
            <ExpiredPrompt
              loadingRenew={loadingButtons.renewOrder}
              order={order}
              onClickRenew={() => {
                onRenewOrder();
                setLoadingButtons({ ...noLoadingButtons, renewOrder: true });
              }}
            />
          );
        };
        bondStatus = 'hide'; // To do: show bond status according to expiry message.
        break;

      // 6: 'Waiting for trade collateral and buyer invoice'
      case 6:
        bondStatus = 'locked';
        if (isBuyer) {
          title = 'Submit payout info';
          titleVariables = { amountSats: pn(order.invoice_amount) };
          prompt = function () {
            return (
              <PayoutPrompt
                order={order}
                settings={settings}
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
          };
        } else {
          title = 'Lock {{amountSats}} Sats as collateral';
          titleVariables = { amountSats: pn(order.escrow_satoshis) };
          titleColor = 'warning';
          prompt = () => {
            return <LockInvoicePrompt order={order} concept={'escrow'} />;
          };
        }
        break;

      // 7: 'Waiting only for seller trade collateral'
      case 7:
        bondStatus = 'locked';
        if (isBuyer) {
          title = 'Your info looks good!';
          prompt = () => {
            return <EscrowWaitPrompt />;
          };
        } else {
          title = 'Lock {{amountSats}} Sats as collateral';
          titleVariables = { amountSats: pn(order.escrow_satoshis) };
          titleColor = 'warning';
          prompt = () => {
            return <LockInvoicePrompt order={order} concept={'escrow'} />;
          };
        }
        break;

      // 8: 'Waiting only for buyer invoice'
      case 8:
        bondStatus = 'locked';
        if (isBuyer) {
          title = 'Submit payout info';
          titleVariables = { amountSats: pn(order.invoice_amount) };
          prompt = () => {
            return (
              <PayoutPrompt
                order={order}
                settings={settings}
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
          };
        } else {
          title = 'The trade collateral is locked!';
          prompt = () => {
            return <PayoutWaitPrompt />;
          };
        }
        break;

      // 9: 'Sending fiat - In chatroom'
      // 10: 'Fiat sent - In chatroom'
      case 9:
      case 10:
        title = isBuyer ? 'Chat with the seller' : 'Chat with the buyer';
        prompt = function () {
          return (
            <ChatPrompt
              order={order}
              robot={robot}
              onClickConfirmSent={() => {
                setOpen({ ...open, confirmFiatSent: true });
              }}
              onClickUndoConfirmSent={() => {
                setOpen({ ...open, confirmUndoFiatSent: true });
              }}
              onClickConfirmReceived={() => {
                setOpen({ ...open, confirmFiatReceived: true });
              }}
              loadingSent={loadingButtons.fiatSent}
              loadingUndoSent={loadingButtons.undoFiatSent}
              loadingReceived={loadingButtons.fiatReceived}
              onClickDispute={() => {
                setOpen({ ...open, confirmDispute: true });
              }}
              loadingDispute={loadingButtons.openDispute}
              baseUrl={baseUrl}
              messages={messages}
              setMessages={setMessages}
            />
          );
        };
        bondStatus = 'locked';
        break;

      // 11: 'In dispute'
      case 11:
        bondStatus = 'settled';
        if (order.statement_submitted) {
          title = 'We have received your statement';
          prompt = function () {
            return <DisputeWaitPeerPrompt />;
          };
        } else {
          title = 'A dispute has been opened';
          prompt = function () {
            return (
              <DisputePrompt
                loading={loadingButtons.submitStatement}
                dispute={dispute}
                setDispute={setDispute}
                onClickSubmit={submitStatement}
              />
            );
          };
        }
        break;

      // 12: 'Collaboratively cancelled'
      case 12:
        break;
      // 13: 'Sending satoshis to buyer'
      case 13:
        if (isBuyer) {
          bondStatus = 'unlocked';
          title = 'Attempting Lightning Payment';
          prompt = function () {
            return <SendingSatsPrompt />;
          };
        } else {
          title = 'Trade finished!';
          titleColor = 'success';
          titleIcon = function () {
            return <Bolt xs={{ width: '1em', height: '1em' }} color='warning' />;
          };
          prompt = function () {
            return (
              <SuccessfulPrompt
                baseUrl={baseUrl}
                order={order}
                ratePlatform={ratePlatform}
                onClickStartAgain={onStartAgain}
                loadingRenew={loadingButtons.renewOrder}
                onClickRenew={() => {
                  onRenewOrder();
                  setLoadingButtons({ ...noLoadingButtons, renewOrder: true });
                }}
              />
            );
          };
        }
        break;

      // 14: 'Sucessful trade'
      case 14:
        title = 'Trade finished!';
        titleColor = 'success';
        titleIcon = function () {
          return <Bolt xs={{ width: '1em', height: '1em' }} color='warning' />;
        };
        prompt = function () {
          return (
            <SuccessfulPrompt
              baseUrl={baseUrl}
              order={order}
              ratePlatform={ratePlatform}
              onClickStartAgain={onStartAgain}
              loadingRenew={loadingButtons.renewOrder}
              onClickRenew={() => {
                onRenewOrder();
                setLoadingButtons({ ...noLoadingButtons, renewOrder: true });
              }}
            />
          );
        };
        break;

      // 15: 'Failed lightning network routing'
      case 15:
        if (isBuyer) {
          bondStatus = 'unlocked';
          title = 'Lightning Routing Failed';
          prompt = function () {
            return (
              <RoutingFailedPrompt
                order={order}
                settings={settings}
                onClickSubmitInvoice={updateInvoice}
                loadingLightning={loadingButtons.submitInvoice}
                lightning={lightning}
                setLightning={setLightning}
              />
            );
          };
        } else {
          title = 'Trade finished!';
          titleColor = 'success';
          titleIcon = function () {
            return <Bolt xs={{ width: '1em', height: '1em' }} color='warning' />;
          };
          prompt = function () {
            return (
              <SuccessfulPrompt
                baseUrl={baseUrl}
                order={order}
                ratePlatform={ratePlatform}
                onClickStartAgain={onStartAgain}
                loadingRenew={loadingButtons.renewOrder}
                onClickRenew={() => {
                  onRenewOrder();
                  setLoadingButtons({ ...noLoadingButtons, renewOrder: true });
                }}
              />
            );
          };
        }
        break;

      // 16: 'Wait for dispute resolution'
      case 16:
        bondStatus = 'settled';
        title = 'We have the statements';
        prompt = function () {
          return <DisputeWaitResolutionPrompt />;
        };
        break;

      // 17: 'Maker lost dispute'
      // 18: 'Taker lost dispute'
      case 17:
      case 18:
        if ((status === 17 && isMaker) || (status === 18 && !isMaker)) {
          title = 'You have lost the dispute';
          prompt = function () {
            return <DisputeLoserPrompt />;
          };
          bondStatus = 'settled';
        } else if ((status === 17 && !isMaker) || (status === 18 && isMaker)) {
          title = 'You have won the dispute';
          prompt = function () {
            return <DisputeWinnerPrompt />;
          };
        }
        break;

      default:
        break;
    }

    return { title, titleVariables, titleColor, prompt, bondStatus, titleIcon };
  };

  const contract = statusToContract(order);

  return (
    <Box>
      <WebLNDialog
        open={open.webln}
        onClose={() => {
          setOpen(closeAll);
        }}
        waitingWebln={waitingWebln}
        isBuyer={order.is_buyer}
      />
      <ConfirmDisputeDialog
        open={open.confirmDispute}
        onClose={() => {
          setOpen(closeAll);
        }}
        onAgreeClick={openDispute}
      />
      <ConfirmCancelDialog
        open={open.confirmCancel}
        onClose={() => {
          setOpen(closeAll);
        }}
        onCancelClick={cancel}
      />
      <ConfirmCollabCancelDialog
        open={open.confirmCollabCancel}
        onClose={() => {
          setOpen(closeAll);
        }}
        onCollabCancelClick={cancel}
        loading={loadingButtons.cancel}
        peerAskedCancel={order.pending_cancel}
      />
      <ConfirmFiatSentDialog
        open={open.confirmFiatSent}
        order={order}
        loadingButton={loadingButtons.fiatSent}
        onClose={() => {
          setOpen(closeAll);
        }}
        onConfirmClick={confirmFiatSent}
      />
      <ConfirmUndoFiatSentDialog
        open={open.confirmUndoFiatSent}
        order={order}
        loadingButton={loadingButtons.undoFiatSent}
        onClose={() => {
          setOpen(closeAll);
        }}
        onConfirmClick={confirmUndoFiatSent}
      />
      <ConfirmFiatReceivedDialog
        open={open.confirmFiatReceived}
        order={order}
        loadingButton={loadingButtons.fiatReceived}
        onClose={() => {
          setOpen(closeAll);
        }}
        onConfirmClick={confirmFiatReceived}
      />
      <CollabCancelAlert order={order} />
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
            icon={contract.titleIcon}
            variables={contract.titleVariables}
          />
        </Grid>
        <Divider />

        <Grid item>{contract.prompt()}</Grid>

        {contract.bondStatus !== 'hide' ? (
          <Grid item sx={{ width: '100%' }}>
            <Divider />
            <BondStatus status={contract.bondStatus} isMaker={order.is_maker} />
          </Grid>
        ) : (
          <></>
        )}

        <Grid item>
          <CancelButton
            order={order}
            onClickCancel={cancel}
            openCancelDialog={() => {
              setOpen({ ...closeAll, confirmCancel: true });
            }}
            openCollabCancelDialog={() => {
              setOpen({ ...closeAll, confirmCollabCancel: true });
            }}
            loading={loadingButtons.cancel}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default TradeBox;

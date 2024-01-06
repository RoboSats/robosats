import React, { useState, useEffect, useContext } from 'react';
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

import { type Order } from '../../models';
import { type EncryptedChatMessage } from './EncryptedChat';
import CollabCancelAlert from './CollabCancelAlert';
import { Bolt } from '@mui/icons-material';
import { signCleartextMessage } from '../../pgp';
import { type UseGarageStoreType, GarageContext } from '../../contexts/GarageContext';
import { type UseAppStoreType, AppContext } from '../../contexts/AppContext';
import { FederationContext, type UseFederationStoreType } from '../../contexts/FederationContext';
import { useNavigate } from 'react-router-dom';

interface loadingButtonsProps {
  cancel: boolean;
  fiatSent: boolean;
  fiatReceived: boolean;
  undoFiatSent: boolean;
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
  undoFiatSent: false,
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
  baseUrl: string;
  onStartAgain: () => void;
}

interface Contract {
  title: string;
  titleVariables: object;
  titleColor: string;
  prompt: () => JSX.Element;
  bondStatus: 'hide' | 'locked' | 'unlocked' | 'settled';
  titleIcon: () => JSX.Element;
}

const TradeBox = ({ baseUrl, onStartAgain }: TradeBoxProps): JSX.Element => {
  const { garage, orderUpdatedAt, setBadOrder } = useContext<UseGarageStoreType>(GarageContext);
  const { settings, hostUrl, origin } = useContext<UseAppStoreType>(AppContext);
  const { federation } = useContext<UseFederationStoreType>(FederationContext);
  const navigate = useNavigate();

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

  const renewOrder = function (): void {
    const currentOrder = garage.getSlot()?.order;
    if (Boolean(currentOrder)) {
      const body = {
        type: currentOrder.type,
        currency: currentOrder.currency,
        amount: currentOrder.has_range ? null : currentOrder.amount,
        has_range: currentOrder.has_range,
        min_amount: currentOrder.min_amount,
        max_amount: currentOrder.max_amount,
        payment_method: currentOrder.payment_method,
        is_explicit: currentOrder.is_explicit,
        premium: currentOrder.is_explicit ? null : currentOrder.premium,
        satoshis: currentOrder.is_explicit ? currentOrder.satoshis : null,
        public_duration: currentOrder.public_duration,
        escrow_duration: currentOrder.escrow_duration,
        bond_size: currentOrder.bond_size,
        latitude: currentOrder.latitude,
        longitude: currentOrder.longitude,
      };
      const { url, basePath } = federation
        .getCoordinator(currentOrder.shortAlias)
        .getEndpoint(settings.network, origin, settings.selfhostedClient, hostUrl);
      apiClient
        .post(url + basePath, '/api/make/', body, {
          tokenSHA256: garage.getSlot()?.getRobot()?.tokenSHA256,
        })
        .then((data: any) => {
          if (data.bad_request !== undefined) {
            setBadOrder(data.bad_request);
          } else if (data.id !== undefined) {
            navigate(`/order/${String(currentOrder?.shortAlias)}/${String(data.id)}`);
          }
        })
        .catch(() => {
          setBadOrder('Request error');
        });
    }
  };

  const submitAction = function ({
    action,
    invoice,
    routing_budget_ppm,
    address,
    mining_fee_rate,
    statement,
    rating,
  }: SubmitActionProps): void {
    const robot = garage.getSlot()?.getRobot();
    const currentOrder = garage.getSlot()?.order;

    void apiClient
      .post(
        baseUrl,
        `/api/order/?order_id=${Number(currentOrder?.id)}`,
        {
          action,
          invoice,
          routing_budget_ppm,
          address,
          mining_fee_rate,
          statement,
          rating,
        },
        { tokenSHA256: robot?.tokenSHA256 },
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
          garage.updateOrder(data);
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
    const slot = garage.getSlot();
    const robot = slot?.getRobot();

    if (robot?.encPrivKey != null && slot?.token != null) {
      setLoadingButtons({ ...noLoadingButtons, submitInvoice: true });
      void signCleartextMessage(invoice, robot.encPrivKey, slot.token).then((signedInvoice) => {
        submitAction({
          action: 'update_invoice',
          invoice: signedInvoice,
          routing_budget_ppm: lightning.routingBudgetPPM,
        });
      });
    }
  };

  const updateAddress = function (): void {
    const slot = garage.getSlot();
    const robot = slot?.getRobot();

    if (robot?.encPrivKey != null && slot?.token != null) {
      setLoadingButtons({ ...noLoadingButtons, submitAddress: true });
      void signCleartextMessage(onchain.address, robot.encPrivKey, slot.token).then(
        (signedAddress) => {
          submitAction({
            action: 'update_address',
            address: signedAddress,
            mining_fee_rate: onchain.miningFee,
          });
        },
      );
    }
  };

  const pauseOrder = function (): void {
    setLoadingButtons({ ...noLoadingButtons, pauseOrder: true });
    submitAction({ action: 'pause' });
  };

  const submitStatement = function (): void {
    const slot = garage.getSlot();
    let statement = dispute.statement;
    if (dispute.attachLogs) {
      const payload = { statement, messages, token: slot?.token };
      statement = JSON.stringify(payload, null, 2);
    }
    setLoadingButtons({ ...noLoadingButtons, submitStatement: true });
    submitAction({ action: 'submit_statement', statement });
  };
  const ratePlatform = function (rating: number): void {
    submitAction({ action: 'rate_platform', rating });
  };

  const handleWebln = async (order: Order): Promise<void> => {
    const webln = await getWebln().catch(() => {
      console.log('WebLN not available');
    });
    // If Webln implements locked payments compatibility, this logic might be simplier
    if (webln === undefined) {
      console.log('WebLN dialog will not be shown');
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
    const currentOrder = garage.getSlot()?.order;
    if (currentOrder && currentOrder?.status !== lastOrderStatus) {
      setLastOrderStatus(currentOrder.status);
      void handleWebln(currentOrder);
    }
  }, [orderUpdatedAt]);

  const statusToContract = function (): Contract {
    const order = garage.getSlot()?.order;

    const baseContract: Contract = {
      title: 'Unknown Order Status',
      titleVariables: {},
      titleColor: 'primary',
      prompt: () => <span>Wops!</span>,
      bondStatus: 'hide',
      titleIcon: () => <></>,
    };

    if (!order) return baseContract;

    const status = order.status;
    const isBuyer = order.is_buyer;
    const isMaker = order.is_maker;

    switch (status) {
      // 0: 'Waiting for maker bond'
      case 0:
        if (isMaker) {
          baseContract.title = 'Lock {{amountSats}} Sats to PUBLISH order';
          baseContract.titleVariables = { amountSats: pn(order.bond_satoshis) };
          baseContract.prompt = () => {
            return <LockInvoicePrompt order={order} concept={'bond'} />;
          };
          baseContract.bondStatus = 'hide';
        }
        break;
      // 1: 'Public'
      case 1:
        if (isMaker) {
          baseContract.title = 'Your order is public';
          baseContract.prompt = () => {
            return (
              <PublicWaitPrompt
                order={order}
                pauseLoading={loadingButtons.pauseOrder}
                onClickPauseOrder={pauseOrder}
              />
            );
          };
          baseContract.bondStatus = 'locked';
        }
        break;
      // 2: 'Paused'
      case 2:
        if (isMaker) {
          baseContract.title = 'Your order is paused';
          baseContract.prompt = () => {
            return (
              <PausedPrompt
                pauseLoading={loadingButtons.pauseOrder}
                onClickResumeOrder={pauseOrder}
              />
            );
          };
          baseContract.bondStatus = 'locked';
        }
        break;

      // 3: 'Waiting for taker bond'
      case 3:
        if (isMaker) {
          baseContract.title = 'A taker has been found!';
          baseContract.prompt = () => {
            return <TakerFoundPrompt />;
          };
          baseContract.bondStatus = 'locked';
        } else {
          baseContract.title = 'Lock {{amountSats}} Sats to TAKE order';
          baseContract.titleVariables = { amountSats: pn(order.bond_satoshis) };
          baseContract.prompt = () => {
            return <LockInvoicePrompt order={order} concept={'bond'} />;
          };
          baseContract.bondStatus = 'hide';
        }
        break;

      // 5: 'Expired'
      case 5:
        baseContract.title = 'The order has expired';
        baseContract.prompt = () => {
          return (
            <ExpiredPrompt
              loadingRenew={loadingButtons.renewOrder}
              order={order}
              onClickRenew={() => {
                renewOrder();
                setLoadingButtons({ ...noLoadingButtons, renewOrder: true });
              }}
            />
          );
        };
        baseContract.bondStatus = 'hide'; // To do: show bond status according to expiry message.
        break;

      // 6: 'Waiting for trade collateral and buyer invoice'
      case 6:
        baseContract.bondStatus = 'locked';
        if (isBuyer) {
          baseContract.title = 'Submit payout info';
          baseContract.titleVariables = { amountSats: pn(order.invoice_amount) };
          baseContract.prompt = function () {
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
          baseContract.title = 'Lock {{amountSats}} Sats as collateral';
          baseContract.titleVariables = { amountSats: pn(order.escrow_satoshis) };
          baseContract.titleColor = 'warning';
          baseContract.prompt = () => {
            return <LockInvoicePrompt order={order} concept={'escrow'} />;
          };
        }
        break;

      // 7: 'Waiting only for seller trade collateral'
      case 7:
        baseContract.bondStatus = 'locked';
        if (isBuyer) {
          baseContract.title = 'Your info looks good!';
          baseContract.prompt = () => {
            return <EscrowWaitPrompt />;
          };
        } else {
          baseContract.title = 'Lock {{amountSats}} Sats as collateral';
          baseContract.titleVariables = { amountSats: pn(order.escrow_satoshis) };
          baseContract.titleColor = 'warning';
          baseContract.prompt = () => {
            return <LockInvoicePrompt order={order} concept={'escrow'} />;
          };
        }
        break;

      // 8: 'Waiting only for buyer invoice'
      case 8:
        baseContract.bondStatus = 'locked';
        if (isBuyer) {
          baseContract.title = 'Submit payout info';
          baseContract.titleVariables = { amountSats: pn(order.invoice_amount) };
          baseContract.prompt = () => {
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
          baseContract.title = 'The trade collateral is locked!';
          baseContract.prompt = () => {
            return <PayoutWaitPrompt />;
          };
        }
        break;

      // 9: 'Sending fiat - In chatroom'
      // 10: 'Fiat sent - In chatroom'
      case 9:
      case 10:
        baseContract.title = isBuyer ? 'Chat with the seller' : 'Chat with the buyer';
        baseContract.prompt = function () {
          return (
            <ChatPrompt
              order={order}
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
        baseContract.bondStatus = 'locked';
        break;

      // 11: 'In dispute'
      case 11:
        baseContract.bondStatus = 'settled';
        if (order.statement_submitted) {
          baseContract.title = 'We have received your statement';
          baseContract.prompt = function () {
            return <DisputeWaitPeerPrompt />;
          };
        } else {
          baseContract.title = 'A dispute has been opened';
          baseContract.prompt = function () {
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
          baseContract.bondStatus = 'unlocked';
          baseContract.title = 'Attempting Lightning Payment';
          baseContract.prompt = function () {
            return <SendingSatsPrompt />;
          };
        } else {
          baseContract.title = 'Trade finished!';
          baseContract.titleColor = 'success';
          baseContract.titleIcon = function () {
            return <Bolt xs={{ width: '1em', height: '1em' }} color='warning' />;
          };
          baseContract.prompt = function () {
            return (
              <SuccessfulPrompt
                baseUrl={baseUrl}
                order={order}
                ratePlatform={ratePlatform}
                onClickStartAgain={onStartAgain}
                loadingRenew={loadingButtons.renewOrder}
                onClickRenew={() => {
                  renewOrder();
                  setLoadingButtons({ ...noLoadingButtons, renewOrder: true });
                }}
              />
            );
          };
        }
        break;

      // 14: 'Sucessful trade'
      case 14:
        baseContract.title = 'Trade finished!';
        baseContract.titleColor = 'success';
        baseContract.titleIcon = function () {
          return <Bolt xs={{ width: '1em', height: '1em' }} color='warning' />;
        };
        baseContract.prompt = function () {
          return (
            <SuccessfulPrompt
              baseUrl={baseUrl}
              order={order}
              ratePlatform={ratePlatform}
              onClickStartAgain={onStartAgain}
              loadingRenew={loadingButtons.renewOrder}
              onClickRenew={() => {
                renewOrder();
                setLoadingButtons({ ...noLoadingButtons, renewOrder: true });
              }}
            />
          );
        };
        break;

      // 15: 'Failed lightning network routing'
      case 15:
        if (isBuyer) {
          baseContract.bondStatus = 'unlocked';
          baseContract.title = 'Lightning Routing Failed';
          baseContract.prompt = function () {
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
          baseContract.title = 'Trade finished!';
          baseContract.titleColor = 'success';
          baseContract.titleIcon = function () {
            return <Bolt xs={{ width: '1em', height: '1em' }} color='warning' />;
          };
          baseContract.prompt = function () {
            return (
              <SuccessfulPrompt
                baseUrl={baseUrl}
                order={order}
                ratePlatform={ratePlatform}
                onClickStartAgain={onStartAgain}
                loadingRenew={loadingButtons.renewOrder}
                onClickRenew={() => {
                  renewOrder();
                  setLoadingButtons({ ...noLoadingButtons, renewOrder: true });
                }}
              />
            );
          };
        }
        break;

      // 16: 'Wait for dispute resolution'
      case 16:
        baseContract.bondStatus = 'settled';
        baseContract.title = 'We have the statements';
        baseContract.prompt = function () {
          return <DisputeWaitResolutionPrompt />;
        };
        break;

      // 17: 'Maker lost dispute'
      // 18: 'Taker lost dispute'
      case 17:
      case 18:
        if ((status === 17 && isMaker) || (status === 18 && !isMaker)) {
          baseContract.title = 'You have lost the dispute';
          baseContract.prompt = function () {
            return <DisputeLoserPrompt />;
          };
          baseContract.bondStatus = 'settled';
        } else if ((status === 17 && !isMaker) || (status === 18 && isMaker)) {
          baseContract.title = 'You have won the dispute';
          baseContract.prompt = function () {
            return <DisputeWinnerPrompt />;
          };
        }
        break;

      default:
        break;
    }

    return baseContract;
  };

  const contract = statusToContract();

  return (
    <Box>
      <WebLNDialog
        open={open.webln}
        onClose={() => {
          setOpen(closeAll);
        }}
        waitingWebln={waitingWebln}
        isBuyer={garage.getSlot()?.order?.is_buyer ?? false}
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
        peerAskedCancel={garage.getSlot()?.order?.pending_cancel ?? false}
      />
      <ConfirmFiatSentDialog
        open={open.confirmFiatSent}
        order={garage.getSlot()?.order ?? null}
        loadingButton={loadingButtons.fiatSent}
        onClose={() => {
          setOpen(closeAll);
        }}
        onConfirmClick={confirmFiatSent}
      />
      <ConfirmUndoFiatSentDialog
        open={open.confirmUndoFiatSent}
        loadingButton={loadingButtons.undoFiatSent}
        onClose={() => {
          setOpen(closeAll);
        }}
        onConfirmClick={confirmUndoFiatSent}
      />
      <ConfirmFiatReceivedDialog
        open={open.confirmFiatReceived}
        order={garage.getSlot()?.order ?? null}
        loadingButton={loadingButtons.fiatReceived}
        onClose={() => {
          setOpen(closeAll);
        }}
        onConfirmClick={confirmFiatReceived}
      />
      <CollabCancelAlert order={garage.getSlot()?.order ?? null} />
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
            order={garage.getSlot()?.order ?? null}
            text={contract?.title}
            color={contract?.titleColor}
            icon={contract?.titleIcon}
            variables={contract?.titleVariables}
          />
        </Grid>
        <Divider />

        <Grid item>{contract?.prompt()}</Grid>

        {contract?.bondStatus !== 'hide' ? (
          <Grid item sx={{ width: '100%' }}>
            <Divider />
            <BondStatus
              status={contract?.bondStatus}
              isMaker={garage.getSlot()?.order?.is_maker ?? false}
            />
          </Grid>
        ) : (
          <></>
        )}

        <Grid item>
          <CancelButton
            order={garage.getSlot()?.order ?? null}
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

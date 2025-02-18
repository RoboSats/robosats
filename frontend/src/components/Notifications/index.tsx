import React, { useEffect, useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Tooltip,
  Alert,
  IconButton,
  type TooltipProps,
  styled,
  tooltipClasses,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Close from '@mui/icons-material/Close';
import { type Page } from '../../basic/NavBar';
import { GarageContext, type UseGarageStoreType } from '../../contexts/GarageContext';

interface NotificationsProps {
  rewards: number | undefined;
  page: Page;
  openProfile: () => void;
  windowWidth: number;
}

interface NotificationMessage {
  title: string;
  severity: 'error' | 'warning' | 'info' | 'success';
  onClick: () => void;
  sound: HTMLAudioElement | undefined;
  timeout: number;
  pageTitle: string;
}

const path =
  window.NativeRobosats === undefined
    ? '/static/assets/sounds'
    : 'file:///android_asset/Web.bundle/assets/sounds';

const audio = {
  chat: new Audio(`${path}/chat-open.mp3`),
  takerFound: new Audio(`${path}/taker-found.mp3`),
  ding: new Audio(`${path}/locked-invoice.mp3`),
  successful: new Audio(`${path}/successful.mp3`),
};

const emptyNotificationMessage: NotificationMessage = {
  title: '',
  severity: 'info',
  onClick: () => null,
  sound: undefined,
  timeout: 1000,
  pageTitle: 'RoboSats - Simple and Private Bitcoin Exchange',
};

const StyledTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: 'rgb(0,0,0,0)',
    boxShadow: theme.shadows[1],
    borderRadius: '0.3em',
    padding: '0',
  },
}));

const Notifications = ({
  rewards,
  page,
  windowWidth,
  openProfile,
}: NotificationsProps): JSX.Element => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { garage, slotUpdatedAt } = useContext<UseGarageStoreType>(GarageContext);

  const [message, setMessage] = useState<NotificationMessage>(emptyNotificationMessage);
  const [inFocus, setInFocus] = useState<boolean>(true);
  const [titleAnimation, setTitleAnimation] = useState<NodeJS.Timer | undefined>(undefined);
  const [show, setShow] = useState<boolean>(false);

  // Keep last values to trigger effects on change
  const [oldOrderStatus, setOldOrderStatus] = useState<number | undefined>(undefined);
  const [oldRewards, setOldRewards] = useState<number>(0);
  const [oldChatIndex, setOldChatIndex] = useState<number>(0);

  const position = windowWidth > 60 ? { top: '4em', right: '0em' } : { top: '0.5em', left: '50%' };
  const basePageTitle = t('RoboSats - Simple and Private Bitcoin Exchange');

  const moveToOrderPage = function (): void {
    navigate(`/order/${String(garage.getSlot()?.activeOrder?.id)}`);
    setShow(false);
  };

  interface MessagesProps {
    bondLocked: NotificationMessage;
    escrowLocked: NotificationMessage;
    taken: NotificationMessage;
    expired: NotificationMessage;
    chat: NotificationMessage;
    successful: NotificationMessage;
    routingFailed: NotificationMessage;
    dispute: NotificationMessage;
    disputeWinner: NotificationMessage;
    disputeLoser: NotificationMessage;
    rewards: NotificationMessage;
    chatMessage: NotificationMessage;
  }

  const Messages: MessagesProps = {
    bondLocked: {
      title: t(
        `${garage.getSlot()?.activeOrder?.is_maker === true ? 'Maker' : 'Taker'} bond locked`,
      ),
      severity: 'info',
      onClick: moveToOrderPage,
      sound: audio.ding,
      timeout: 10000,
      pageTitle: `${t('✅ Bond!')} - ${basePageTitle}`,
    },
    escrowLocked: {
      title: t(`Order collateral locked`),
      severity: 'info',
      onClick: moveToOrderPage,
      sound: audio.ding,
      timeout: 10000,
      pageTitle: `${t('✅ Escrow!')} -  ${basePageTitle}`,
    },
    taken: {
      title: t('Order has been taken!'),
      severity: 'success',
      onClick: moveToOrderPage,
      sound: audio.takerFound,
      timeout: 30000,
      pageTitle: `${t('🥳 Taken!')} - ${basePageTitle}`,
    },
    expired: {
      title: t('Order has expired'),
      severity: 'warning',
      onClick: moveToOrderPage,
      sound: audio.ding,
      timeout: 30000,
      pageTitle: `${t('😪 Expired!')} - ${basePageTitle}`,
    },
    chat: {
      title: t('Order chat is open'),
      severity: 'info',
      onClick: moveToOrderPage,
      sound: audio.chat,
      timeout: 30000,
      pageTitle: `${t('💬 Chat!')} - ${basePageTitle}`,
    },
    successful: {
      title: t('Trade finished successfully!'),
      severity: 'success',
      onClick: moveToOrderPage,
      sound: audio.successful,
      timeout: 10000,
      pageTitle: `${t('🙌 Funished!')} - ${basePageTitle}`,
    },
    routingFailed: {
      title: t('Lightning routing failed'),
      severity: 'warning',
      onClick: moveToOrderPage,
      sound: audio.ding,
      timeout: 20000,
      pageTitle: `${t('❗⚡ Routing Failed')} - ${basePageTitle}`,
    },
    dispute: {
      title: t('Order has been disputed'),
      severity: 'warning',
      onClick: moveToOrderPage,
      sound: audio.ding,
      timeout: 40000,
      pageTitle: `${t('⚖️ Disputed!')} - ${basePageTitle}`,
    },
    disputeWinner: {
      title: t('You won the dispute'),
      severity: 'success',
      onClick: moveToOrderPage,
      sound: audio.ding,
      timeout: 30000,
      pageTitle: `${t('👍 dispute')} - ${basePageTitle}`,
    },
    disputeLoser: {
      title: t('You lost the dispute'),
      severity: 'error',
      onClick: moveToOrderPage,
      sound: audio.ding,
      timeout: 30000,
      pageTitle: `${t('👎 dispute')} - ${basePageTitle}`,
    },
    rewards: {
      title: t('You can claim Sats!'),
      severity: 'success',
      onClick: () => {
        openProfile();
        setShow(false);
      },
      sound: audio.ding,
      timeout: 300000,
      pageTitle: `${t('₿ Rewards!')} - ${basePageTitle}`,
    },
    chatMessage: {
      title: t('New chat message'),
      severity: 'info',
      onClick: moveToOrderPage,
      sound: audio.chat,
      timeout: 3000,
      pageTitle: `${t('💬 message!')} - ${basePageTitle}`,
    },
  };

  const notify = function (message: NotificationMessage): void {
    if (message.title !== '') {
      setMessage(message);
      setShow(true);
      setTimeout(() => {
        setShow(false);
      }, message.timeout);
      if (message.sound != null) {
        void message.sound.play();
      }
      if (!inFocus) {
        setTitleAnimation(
          setInterval(function () {
            const title = document.title;
            document.title = title === basePageTitle ? message.pageTitle : basePageTitle;
          }, 1000),
        );
      }
    }
  };

  const handleStatusChange = function (oldStatus: number | undefined, status: number): void {
    const order = garage.getSlot()?.activeOrder;

    if (order === undefined || order === null) return;

    let message = emptyNotificationMessage;

    // Order status descriptions:
    // 0: 'Waiting for maker bond'
    // 1: 'Public'
    // 2: 'Paused'
    // 3: 'Waiting for taker bond'
    // 5: 'Expired'
    // 6: 'Waiting for trade collateral and buyer invoice'
    // 7: 'Waiting only for seller trade collateral'
    // 8: 'Waiting only for buyer invoice'
    // 9: 'Sending fiat - In chatroom'
    // 10: 'Fiat sent - In chatroom'
    // 11: 'In dispute'
    // 12: 'Collaboratively cancelled'
    // 13: 'Sending satoshis to buyer'
    // 14: 'Successful trade'
    // 15: 'Failed lightning network routing'
    // 16: 'Wait for dispute resolution'
    // 17: 'Maker lost dispute'
    // 18: 'Taker lost dispute'

    if (status === 5 && oldStatus !== 5) {
      message = Messages.expired;
    } else if (oldStatus === undefined) {
      message = emptyNotificationMessage;
    } else if (order.is_maker && status > 0 && oldStatus === 0) {
      message = Messages.bondLocked;
    } else if (order.is_taker && status > 5 && oldStatus <= 5) {
      message = Messages.bondLocked;
    } else if (order.is_maker && status > 5 && oldStatus <= 5) {
      message = Messages.taken;
    } else if (order.is_seller && status > 7 && oldStatus < 7) {
      message = Messages.escrowLocked;
    } else if ([9, 10].includes(status) && oldStatus < 9) {
      message = Messages.chat;
    } else if (order.is_seller && [13, 14, 15].includes(status) && oldStatus < 13) {
      message = Messages.successful;
    } else if (order.is_buyer && status === 14 && oldStatus !== 14) {
      message = Messages.successful;
    } else if (order.is_buyer && status === 15 && oldStatus < 14) {
      message = Messages.routingFailed;
    } else if (status === 11 && oldStatus < 11) {
      message = Messages.dispute;
    } else if (
      ((order.is_maker && status === 18) || (order.is_taker && status === 17)) &&
      oldStatus < 17
    ) {
      message = Messages.disputeWinner;
    } else if (
      ((order.is_maker && status === 17) || (order.is_taker && status === 18)) &&
      oldStatus < 17
    ) {
      message = Messages.disputeLoser;
    }

    notify(message);
  };

  // Notify on order status change
  useEffect(() => {
    const order = garage.getSlot()?.activeOrder;
    if (order !== undefined && order !== null) {
      if (order.status !== oldOrderStatus) {
        handleStatusChange(oldOrderStatus, order.status);
        setOldOrderStatus(order.status);
      } else if (order.chat_last_index > oldChatIndex) {
        if (page !== 'order') {
          notify(Messages.chatMessage);
        }
        setOldChatIndex(order.chat_last_index);
      }
    }
  }, [slotUpdatedAt]);

  // Notify on rewards change
  useEffect(() => {
    if (rewards !== undefined) {
      if (rewards > oldRewards) {
        notify(Messages.rewards);
      }
      setOldRewards(rewards);
    }
  }, [rewards]);

  // Set blinking page title and clear on visibility change > infocus
  useEffect(() => {
    if (titleAnimation !== undefined && inFocus) {
      clearInterval(titleAnimation);
    }
  }, [inFocus]);

  useEffect(() => {
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        setInFocus(false);
      } else if (!document.hidden) {
        setInFocus(true);
        document.title = basePageTitle;
      }
    });
  }, []);

  return (
    <StyledTooltip
      open={show}
      placement={windowWidth > 60 ? 'left' : 'bottom'}
      title={
        <Alert
          severity={message.severity}
          action={
            <IconButton
              color='inherit'
              size='small'
              onClick={() => {
                setShow(false);
              }}
            >
              <Close fontSize='inherit' />
            </IconButton>
          }
        >
          <div style={{ cursor: 'pointer' }} onClick={message.onClick}>
            {message.title}
          </div>
        </Alert>
      }
    >
      <div style={{ ...position, visibility: 'hidden', position: 'absolute' }} />
    </StyledTooltip>
  );
};

export default Notifications;

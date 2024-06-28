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
import { Order, RoboNotification, Slot } from '../../models';
import { UseFederationStoreType, FederationContext } from '../../contexts/FederationContext';

interface NotificationsProps {
  rewards: number | undefined;
  page: Page;
  openProfile: () => void;
  windowWidth: number;
}

interface NotificationMessage {
  title: string;
  severity: 'error' | 'warning' | 'info' | 'success';
  onClick?: () => void;
  sound?: HTMLAudioElement;
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
<<<<<<< HEAD
  const { garage, slotUpdatedAt } = useContext<UseGarageStoreType>(GarageContext);
=======
  const basePageTitle = t('RoboSats - Simple and Private Bitcoin Exchange');
  const defaultDelay = 5000;
  const position = windowWidth > 60 ? { top: '4em', right: '0em' } : { top: '0.5em', left: '50%' };
>>>>>>> 29f784e9 (Web notifications)

  const { garage, orderUpdatedAt } = useContext<UseGarageStoreType>(GarageContext);
  const { federation } = useContext<UseFederationStoreType>(FederationContext);
  const [inFocus, setInFocus] = useState<boolean>(true);
  const [titleAnimation, setTitleAnimation] = useState<NodeJS.Timer | undefined>(undefined);
  const [show, setShow] = useState<boolean>(false);
  const [lastNoticiationCheck, setLastNoticiationCheck] = useState<string>(
    new Date().toISOString(),
  );
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);
  const [timer, setTimer] = useState<NodeJS.Timer | undefined>(() =>
    setInterval(() => null, defaultDelay),
  );

<<<<<<< HEAD
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
=======
  // // Keep last values to trigger effects on change
  // const [oldOrderStatus, setOldOrderStatus] = useState<number | undefined>(undefined);
  // const [oldRewards, setOldRewards] = useState<number>(0);
  // const [oldChatIndex, setOldChatIndex] = useState<number>(0);
>>>>>>> 29f784e9 (Web notifications)

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
      sound: audio.ding,
      timeout: 10000,
      pageTitle: `${t('✅ Bond!')} - ${basePageTitle}`,
    },
    escrowLocked: {
      title: t(`Order collateral locked`),
      severity: 'info',
      sound: audio.ding,
      timeout: 10000,
      pageTitle: `${t('✅ Escrow!')} -  ${basePageTitle}`,
    },
    taken: {
      title: t('Order has been taken!'),
      severity: 'success',
      sound: audio.takerFound,
      timeout: 30000,
      pageTitle: `${t('🥳 Taken!')} - ${basePageTitle}`,
    },
    expired: {
      title: t('Order has expired'),
      severity: 'warning',
      sound: audio.ding,
      timeout: 30000,
      pageTitle: `${t('😪 Expired!')} - ${basePageTitle}`,
    },
    chat: {
      title: t('Order chat is open'),
      severity: 'info',
      sound: audio.chat,
      timeout: 30000,
      pageTitle: `${t('💬 Chat!')} - ${basePageTitle}`,
    },
    successful: {
      title: t('Trade finished successfully!'),
      severity: 'success',
      sound: audio.successful,
      timeout: 10000,
      pageTitle: `${t('🙌 Funished!')} - ${basePageTitle}`,
    },
    routingFailed: {
      title: t('Lightning routing failed'),
      severity: 'warning',
      sound: audio.ding,
      timeout: 20000,
      pageTitle: `${t('❗⚡ Routing Failed')} - ${basePageTitle}`,
    },
    dispute: {
      title: t('Order has been disputed'),
      severity: 'warning',
      sound: audio.ding,
      timeout: 40000,
      pageTitle: `${t('⚖️ Disputed!')} - ${basePageTitle}`,
    },
    disputeWinner: {
      title: t('You won the dispute'),
      severity: 'success',
      sound: audio.ding,
      timeout: 30000,
      pageTitle: `${t('👍 dispute')} - ${basePageTitle}`,
    },
    disputeLoser: {
      title: t('You lost the dispute'),
      severity: 'error',
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
      sound: audio.chat,
      timeout: 3000,
      pageTitle: `${t('💬 message!')} - ${basePageTitle}`,
    },
  };

<<<<<<< HEAD
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

=======
  const handleStatus = function (notification: RoboNotification, order: Order): void {
>>>>>>> 29f784e9 (Web notifications)
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

    const defaultOnClick = () => {
      navigate(`/order/${order.shortAlias}/${order.id}`);
      setShow(false);
    };

    if (notification.order_status === 5) {
      message = Messages.expired;
    } else if (notification.order_status === 1) {
      message = Messages.bondLocked;
    } else if (order.is_taker && notification.order_status === 6) {
      message = Messages.bondLocked;
    } else if (order.is_maker && notification.order_status === 6) {
      message = Messages.taken;
    } else if (order.is_seller && notification.order_status > 7) {
      message = Messages.escrowLocked;
    } else if ([9, 10].includes(notification.order_status)) {
      message = Messages.chat;
    } else if (order.is_seller && [13, 14, 15].includes(notification.order_status)) {
      message = Messages.successful;
    } else if (order.is_buyer && notification.order_status === 14) {
      message = Messages.successful;
    } else if (order.is_buyer && notification.order_status === 15) {
      message = Messages.routingFailed;
    } else if (notification.order_status === 11) {
      message = Messages.dispute;
    } else if (
      (order.is_maker && notification.order_status === 18) ||
      (order.is_taker && notification.order_status === 17)
    ) {
      message = Messages.disputeWinner;
    } else if (
      (order.is_maker && notification.order_status === 17) ||
      (order.is_taker && notification.order_status === 18)
    ) {
      message = Messages.disputeLoser;
    }

    notify({
      ...message,
      onClick: message.onClick ?? defaultOnClick,
    });
  };

<<<<<<< HEAD
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
=======
  const notify: (message: NotificationMessage) => void = (message) => {
    if (message.title !== '') {
      setShow(true);
      setTimeout(() => {
        setShow(false);
      }, message.timeout);
      void audio.ding.play();
      if (!inFocus) {
        setTitleAnimation(
          setInterval(() => {
            const title = document.title;
            document.title = title === basePageTitle ? message.pageTitle : basePageTitle;
          }, 1000),
        );
      }
    }
  };

  const fetchNotifications: () => void = () => {
    clearInterval(timer);
    Object.values(garage.slots).forEach((slot: Slot) => {
      const coordinator = federation.getCoordinator(slot.activeShortAlias);
      coordinator
        .fetchNotifications(garage, slot.token, lastNoticiationCheck)
        .then((data: RoboNotification[]) => {
          data.forEach((notification) => handleStatus(notification, slot.order));
        })
        .finally(() => {
          setLastNoticiationCheck(new Date().toISOString());
          setTimer(setTimeout(fetchNotifications, defaultDelay));
        });
    });
  };
>>>>>>> 29f784e9 (Web notifications)

  useEffect(() => {
    fetchNotifications();
  }, [orderUpdatedAt, rewards]);

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
    <>
      {notifications.map((notification) => (
        <StyledTooltip
          open
          placement={windowWidth > 60 ? 'left' : 'bottom'}
          title={
            <Alert
              severity={notification.severity}
              action={
                <IconButton
                  color='inherit'
                  size='small'
                  onClick={() => {
                    setNotifications((array) => {
                      return array.filter((n) => n.title !== notification.title);
                    });
                  }}
                >
                  <Close fontSize='inherit' />
                </IconButton>
              }
            >
              <div style={{ cursor: 'pointer' }} onClick={notification.onClick}>
                {notification.title}
              </div>
            </Alert>
          }
        >
          <div style={{ ...position, visibility: 'hidden', position: 'absolute' }} />
        </StyledTooltip>
      ))}
    </>
  );
};

export default Notifications;

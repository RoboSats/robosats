import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Tooltip,
  Alert,
  useTheme,
  IconButton,
  TooltipProps,
  styled,
  tooltipClasses,
} from '@mui/material';
import { useHistory } from 'react-router-dom';
import { Order } from '../../models';
import Close from '@mui/icons-material/Close';
import { Page } from '../../basic/NavBar';

interface NotificationsProps {
  order: Order | undefined;
  rewards: number | undefined;
  setPage: (state: Page) => void;
  windowWidth: number;
}

interface NotificationMessage {
  title: string;
  severity: 'error' | 'warning' | 'info' | 'success';
  onClick: () => void;
  sound: HTMLAudioElement | undefined;
  timeout: number;
}

const audio = {
  chat: new Audio(`/static/assets/sounds/chat-open.mp3`),
  takerFound: new Audio(`/static/assets/sounds/taker-found.mp3`),
  lockedInvoice: new Audio(`/static/assets/sounds/locked-invoice.mp3`),
  successful: new Audio(`/static/assets/sounds/successful.mp3`),
};

const emptyNotificationMessage: NotificationMessage = {
  title: '',
  severity: 'info',
  onClick: () => null,
  sound: undefined,
  timeout: 1000,
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
  order,
  rewards,
  setPage,
  windowWidth,
}: NotificationsProps): JSX.Element => {
  const { t } = useTranslation();
  const theme = useTheme();
  const history = useHistory();

  const [lastOrderStatus, setLastOrderStatus] = useState<number | undefined>(undefined);
  const [lastRewards, setLastRewards] = useState<number>(0);
  const [message, setMessage] = useState<NotificationMessage>(emptyNotificationMessage);
  const [show, setShow] = useState<boolean>(false);

  const position = windowWidth > 60 ? { top: '4em', right: '0em' } : { top: '0.5em', left: '50%' };

  interface MessagesProps {
    bondLocked: NotificationMessage;
    escrowLocked: NotificationMessage;
    taken: NotificationMessage;
  }
  const moveToOrderPage = function () {
    setPage('order');
    history.push(`/order/${order?.id}`);
  };

  const Messages: MessagesProps = {
    bondLocked: {
      title: t(`${order?.is_maker ? 'Maker' : 'Taker'} bond locked!`),
      severity: 'success',
      onClick: moveToOrderPage,
      sound: audio.lockedInvoice,
      timeout: 10000,
    },
    escrowLocked: {
      title: t(`Order collateral locked!`),
      severity: 'success',
      onClick: moveToOrderPage,
      sound: audio.lockedInvoice,
      timeout: 10000,
    },
    taken: {
      title: t('Order has been taken!'),
      severity: 'success',
      onClick: moveToOrderPage,
      sound: audio.takerFound,
      timeout: 30000,
    },
  };

  const handleStatusChange = function (lastStatus: number | undefined, status: number) {
    let message = emptyNotificationMessage;
    if (lastStatus == undefined) {
      return null;
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
      // 14: 'Sucessful trade'
      // 15: 'Failed lightning network routing'
      // 16: 'Wait for dispute resolution'
      // 17: 'Maker lost dispute'
      // 18: 'Taker lost dispute'
    } else if (order?.is_maker && status > 0 && lastStatus == 0) {
      message = Messages.bondLocked;
    } else if (order?.is_taker && status > 5 && lastStatus <= 5) {
      message = Messages.bondLocked;
    } else if (order?.is_maker && status > 5 && lastStatus <= 5) {
      message = Messages.taken;
    } else if (order?.is_seller && status > 7 && lastStatus < 7) {
      message = Messages.escrowLocked;
    } else if (status > 10) {
      message = emptyNotificationMessage;
    }

    setMessage(message);
    setShow(true);
    setTimeout(() => setShow(false), message.timeout);
    if (message.sound) {
      message.sound.play();
    }
  };

  useEffect(() => {
    if (order != undefined && order.status != lastOrderStatus) {
      handleStatusChange(lastOrderStatus, order.status);
      setLastOrderStatus(order.status);
    }
  }, [order]);

  return (
    <StyledTooltip
      open={show && message.title != ''}
      style={{ padding: 0, backgroundColor: 'black' }}
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

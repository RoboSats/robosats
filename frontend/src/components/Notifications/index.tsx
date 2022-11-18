import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Tooltip,
  Alert,
  useTheme,
  Box,
  Collapse,
  IconButton,
  TooltipProps,
  styled,
  tooltipClasses,
} from '@mui/material';
import { Order } from '../../models';
import Close from '@mui/icons-material/Close';

interface NotificationsProps {
  order: Order | undefined;
  rewards: number | undefined;
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

const Notifications = ({ order, rewards }: NotificationsProps): JSX.Element => {
  const { t } = useTranslation();
  const theme = useTheme();

  const [lastOrderStatus, setLastOrderStatus] = useState<number>(0);
  const [lastRewards, setLastRewards] = useState<number>(0);
  const [message, setMessage] = useState<NotificationMessage>(emptyNotificationMessage);
  const [show, setShow] = useState<boolean>(true);

  interface MessagesProps {
    taken: NotificationMessage;
  }

  const Messages: MessagesProps = {
    taken: {
      title: t('Order has been taken!'),
      severity: 'success',
      onClick: () => null,
      sound: audio.takerFound,
      timeout: 15000,
    },
  };

  const handleStatusChange = function (lastStatus: number, status: number) {
    let message = emptyNotificationMessage;
    if (status > 5 && lastStatus < 5) {
      message = Messages.taken;
    } else if (status > 10) {
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
      open={show}
      style={{ padding: 0, backgroundColor: 'black' }}
      placement='left'
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
          <div style={{ cursor: 'pointer' }} onClick={() => console.log('CLICKED')}>
            {message.title}
          </div>
        </Alert>
      }
    >
      <div style={{ visibility: 'hidden', position: 'absolute', top: '4em', right: '0em' }} />
    </StyledTooltip>
  );
};

export default Notifications;

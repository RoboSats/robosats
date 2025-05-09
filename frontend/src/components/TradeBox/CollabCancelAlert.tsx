import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from '@mui/material';
import { type Order } from '../../models';

interface CollabCancelAlertProps {
  order: Order | null;
}

const CollabCancelAlert = ({ order }: CollabCancelAlertProps): React.JSX.Element => {
  const { t } = useTranslation();
  let text = '';
  if (order?.pending_cancel === true && order?.status === 9) {
    text = t('{{nickname}} is asking for a collaborative cancel', {
      nickname: order?.is_maker ? order?.taker_nick : order?.maker_nick,
    });
  } else if (order?.asked_for_cancel === true && order?.status === 9) {
    text = t('You asked for a collaborative cancellation');
  }

  return text !== '' ? (
    <Alert severity='warning' style={{ width: '100%' }}>
      {text}
    </Alert>
  ) : (
    <></>
  );
};

export default CollabCancelAlert;

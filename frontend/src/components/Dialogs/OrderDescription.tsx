import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  DialogContentText,
  Button,
  Grid,
} from '@mui/material';
import { Order } from '../../models';

interface Props {
  open: boolean;
  onClose: () => void;
  onClickBack: () => void;
  onClickDone: () => void;
  order: Order;
}

const OrderDescriptionDialog = ({
  open,
  onClose,
  onClickBack,
  onClickDone,
  order,
}: Props): React.JSX.Element => {
  const { t } = useTranslation();

  useEffect(() => {
    if (open && !Boolean(order.description)) {
      onClickDone()
    }
  }, [open])

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{t('Order description')}</DialogTitle>

      <DialogContent>
        <DialogContentText>
          {t('{{description}}', { description: order?.description })}
        </DialogContentText>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClickBack} autoFocus>{t('Go back')}</Button>
        <Button onClick={onClickDone}>{t('Continue')}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrderDescriptionDialog;

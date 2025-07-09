import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  DialogContentText,
  Button,
  Box,
  Typography,
  Link,
  TextField,
  Grid,
} from '@mui/material';
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize';

interface AddNewPaymentMethodDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (newPaymentMethod: string) => void;
}

const AddNewPaymentMethodDialog = ({
  open,
  onClose,
  onConfirm,
}: AddNewPaymentMethodDialogProps): React.JSX.Element => {
  const { t } = useTranslation();
  const [newPaymentMethod, setNewPaymentMethod] = useState<string>();
  const [badInput, setBadInput] = useState<string>();
  const textFieldRef = React.useRef<HTMLDivElement>(null);

  const handleOnSuccess = () => {
    if (newPaymentMethod) {
      onConfirm(newPaymentMethod);
      setNewPaymentMethod(undefined);
      setBadInput(undefined);
    }
  };

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        textFieldRef.current?.focus();
      }, 100); // Delay for 100 milliseconds
      return () => clearTimeout(timer); // Cleanup the timer
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
      <DialogTitle>
        <Box display='flex' alignItems='center' gap={1}>
          <DashboardCustomizeIcon color='primary' />
          {t('Add payment method')}
        </Box>
      </DialogTitle>

      <DialogContent>
        <DialogContentText component='div'>
          <Typography variant='body1' gutterBottom>
            {t("Can't find your favorite payment method in the list?")}
          </Typography>

          <Typography variant='body2' sx={{ mt: 2 }}>
            {t('Use this free input to add any payment method you would like to offer.')}
          </Typography>

          <Grid item style={{ width: '100%' }} sx={{ mt: 2 }}>
            <TextField
              required={true}
              fullWidth
              label={t('Payment method')}
              value={newPaymentMethod}
              inputRef={textFieldRef}
              error={badInput !== undefined}
              variant='outlined'
              helperText={badInput}
              size='medium'
              onChange={(e) => {
                if (e.target.value && e.target.value !== '') {
                  setNewPaymentMethod(e.target.value);
                } else {
                  setNewPaymentMethod(undefined);
                  setBadInput(t("Can't be empty"));
                }
              }}
            />
          </Grid>

          <Typography variant='body2' sx={{ mt: 2 }}>
            {t('If you want to see it available, consider submitting a request on our ')}
            <Link
              target='_blank'
              href='https://github.com/RoboSats/robosats/issues/new?template=payment_method.md'
              rel='noreferrer'
            >
              {t('GitHub')}
            </Link>
          </Typography>
        </DialogContentText>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color='primary'>
          {t('Cancel')}
        </Button>
        <Button
          onClick={handleOnSuccess}
          color='primary'
          variant='contained'
          disabled={!newPaymentMethod || newPaymentMethod === ''}
        >
          {t('Add payment method')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddNewPaymentMethodDialog;

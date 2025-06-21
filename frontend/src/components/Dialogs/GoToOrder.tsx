import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  DialogContentText,
  Button,
  Grid,
  TextField,
  useTheme,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

interface Props {
  open: boolean;
  onClose: () => void;
}

const GoToOrder = ({ open, onClose }: Props): React.JSX.Element => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const [orderUrl, setOrderUrl] = useState<string>();
  const [error, setError] = useState<boolean>(false);

  const navigateToOrder = () => {
    if (orderUrl && orderUrl !== '') {
      const pattern = /^(https?:\/\/[^\s/]+\/order\/([^/]+)\/([^/]+))\/?$/;
      const match = orderUrl.match(pattern);
      if (match) {
        const coordinator = match[2];
        const orderId = match[3];
        navigate(`/order/${coordinator}/${orderId}`);
      } else {
        setError(true);
      }
    } else {
      setError(true);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{t('Search order')}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {t("Enter here an order URL to search for it, even if it's password protected")}
        </DialogContentText>
        <DialogContentText>
          <Grid item sx={{ width: '100%' }}>
            <TextField
              fullWidth
              label={`${t('Order URL')}`}
              type='url'
              error={error}
              value={orderUrl}
              style={{ marginTop: 8 }}
              inputProps={{
                style: {
                  textAlign: 'center',
                  backgroundColor: theme.palette.background.paper,
                  borderRadius: 4,
                },
              }}
              onChange={(e) => setOrderUrl(e.target.value)}
            />
          </Grid>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            onClose();
          }}
        >
          {t('Cancel')}
        </Button>
        <Button onClick={navigateToOrder}>{t('Search')}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default GoToOrder;

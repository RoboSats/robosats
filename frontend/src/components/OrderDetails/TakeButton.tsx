import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContentText,
  DialogActions,
  DialogContent,
  Box,
  Button,
  Tooltip,
  Grid,
  TextField,
  useTheme,
} from '@mui/material';

import Countdown from 'react-countdown';

import currencies from '../../../static/assets/currencies.json';
import { apiClient } from '../../services/api';

import { Order } from '../../models';
import { ConfirmationDialog } from '../Dialogs';
import { Page } from '../../basic/NavBar';
import { LoadingButton } from '@mui/lab';

interface TakeButtonProps {
  order: Order;
  setOrder: (state: Order) => void;
  baseUrl: string;
  hasRobot: boolean;
  setPage: (state: Page) => void;
  handleWebln: (order: Order) => void;
}

interface OpenDialogsProps {
  inactiveMaker: boolean;
  confirmation: boolean;
}
const closeAll = { inactiveMaker: false, confirmation: false };

const TakeButton = ({
  order,
  setOrder,
  baseUrl,
  setPage,
  hasRobot,
  handleWebln,
}: TakeButtonProps): JSX.Element => {
  const { t } = useTranslation();
  const theme = useTheme();

  const [takeAmount, setTakeAmount] = useState<string>('');
  const [loadingTake, setLoadingTake] = useState<boolean>(false);
  const [open, setOpen] = useState<OpenDialogsProps>(closeAll);

  const currencyCode: string = currencies[`${order.currency}`];

  const InactiveMakerDialog = function () {
    return (
      <Dialog open={open.inactiveMaker} onClose={() => setOpen({ ...open, inactiveMaker: false })}>
        <DialogTitle>{t('The maker is away')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t(
              'By taking this order you risk wasting your time. If the maker does not proceed in time, you will be compensated in satoshis for 50% of the maker bond.',
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(closeAll)} autoFocus>
            {t('Go back')}
          </Button>
          <Button onClick={() => setOpen({ inactiveMaker: false, confirmation: true })}>
            {t('Sounds fine')}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  const countdownTakeOrderRenderer = function ({ seconds, completed }) {
    if (isNaN(seconds)) {
      return takeOrderButton();
    }
    if (completed) {
      // Render a completed state
      return takeOrderButton();
    } else {
      return (
        <Tooltip enterTouchDelay={0} title={t('Wait until you can take an order')}>
          <div>
            <LoadingButton
              loading={loadingTake}
              disabled={true}
              variant='contained'
              color='primary'
            >
              {t('Take Order')}
            </LoadingButton>
          </div>
        </Tooltip>
      );
    }
  };

  const handleTakeAmountChange = function (e) {
    if (e.target.value != '' && e.target.value != null) {
      setTakeAmount(`${parseFloat(e.target.value)}`);
    } else {
      setTakeAmount(e.target.value);
    }
  };

  const amountHelperText = function () {
    if (takeAmount < order.min_amount && takeAmount != '') {
      return t('Too low');
    } else if (takeAmount > order.max_amount && takeAmount != '') {
      return t('Too high');
    } else {
      return null;
    }
  };

  const onTakeOrderClicked = function () {
    if (order.maker_status == 'Inactive') {
      setOpen({ inactiveMaker: true, confirmation: false });
    } else {
      setOpen({ inactiveMaker: false, confirmation: true });
    }
  };

  const invalidTakeAmount = function () {
    return (
      takeAmount < order.min_amount ||
      takeAmount > order.max_amount ||
      takeAmount == '' ||
      takeAmount == null
    );
  };

  const takeOrderButton = function () {
    if (order.has_range) {
      return (
        <Box
          sx={{
            padding: '0.5em',
            backgroundColor: 'background.paper',
            border: '1px solid',
            borderRadius: '4px',
            borderColor: theme.palette.mode === 'dark' ? '#434343' : '#c4c4c4',
            '&:hover': {
              borderColor: theme.palette.mode === 'dark' ? '#ffffff' : '#2f2f2f',
            },
          }}
        >
          <Grid container direction='row' alignItems='stretch' justifyContent='center'>
            <Grid item>
              <Tooltip
                placement='top'
                enterTouchDelay={500}
                enterDelay={700}
                enterNextDelay={2000}
                title={t('Enter amount of fiat to exchange for bitcoin')}
              >
                <TextField
                  error={
                    (takeAmount < order.min_amount || takeAmount > order.max_amount) &&
                    takeAmount != ''
                  }
                  helperText={amountHelperText()}
                  label={t('Amount {{currencyCode}}', { currencyCode })}
                  size='small'
                  type='number'
                  required={true}
                  value={takeAmount}
                  inputProps={{
                    min: order.min_amount,
                    max: order.max_amount,
                    style: { textAlign: 'center' },
                  }}
                  onChange={handleTakeAmountChange}
                />
              </Tooltip>
            </Grid>
            <Grid item>
              <div
                style={{
                  display: invalidTakeAmount() ? '' : 'none',
                }}
              >
                <Tooltip
                  placement='top'
                  enterTouchDelay={0}
                  enterDelay={500}
                  enterNextDelay={1200}
                  title={t('You must specify an amount first')}
                >
                  <div>
                    <LoadingButton
                      loading={loadingTake}
                      sx={{ height: '2.71em' }}
                      variant='contained'
                      color='primary'
                      disabled={true}
                    >
                      {t('Take Order')}
                    </LoadingButton>
                  </div>
                </Tooltip>
              </div>
              <div
                style={{
                  display: invalidTakeAmount() ? 'none' : '',
                }}
              >
                <LoadingButton
                  loading={loadingTake}
                  variant='contained'
                  color='primary'
                  onClick={onTakeOrderClicked}
                >
                  {t('Take Order')}
                </LoadingButton>
              </div>
            </Grid>
          </Grid>
        </Box>
      );
    } else {
      return (
        <LoadingButton
          loading={loadingTake}
          sx={{ height: '2.71em' }}
          variant='contained'
          color='primary'
          onClick={onTakeOrderClicked}
        >
          {t('Take Order')}
        </LoadingButton>
      );
    }
  };

  const takeOrder = function () {
    setLoadingTake(true);
    apiClient
      .post(baseUrl, '/api/order/?order_id=' + order.id, {
        action: 'take',
        amount: takeAmount,
      })
      .then((data) => {
        handleWebln(data);
        setOrder(data);
        setLoadingTake(false);
      });
  };

  return (
    <Box>
      <Countdown date={new Date(order.penalty)} renderer={countdownTakeOrderRenderer} />
      <ConfirmationDialog
        open={open.confirmation}
        onClose={() => setOpen({ ...open, confirmation: false })}
        setPage={setPage}
        onClickDone={() => {
          takeOrder();
          setLoadingTake(true);
          setOpen(closeAll);
        }}
        hasRobot={hasRobot}
      />
      <InactiveMakerDialog />
    </Box>
  );
};

export default TakeButton;

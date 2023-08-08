import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Typography,
  Grid,
  ToggleButton,
  ToggleButtonGroup,
  Select,
  Divider,
  MenuItem,
  Box,
  Tooltip,
} from '@mui/material';
import currencyDict from '../../../static/assets/currencies.json';
import { useTheme } from '@mui/system';
import { AutocompletePayments } from '../MakerForm';
import { fiatMethods, swapMethods, PaymentIcon } from '../PaymentMethods';
import { FlagWithProps } from '../Icons';

import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import { type Favorites } from '../../models';
import SwapCalls from '@mui/icons-material/SwapCalls';

interface BookControlProps {
  width: number;
  fav: Favorites;
  setFav: (state: Favorites) => void;
  paymentMethod: string[];
  setPaymentMethods: (state: string[]) => void;
}

const BookControl = ({
  width,
  fav,
  setFav,
  paymentMethod,
  setPaymentMethods,
}: BookControlProps): JSX.Element => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();

  const [typeZeroText, typeOneText, small, medium, large] = useMemo(() => {
    const typeZeroText = fav.mode === 'fiat' ? t('Buy') : t('Swap In');
    const typeOneText = fav.mode === 'fiat' ? t('Sell') : t('Swap Out');
    const small =
      (typeZeroText.length + typeOneText.length) * 0.7 + (fav.mode === 'fiat' ? 16 : 7.5);
    const medium = small + 13;
    const large = medium + (t('and use').length + t('pay with').length) * 0.6 + 5;
    return [typeZeroText, typeOneText, small, medium, large];
  }, [i18n.language, fav.mode]);

  const handleCurrencyChange = function (e: React.ChangeEvent<HTMLInputElement>): void {
    const currency = Number(e.target.value);
    setFav({ ...fav, currency, mode: currency === 1000 ? 'swap' : 'fiat' });
  };

  const handleTypeChange = function (mouseEvent: React.MouseEvent, val: number): void {
    setFav({ ...fav, type: val });
  };

  const handleModeChange = function (mouseEvent: React.MouseEvent, val: number): void {
    const mode = fav.mode === 'fiat' ? 'swap' : 'fiat';
    const currency = fav.mode === 'fiat' ? 1000 : 0;
    setFav({ ...fav, mode, currency });
  };

  return (
    <Box>
      <Grid
        container
        alignItems='flex-start'
        direction='row'
        justifyContent='center'
        spacing={0.5}
        sx={{ height: '3.4em', padding: '0.2em' }}
      >
        {width > large ? (
          <Grid item sx={{ position: 'relative', top: '0.5em' }}>
            <Typography variant='caption' color='text.secondary'>
              {t('I want to')}
            </Typography>
          </Grid>
        ) : null}

        {width > small ? (
          <Grid item>
            <Tooltip
              placement='bottom'
              enterTouchDelay={200}
              enterDelay={700}
              enterNextDelay={2000}
              title={t('Show Lightning swaps')}
            >
              <ToggleButtonGroup
                sx={{
                  height: '2.6em',
                  backgroundColor: theme.palette.background.paper,
                  border: '0.5px solid',
                  borderColor: 'text.disabled',
                  '&:hover': {
                    borderColor: 'text.primary',
                    border: '1px solid',
                  },
                }}
                size='small'
                exclusive={true}
                value={fav.mode}
                onChange={handleModeChange}
              >
                <ToggleButton value={'swap'} color={'secondary'}>
                  <SwapCalls />
                </ToggleButton>
              </ToggleButtonGroup>
            </Tooltip>
          </Grid>
        ) : null}

        <Grid item>
          <ToggleButtonGroup
            sx={{
              height: '2.6em',
              backgroundColor: theme.palette.background.paper,
              border: '0.5px solid',
              borderColor: 'text.disabled',
              '&:hover': {
                borderColor: 'text.primary',
                border: '1px solid',
              },
            }}
            size='small'
            exclusive={true}
            value={fav.type}
            onChange={handleTypeChange}
          >
            <ToggleButton value={1} color={'primary'}>
              {typeZeroText}
            </ToggleButton>
            <ToggleButton value={0} color={'secondary'}>
              {typeOneText}
            </ToggleButton>
          </ToggleButtonGroup>
        </Grid>

        {width > large && fav.mode === 'fiat' ? (
          <Grid item sx={{ position: 'relative', top: '0.5em' }}>
            <Typography variant='caption' color='text.secondary'>
              {t('and use')}
            </Typography>
          </Grid>
        ) : null}

        {fav.mode === 'fiat' ? (
          <Grid item>
            <Select
              autoWidth
              sx={{
                height: '2.3em',
                border: '0.5px solid',
                backgroundColor: theme.palette.background.paper,
                borderRadius: '4px',
                borderColor: 'text.disabled',
                '&:hover': {
                  borderColor: 'text.primary',
                },
              }}
              size='small'
              label={t('Select Payment Currency')}
              required={true}
              value={fav.currency}
              inputProps={{
                style: { textAlign: 'center' },
              }}
              onChange={handleCurrencyChange}
            >
              <MenuItem value={0}>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                  <FlagWithProps code='ANY' />
                  <Typography sx={{ width: '2em' }} align='right' color='text.secondary'>
                    {' ' + t('ANY')}
                  </Typography>
                </div>
              </MenuItem>
              {Object.entries(currencyDict).map(([key, value]) => (
                <MenuItem key={key} value={parseInt(key)} color='text.secondary'>
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                    <FlagWithProps code={value} />
                    <Typography sx={{ width: '2em' }} align='right' color='text.secondary'>
                      {' ' + value}
                    </Typography>
                  </div>
                </MenuItem>
              ))}
            </Select>
          </Grid>
        ) : null}

        {width > large ? (
          <Grid item sx={{ position: 'relative', top: '0.5em' }}>
            <Typography variant='caption' color='text.secondary'>
              {fav.currency === 1000 ? t(fav.type === 0 ? 'to' : 'from') : t('pay with')}
            </Typography>
          </Grid>
        ) : null}

        {width > medium ? (
          <Grid item>
            <AutocompletePayments
              sx={{
                minHeight: '2.6em',
                width: '12em',
                maxHeight: '2.6em',
                border: '2px solid',
                borderColor: theme.palette.text.disabled,
                hoverBorderColor: 'text.primary',
              }}
              labelProps={{ sx: { top: '0.645em' } }}
              tagProps={{ sx: { height: '1.8em' } }}
              listBoxProps={{ sx: { width: '13em' } }}
              onAutocompleteChange={setPaymentMethods}
              value={paymentMethod}
              optionsType={fav.currency === 1000 ? 'swap' : 'fiat'}
              error={false}
              helperText={''}
              label={fav.currency === 1000 ? t('DESTINATION') : t('METHOD')}
              tooltipTitle=''
              listHeaderText=''
              addNewButtonText=''
              isFilter={true}
            />
          </Grid>
        ) : null}

        {width > small && width <= medium ? (
          <Grid item>
            <Select
              sx={{
                height: '2.3em',
                border: '0.5px solid',
                backgroundColor: theme.palette.background.paper,
                borderRadius: '4px',
                borderColor: 'text.disabled',
                '&:hover': {
                  borderColor: 'text.primary',
                },
              }}
              size='small'
              label={t('Select Payment Method')}
              required={true}
              renderValue={(value) =>
                value === 'ANY' ? (
                  <CheckBoxOutlineBlankIcon style={{ position: 'relative', top: '0.1em' }} />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <PaymentIcon width={22} height={22} icon={value.icon} />
                  </div>
                )
              }
              inputProps={{
                style: { textAlign: 'center' },
              }}
              value={paymentMethod[0] ?? 'ANY'}
              onChange={(e) => {
                setPaymentMethods(e.target.value === 'ANY' ? [] : [e.target.value]);
              }}
            >
              <MenuItem value={'ANY'}>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                  <CheckBoxOutlineBlankIcon />
                  <div style={{ width: '0.3em' }} />
                  <Typography sx={{ width: '2em' }} align='right' color='text.secondary'>
                    {' ' + t('ANY')}
                  </Typography>
                </div>
              </MenuItem>
              {fav.currency === 1000
                ? swapMethods.map((method, index) => (
                    <MenuItem
                      style={{ width: '10em' }}
                      key={index}
                      value={method}
                      color='text.secondary'
                    >
                      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                        <PaymentIcon width={22} height={22} icon={method.icon} />
                        <div style={{ width: '0.3em' }} />
                        <Typography sx={{ width: '2em' }} align='right' color='text.secondary'>
                          {' ' + method.name}
                        </Typography>
                      </div>
                    </MenuItem>
                  ))
                : fiatMethods.map((method, index) => (
                    <MenuItem
                      style={{ width: '14em' }}
                      key={index}
                      value={method}
                      color='text.secondary'
                    >
                      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                        <PaymentIcon width={22} height={22} icon={method.icon} />
                        <div style={{ width: '0.3em' }} />
                        <Typography sx={{ width: '2em' }} align='right' color='text.secondary'>
                          {' ' + method.name}
                        </Typography>
                      </div>
                    </MenuItem>
                  ))}
            </Select>
          </Grid>
        ) : null}
      </Grid>
      <Divider />
    </Box>
  );
};

export default BookControl;

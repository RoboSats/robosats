import React, { useEffect, useState } from 'react';
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
} from '@mui/material';
import currencyDict from '../../../static/assets/currencies.json';
import { useTheme } from '@mui/system';
import { AutocompletePayments } from '../MakerForm';
import { fiatMethods, swapMethods, PaymentIcon } from '../PaymentMethods';
import { FlagWithProps } from '../Icons';

import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';

interface BookControlProps {
  width: number;
  type: number;
  currency: number;
  paymentMethod: string[];
  onCurrencyChange: () => void;
  onTypeChange: () => void;
  setPaymentMethods: () => void;
}

const BookControl = ({
  width,
  type,
  currency,
  onCurrencyChange,
  onTypeChange,
  paymentMethod,
  setPaymentMethods,
}: BookControlProps): JSX.Element => {
  const { t } = useTranslation();
  const theme = useTheme();

  const smallestToolbarWidth = (t('Buy').length + t('Sell').length) * 0.7 + 12;
  const mediumToolbarWidth = smallestToolbarWidth + 12;
  const verboseToolbarWidth =
    mediumToolbarWidth + (t('and use').length + t('pay with').length) * 0.6;

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
        {width > verboseToolbarWidth ? (
          <Grid item sx={{ position: 'relative', top: '0.5em' }}>
            <Typography variant='caption' color='text.secondary'>
              {t('I want to')}
            </Typography>
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
            value={type}
            onChange={onTypeChange}
          >
            <ToggleButton value={1} color={'primary'}>
              {t('Buy')}
            </ToggleButton>
            <ToggleButton value={0} color={'secondary'}>
              {t('Sell')}
            </ToggleButton>
          </ToggleButtonGroup>
        </Grid>

        {width > verboseToolbarWidth ? (
          <Grid item sx={{ position: 'relative', top: '0.5em' }}>
            <Typography variant='caption' color='text.secondary'>
              {t('and use')}
            </Typography>
          </Grid>
        ) : null}

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
            value={currency}
            inputProps={{
              style: { textAlign: 'center' },
            }}
            onChange={onCurrencyChange}
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

        {width > verboseToolbarWidth ? (
          <Grid item sx={{ position: 'relative', top: '0.5em' }}>
            <Typography variant='caption' color='text.secondary'>
              {currency == 1000 ? t('swap to') : t('pay with')}
            </Typography>
          </Grid>
        ) : null}

        {width > mediumToolbarWidth && window.NativeRobosats === undefined ? (
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
              optionsType={currency == 1000 ? 'swap' : 'fiat'}
              error={false}
              helperText={''}
              label={currency == 1000 ? t('DESTINATION') : t('METHOD')}
              tooltipTitle=''
              listHeaderText=''
              addNewButtonText=''
              isFilter={true}
            />
          </Grid>
        ) : null}

        {/* Native Android app must always show the Select, as the on display keyboard does not play well with the book table component */}
        {(width > smallestToolbarWidth && width < mediumToolbarWidth) ||
        window.NativeRobosats != undefined ? (
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
                value == 'ANY' ? (
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
              value={paymentMethod[0] ? paymentMethod[0] : 'ANY'}
              onChange={(e) => setPaymentMethods(e.target.value == 'ANY' ? [] : [e.target.value])}
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
              {currency === 1000
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

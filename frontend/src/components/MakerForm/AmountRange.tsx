import React, { useContext, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  SliderThumb,
  Grid,
  Typography,
  TextField,
  Select,
  MenuItem,
  Box,
  useTheme,
} from '@mui/material';

import { FlagWithProps } from '../Icons';
import RangeSlider from './RangeSlider';
import currencyDict from '../../../static/assets/currencies.json';
import { pn } from '../../utils';
import { GarageContext, UseGarageStoreType } from '../../contexts/GarageContext';

const RangeThumbComponent: React.FC<React.PropsWithChildren> = (props) => {
  const { children, ...other } = props;
  return (
    <SliderThumb {...other}>
      {children}
      <span className='range-bar' />
      <span className='range-bar' />
      <span className='range-bar' />
    </SliderThumb>
  );
};

interface AmountRangeProps {
  amountSafeThresholds: number[];
  currency: number;
  setHasRangeError: (hasRangeError: boolean) => void;
  handleCurrencyChange: (newCurrency: number) => void;
  currencyCode: string;
  amountLimits: number[];
}

const AmountRange: React.FC<AmountRangeProps> = ({
  amountSafeThresholds,
  currency,
  currencyCode,
  handleCurrencyChange,
  setHasRangeError,
  amountLimits,
}) => {
  const { setMaker, maker } = useContext<UseGarageStoreType>(GarageContext);
  const theme = useTheme();
  const { t } = useTranslation();
  const maxRangeAmountMultiple = 14.8;
  const minRangeAmountMultiple = 1.6;

  const minAmountError = useMemo(() => {
    return (
      maker.maxAmount !== null &&
      maker.minAmount !== null &&
      (maker.minAmount < amountLimits[0] * 0.99 ||
        maker.maxAmount < maker.minAmount ||
        maker.minAmount < maker.maxAmount / (maxRangeAmountMultiple + 0.15) ||
        maker.minAmount * (minRangeAmountMultiple - 0.1) > maker.maxAmount)
    );
  }, [maker.minAmount, maker.maxAmount, amountLimits]);

  const maxAmountError = useMemo(() => {
    return (
      maker.maxAmount !== null &&
      maker.minAmount !== null &&
      (maker.maxAmount > amountLimits[1] * 1.01 ||
        maker.maxAmount < maker.minAmount ||
        maker.minAmount < maker.maxAmount / (maxRangeAmountMultiple + 0.15) ||
        maker.minAmount * (minRangeAmountMultiple - 0.1) > maker.maxAmount)
    );
  }, [maker.minAmount, maker.maxAmount, amountLimits]);

  const handleRangeAmountChange = (
    e: Event,
    newValue: number | number[],
    activeThumb: number,
  ): void => {
    if (typeof newValue === 'number' || newValue.length < 2) return;

    let minAmount = newValue[0];
    let maxAmount = newValue[1];

    minAmount = Math.min(
      (amountLimits[1] * amountSafeThresholds[1]) / minRangeAmountMultiple,
      minAmount,
    );
    maxAmount = Math.max(
      minRangeAmountMultiple * amountLimits[0] * amountSafeThresholds[0],
      maxAmount,
    );

    if (minAmount > maxAmount / minRangeAmountMultiple) {
      if (activeThumb === 0) {
        maxAmount = minRangeAmountMultiple * minAmount;
      } else {
        minAmount = maxAmount / minRangeAmountMultiple;
      }
    } else if (minAmount < maxAmount / maxRangeAmountMultiple) {
      if (activeThumb === 0) {
        maxAmount = maxRangeAmountMultiple * minAmount;
      } else {
        minAmount = maxAmount / maxRangeAmountMultiple;
      }
    }

    setMaker({
      ...maker,
      minAmount: parseFloat(minAmount.toPrecision(minAmount < 100 ? 2 : 3)),
      maxAmount: parseFloat(maxAmount.toPrecision(maxAmount < 100 ? 2 : 3)),
    });
  };

  useEffect(() => {
    setHasRangeError(minAmountError || maxAmountError);
  }, [minAmountError, maxAmountError]);

  return (
    <Grid item xs={12}>
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
        <Grid container direction='column' alignItems='center' spacing={0.5}>
          <Grid item sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography
              sx={{
                width: `${t('From').length * 0.56 + 0.6}em`,
                textAlign: 'left',
                color: 'text.secondary',
              }}
              variant='caption'
            >
              {t('From')}
            </Typography>
            <TextField
              variant='standard'
              type='number'
              size='small'
              value={maker.minAmount?.toString()}
              onChange={(e) => {
                setMaker((maker) => {
                  const value = Number(e.target.value);
                  return {
                    ...maker,
                    minAmount: parseFloat(value.toPrecision(value < 100 ? 2 : 3)),
                  };
                });
              }}
              error={minAmountError}
              sx={{
                width: `${(maker.minAmount?.toString().length ?? 0) * 0.56}em`,
                minWidth: '0.56em',
                maxWidth: '2.8em',
              }}
            />
            <Typography
              sx={{
                width: `${t('to').length * 0.56 + 0.6}em`,
                textAlign: 'center',
                color: 'text.secondary',
              }}
              variant='caption'
            >
              {t('to')}
            </Typography>
            <TextField
              variant='standard'
              size='small'
              type='number'
              value={maker.maxAmount?.toString()}
              onChange={(e) => {
                setMaker((maker) => {
                  const value = Number(e.target.value);
                  return {
                    ...maker,
                    maxAmount: parseFloat(value.toPrecision(value < 100 ? 2 : 3)),
                  };
                });
              }}
              error={maxAmountError}
              sx={{
                width: `${(maker.maxAmount?.toString().length ?? 0) * 0.56}em`,
                minWidth: '0.56em',
                maxWidth: '3.36em',
              }}
            />
            <div style={{ width: '0.5em' }} />
            <Select
              sx={{ width: '3.8em' }}
              variant='standard'
              size='small'
              required={true}
              inputProps={{
                style: { textAlign: 'center' },
              }}
              value={currency === 0 ? 1 : currency}
              renderValue={() => currencyCode}
              onChange={(e) => {
                handleCurrencyChange(Number(e.target.value));
              }}
            >
              {Object.entries(currencyDict).map(([key, value]) => (
                <MenuItem key={key} value={parseInt(key)}>
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                    <FlagWithProps code={value} />
                    {' ' + value}
                  </div>
                </MenuItem>
              ))}
            </Select>
          </Grid>

          <Grid
            item
            sx={{
              width: `calc(100% - ${Math.abs(Math.log10(amountLimits[1]) * 0.65) + 2}em)`,
            }}
          >
            <RangeSlider
              disableSwap={true}
              value={[maker.minAmount ?? amountLimits[0], maker.maxAmount ?? amountLimits[1]]}
              step={(amountLimits[1] - amountLimits[0]) / 5000}
              valueLabelDisplay='auto'
              components={{ Thumb: RangeThumbComponent }}
              componentsProps={{
                thumb: { style: { backgroundColor: theme.palette.background.paper } },
              }}
              valueLabelFormat={(x) =>
                pn(parseFloat(Number(x).toPrecision(x < 100 ? 2 : 3))) + ' ' + currencyCode
              }
              marks={[
                {
                  value: amountLimits[0],
                  label: `${pn(
                    parseFloat(Number(amountLimits[0]).toPrecision(3)),
                  )} ${currencyCode}`,
                },
                {
                  value: amountLimits[1],
                  label: `${pn(
                    parseFloat(Number(amountLimits[1]).toPrecision(3)),
                  )} ${currencyCode}`,
                },
              ]}
              min={amountLimits[0]}
              max={amountLimits[1]}
              onChange={handleRangeAmountChange}
            />
          </Grid>
        </Grid>
      </Box>
    </Grid>
  );
};

export default AmountRange;

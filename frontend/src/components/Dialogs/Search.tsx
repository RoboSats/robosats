import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Dialog,
  DialogContent,
  Grid,
  Typography,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  ButtonGroup,
  Select,
  useTheme,
  MenuItem,
} from '@mui/material';

import { SwapCalls } from '@mui/icons-material';
import currencyDict from '../../../static/assets/currencies.json';
import { FlagWithProps, SendReceiveIcon } from '../Icons';
import { UseAppStoreType, AppContext, initialAppContext } from '../../contexts/AppContext';
import { useNavigate } from 'react-router-dom';

interface Props {
  open: boolean;
  onClose: () => void;
}

const SearchDialog = ({ open = false, onClose }: Props): React.JSX.Element => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const { fav, setFav, navigateToPage } = useContext<UseAppStoreType>(AppContext);
  const [step, setStep] = useState<'1' | '2' | '3'>('1');

  useEffect(() => {
    if (open) {
      setStep('1');
      setFav(initialAppContext.fav);
    }
  }, [open]);

  useEffect(() => {
    if (step === '3') {
      navigateToPage('offers', navigate);
    }
  }, [step]);

  const handleCurrencyChange = function (e: React.ChangeEvent<HTMLInputElement>): void {
    const currency = Number(e.target.value);
    setFav({ ...fav, currency, mode: currency === 1000 ? 'swap' : 'fiat' });
    setStep('3');
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent>
        <Typography align='center' component='h5' variant='h5'>
          {t('Search for orders')}
        </Typography>
        <Box>
          <Accordion expanded={step === '1'} disableGutters={true}>
            <AccordionSummary>
              <Typography variant='h5' color={step === '1' ? 'text.primary' : 'text.disabled'}>
                {t('I want to')}
                {'...'}
              </Typography>
            </AccordionSummary>

            <AccordionDetails>
              <Grid container direction='column' alignItems='center' spacing={1} padding={1}>
                <Grid item>
                  <Typography>{t('Are you looking to sell your Bitcoins or buy some?')}</Typography>
                </Grid>
                <Grid item>
                  <Grid container direction='column' alignItems='center' spacing={1}>
                    <Grid item>
                      <ButtonGroup variant='contained'>
                        <Button
                          color='secondary'
                          onClick={() => {
                            setFav({ ...fav, mode: 'fiat', type: 0 });
                            setStep('2');
                          }}
                        >
                          <SendReceiveIcon sx={{ transform: 'scaleX(-1)' }} />{' '}
                          <div style={{ width: '0.5em' }} />
                          {t('Sell')}
                        </Button>
                        <Button
                          color='primary'
                          onClick={() => {
                            setFav({ ...fav, mode: 'fiat', type: 1 });
                            setStep('2');
                          }}
                        >
                          <SendReceiveIcon /> <div style={{ width: '0.5em' }} />
                          {t('Buy')}
                        </Button>
                      </ButtonGroup>
                    </Grid>
                  </Grid>
                </Grid>
                <Grid item>
                  <Typography>
                    {t('Do you want to swap from on-chain into Lightning or vice versa?')}
                  </Typography>
                </Grid>
                <Grid item>
                  <Grid container direction='column' alignItems='center' spacing={1}>
                    <Grid item>
                      <ButtonGroup variant='contained'>
                        <Button
                          color='primary'
                          onClick={() => {
                            setFav({ ...fav, mode: 'swap', type: 1 });
                            setStep('3');
                          }}
                        >
                          <SwapCalls /> <div style={{ width: '0.5em' }} />
                          {t('Swap into LN')}
                        </Button>
                        <Button
                          color='secondary'
                          onClick={() => {
                            setFav({ ...fav, mode: 'swap', type: 0 });
                            setStep('3');
                          }}
                        >
                          <SwapCalls /> <div style={{ width: '0.5em' }} />
                          {t('Swap out of LN')}
                        </Button>
                      </ButtonGroup>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          <Accordion expanded={step === '2'} disableGutters={true}>
            <AccordionSummary>
              <Typography variant='h5' color={step === '2' ? 'text.primary' : 'text.disabled'}>
                {t('and use')}
                {'...'}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container direction='column' alignItems='center' spacing={1}>
                <Grid item>
                  <Typography>
                    {t('You can specify the currency you want to use for your trade.')}
                  </Typography>
                </Grid>
                <Grid item>
                  <Select
                    autoWidth
                    sx={{
                      height: '2.6em',
                      border: '0.5px solid',
                      backgroundColor: theme.palette.background.paper,
                      borderRadius: '4px',
                      borderColor: 'text.disabled',
                      '&:hover': {
                        borderColor: 'text.primary',
                      },
                    }}
                    size='large'
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
                        <Typography align='right' color='text.secondary'>
                          {t('Choose a currency')}
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
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default SearchDialog;

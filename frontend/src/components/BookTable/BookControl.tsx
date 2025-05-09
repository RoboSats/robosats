import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Grid, Select, Divider, MenuItem, Box } from '@mui/material';
import currencyDict from '../../../static/assets/currencies.json';
import { useTheme } from '@mui/system';
import { AutocompletePayments } from '../MakerForm';
import { fiatMethods, swapMethods, PaymentIcon } from '../PaymentMethods';
import { FlagWithProps, SendReceiveIcon } from '../Icons';
import { AppContext, type UseAppStoreType } from '../../contexts/AppContext';

import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import SwapCalls from '@mui/icons-material/SwapCalls';
import { FederationContext, type UseFederationStoreType } from '../../contexts/FederationContext';
import RobotAvatar from '../RobotAvatar';
import RoboSatsNoText from '../Icons/RoboSatsNoText';

interface BookControlProps {
  width: number;
  paymentMethod: string[];
  setPaymentMethods: (state: string[]) => void;
}

const BookControl = ({
  width,
  paymentMethod,
  setPaymentMethods,
}: BookControlProps): React.JSX.Element => {
  const { fav, setFav } = useContext<UseAppStoreType>(AppContext);
  const { federation } = useContext<UseFederationStoreType>(FederationContext);

  const { t, i18n } = useTranslation();
  const theme = useTheme();

  const [orderType, setOrderType] = useState<string>('any');
  const [small, medium, large] = useMemo(() => {
    const small = fav.mode === 'fiat' ? 16 : 7.5;
    const medium = small + 13;
    const large = medium + (t('and use').length + t('pay with').length) * 0.6 + 5;
    return [small, medium, large];
  }, [i18n.language, fav.mode]);

  useEffect(() => {
    if (fav.type === null) {
      setOrderType('any');
    } else if (fav.mode === 'fiat') {
      setOrderType(fav.type === 1 ? 'buy' : 'sell');
    } else {
      setOrderType(fav.type === 1 ? 'swapin' : 'swapout');
    }
  }, [fav.mode, fav.type]);

  const handleCurrencyChange = function (e: React.ChangeEvent<HTMLInputElement>): void {
    const currency = Number(e.target.value);
    setFav({ ...fav, currency, mode: currency === 1000 ? 'swap' : 'fiat' });
  };

  const handleHostChange = function (e: React.ChangeEvent<HTMLInputElement>): void {
    const coordinator = String(e.target.value);
    if (coordinator === 'any') {
      federation.refreshBookHosts(coordinator !== 'any');
    }
    setFav({ ...fav, coordinator });
  };

  const handleOrderTypeChange = (mouseEvent: React.MouseEvent, select: object): void => {
    if (select.props.value === 'sell') {
      const currency = fav.currency === 1000 ? 0 : fav.currency;
      setFav({ ...fav, mode: 'fiat', type: 0, currency });
    } else if (select.props.value === 'buy') {
      const currency = fav.currency === 1000 ? 0 : fav.currency;
      setFav({ ...fav, mode: 'fiat', type: 1, currency });
    } else if (select.props.value === 'swapin') {
      setFav({ ...fav, mode: 'swap', type: 1, currency: 1000 });
    } else if (select.props.value === 'swapout') {
      setFav({ ...fav, mode: 'swap', type: 0, currency: 1000 });
    } else {
      const currency = fav.currency === 1000 ? 0 : fav.currency;
      setFav({ ...fav, mode: 'fiat', type: null, currency });
    }
    setOrderType(select.props.value);
  };

  const orderTypeIcon = (value: string): React.ReactNode => {
    let component = <CheckBoxOutlineBlankIcon />;
    let text = t('ANY');
    if (value === 'sell') {
      component = <SendReceiveIcon color='secondary' sx={{ transform: 'scaleX(-1)' }} />;
      text = t('Sell');
    } else if (value === 'buy') {
      component = <SendReceiveIcon color='primary' />;
      text = t('Buy');
    } else if (value === 'swapin') {
      component = <SwapCalls color='secondary' />;
      text = t('Swap In');
    } else if (value === 'swapout') {
      component = <SwapCalls color='primary' />;
      text = t('Swap Out');
    }

    return (
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', marginRight: 1 }}>
        {component}
        {width > medium ? (
          <Typography sx={{ width: '2em' }} align='right' color='text.secondary'>
            {` ${text}`}
          </Typography>
        ) : (
          <></>
        )}
      </div>
    );
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
            label={t('Select Order Type')}
            required={true}
            value={orderType}
            inputProps={{
              style: { textAlign: 'center' },
            }}
            renderValue={orderTypeIcon}
            onChange={handleOrderTypeChange}
          >
            <MenuItem value='any' style={{ width: '8em' }}>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                <CheckBoxOutlineBlankIcon />
                <Typography sx={{ width: '2em' }} align='right' color='text.secondary'>
                  {' ' + t('ANY')}
                </Typography>
              </div>
            </MenuItem>
            <MenuItem value='sell' style={{ width: '8em' }}>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                <SendReceiveIcon color='secondary' sx={{ transform: 'scaleX(-1)' }} />
                <Typography sx={{ width: '2em' }} align='right' color='text.secondary'>
                  {' ' + t('Sell')}
                </Typography>
              </div>
            </MenuItem>
            <MenuItem value='buy' style={{ width: '8em' }}>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                <SendReceiveIcon color='primary' />
                <Typography sx={{ width: '2em' }} align='right' color='text.secondary'>
                  {' ' + t('Buy')}
                </Typography>
              </div>
            </MenuItem>
            <MenuItem value='swapin' style={{ width: '8em' }}>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                <SwapCalls color='secondary' />
                <Typography sx={{ width: '2em' }} align='right' color='text.secondary'>
                  {' ' + t('Swap In')}
                </Typography>
              </div>
            </MenuItem>
            <MenuItem value='swapout' style={{ width: '8em' }}>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                <SwapCalls color='primary' />
                <Typography sx={{ width: '2em' }} align='right' color='text.secondary'>
                  {' ' + t('Swap Out')}
                </Typography>
              </div>
            </MenuItem>
          </Select>
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
              addNewButtonText=''
              isFilter={true}
              multiple={true}
              optionsDisplayLimit={1}
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

        {width > large ? (
          <Grid item sx={{ position: 'relative', top: '0.5em' }}>
            <Typography variant='caption' color='text.secondary'>
              {fav.currency === 1000 ? t(fav.type === 0 ? 'to' : 'from') : t('hosted by')}
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
            label={t('Select Host')}
            required={true}
            value={fav.coordinator}
            inputProps={{
              style: { textAlign: 'center' },
            }}
            onChange={handleHostChange}
          >
            <MenuItem value='any'>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                <FlagWithProps code='ANY' />
              </div>
            </MenuItem>
            <MenuItem value='robosats'>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                <RoboSatsNoText sx={{ color: '#1976d2' }} />
              </div>
            </MenuItem>
            {federation
              .getCoordinators()
              .filter((coord) => coord.enabled)
              .map((coordinator) => (
                <MenuItem
                  key={coordinator.shortAlias}
                  value={coordinator.shortAlias}
                  color='text.secondary'
                >
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                    <RobotAvatar
                      shortAlias={coordinator.federated ? coordinator.shortAlias : undefined}
                      hashId={coordinator.federated ? undefined : coordinator.mainnet.onion}
                      style={{ width: '1.55em', height: '1.55em' }}
                      smooth={true}
                      small={true}
                    />
                  </div>
                </MenuItem>
              ))}
          </Select>
        </Grid>
      </Grid>
      <Divider />
    </Box>
  );
};

export default BookControl;

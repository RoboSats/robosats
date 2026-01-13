import React, { useState, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Grid,
  LinearProgress,
  Typography,
  Box,
  useTheme,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Bolt, Download, Settings, DeleteSweep } from '@mui/icons-material';
import RobotAvatar from '../../components/RobotAvatar';
import GarageKeyInput from './GarageKeyInput';
import AccountNavigator from './AccountNavigator';
import { AppContext, closeAll, type UseAppStoreType } from '../../contexts/AppContext';
import { GarageContext, type UseGarageStoreType } from '../../contexts/GarageContext';
import { type UseFederationStoreType, FederationContext } from '../../contexts/FederationContext';
import { DeleteGarageKeyConfirmationDialog } from '../../components/Dialogs';

interface GarageKeyProfileProps {
  setView: (state: 'welcome' | 'onboarding' | 'profile') => void;
  inputGarageKey: string;
  setInputGarageKey: (state: string) => void;
  width: number;
}

const GarageKeyProfile = ({
  setView,
  width,
  setInputGarageKey,
}: GarageKeyProfileProps) => {
  const { setOpen, open, navigateToPage, client, slotUpdatedAt } =
    useContext<UseAppStoreType>(AppContext);
  const { garage } = useContext<UseGarageStoreType>(GarageContext);
  const { federation } = useContext<UseFederationStoreType>(FederationContext);

  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);

  useEffect(() => {
    const slot = garage.getSlot();
    if (slot?.hashId) {
      setLoading(false);
    }
  }, [slotUpdatedAt, loading]);

  const handlePreviousAccount = (): void => {
    setLoading(true);
    void garage.previousAccount(federation).finally(() => {
      setLoading(false);
    });
  };

  const handleNextAccount = (): void => {
    setLoading(true);
    void garage.nextAccount(federation).finally(() => {
      setLoading(false);
    });
  };

  const handleDeleteGarageKey = (): void => {
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = (): void => {
    garage.deleteGarageKey();
    garage.delete();
    setDeleteDialogOpen(false);
    setView('welcome');
  };

  const handleCancelDelete = (): void => {
    setDeleteDialogOpen(false);
  };

  const slot = garage.getSlot();
  const garageKey = garage.getGarageKey();

  return (
    <>
      <Grid container direction='column' alignItems='center' spacing={1} padding={1} paddingTop={2}>
        <Grid
          item
          container
          direction='column'
          alignItems='center'
          spacing={1}
          sx={{ width: '100%' }}
        >
          <Grid
            item
            sx={{ height: '2.3em', position: 'relative', display: 'flex', flexDirection: 'row' }}
          >
            <IconButton
              color='primary'
              onClick={() => {
                setOpen({ ...closeAll, profile: !open.profile });
              }}
            >
              <Settings />
            </IconButton>
            {slot?.nickname ? (
              <Typography align='center' component='h5' variant='h5'>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                  }}
                >
                  {width < 19 ? null : (
                    <Bolt
                      sx={{
                        color: '#fcba03',
                        height: '1.5em',
                        width: '1.5em',
                      }}
                    />
                  )}
                  <b>{slot?.nickname}</b>
                  {width < 19 ? null : (
                    <Bolt
                      sx={{
                        color: '#fcba03',
                        height: '1.5em',
                        width: '1.5em',
                      }}
                    />
                  )}
                </div>
              </Typography>
            ) : (
              <>
                <b>{t('Building your robot!')}</b>
                <LinearProgress />
              </>
            )}
          </Grid>

          <Grid item sx={{ width: `13.5em` }}>
            <RobotAvatar
              hashId={slot?.hashId ?? undefined}
              smooth
              style={{ maxWidth: '12.5em', maxHeight: '12.5em' }}
              placeholderType='generating'
              imageStyle={{
                transform: '',
                border: '2px solid #555',
                filter: 'drop-shadow(1px 1px 1px #000000)',
                height: `12.4em`,
                width: `12.4em`,
              }}
              tooltip={
                !slot?.activeOrder?.id && slot && !slot.isReusable()
                  ? t('This robot has completed a trade. Navigate to a new account for fresh privacy.')
                  : t('This is your trading avatar')
              }
              tooltipPosition='top'
            />
          </Grid>

          {garageKey ? (
            <Grid item>
              <AccountNavigator
                accountIndex={garageKey.currentAccountIndex}
                onPrevious={handlePreviousAccount}
                onNext={handleNextAccount}
                loading={loading}
              />
            </Grid>
          ) : null}

          {slot?.loading && !slot?.activeOrder ? (
            <Grid item>
              <b>{t('Looking for orders!')}</b>
              <LinearProgress />
            </Grid>
          ) : null}

          {slot?.activeOrder ? (
            <Grid item>
              <Button
                onClick={() => {
                  navigateToPage(
                    `order/${String(slot?.activeOrder?.shortAlias)}/${String(slot?.activeOrder?.id)}`,
                    navigate,
                  );
                }}
              >
                {t('Active order #{{orderID}}', { orderID: slot?.activeOrder?.id })}
              </Button>
            </Grid>
          ) : null}

          <Grid item container direction='row' alignItems='center'>
            {!slot?.activeOrder && slot?.lastOrder ? (
              <Grid item container direction='column' alignItems='center'>
                <Grid item>
                  <Button
                    onClick={() => {
                      navigateToPage(
                        `order/${String(slot?.lastOrder?.shortAlias)}/${String(slot?.lastOrder?.id)}`,
                        navigate,
                      );
                    }}
                  >
                    {t('Last order #{{orderID}}', { orderID: slot?.lastOrder?.id })}
                  </Button>
                </Grid>
              </Grid>
            ) : null}

            {slot?.availableRewards !== null && (
              <Grid item container direction='column' alignItems='center'>
                <Grid item>
                  <Button
                    onClick={() => {
                      setOpen({ ...closeAll, profile: !open.profile });
                    }}
                  >
                    {t('Claim Rewards')}
                  </Button>
                </Grid>
              </Grid>
            )}
          </Grid>

          {!slot?.activeOrder && !slot?.lastOrder && !slot?.loading ? (
            <Grid item>{t('No existing orders found')}</Grid>
          ) : null}
        </Grid>

        <Grid item sx={{ width: '100%' }}>
          <Box
            sx={{
              backgroundColor: 'background.paper',
              border: '1px solid',
              borderRadius: '4px',
              borderColor: theme.palette.mode === 'dark' ? '#434343' : '#c4c4c4',
            }}
          >
            <Grid container direction='column' alignItems='center' spacing={2} padding={2}>
              <Grid item sx={{ width: '100%' }}>
                <Grid container direction='row' justifyContent='space-between'>
                  <Typography variant='caption'>{t('Garage Key')}</Typography>
                  <Button
                    size='small'
                    color='primary'
                    onClick={() => {
                      garage.download(client);
                    }}
                  >
                    <Download style={{ width: '0.6em', height: '0.6em' }} />
                  </Button>
                </Grid>
                <GarageKeyInput
                  garageKey={garageKey?.encodedKey ?? ''}
                  setGarageKey={setInputGarageKey}
                  editable={false}
                  label={t('Store your Garage Key safely')}
                />
              </Grid>

              <Grid item container direction='row' justifyContent='center' width='100%'>
                <Tooltip title={t('Delete Garage Key and all robots')} placement='top'>
                  <Button color='error' onClick={handleDeleteGarageKey} size='large'>
                    <DeleteSweep />
                    {t('Delete All')}
                  </Button>
                </Tooltip>
              </Grid>
            </Grid>
          </Box>
        </Grid>
      </Grid>
      <DeleteGarageKeyConfirmationDialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};

export default GarageKeyProfile;

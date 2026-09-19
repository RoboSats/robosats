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
import { Bolt, Settings, DeleteSweep } from '@mui/icons-material';
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

const GarageKeyProfile = ({ setView, width, setInputGarageKey }: GarageKeyProfileProps) => {
  const { setOpen, open, navigateToPage, slotUpdatedAt } = useContext<UseAppStoreType>(AppContext);
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
      <Grid
        sx={{ flexDirection: 'column', alignItems: 'center', padding: 1, paddingTop: 2 }}
        container
        spacing={1}
      >
        <Grid
          container
          spacing={1}
          sx={{ flexDirection: 'column', alignItems: 'center', width: '100%' }}
        >
          <Grid
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

          <Grid sx={{ width: `13.5em` }}>
            <RobotAvatar
              hashId={slot?.hashId ?? undefined}
              statusColor={
                !slot?.activeOrder?.id && slot !== null && !slot.isReusable() ? 'error' : undefined
              }
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
                  ? t(
                      'This robot has completed a trade. Navigate to a new account for fresh privacy.',
                    )
                  : t('This is your trading avatar')
              }
              tooltipPosition='top'
            />
          </Grid>

          {garageKey ? (
            <Grid>
              <AccountNavigator
                accountIndex={garageKey.currentAccountIndex}
                onPrevious={handlePreviousAccount}
                onNext={handleNextAccount}
                loading={loading}
              />
            </Grid>
          ) : null}

          {slot?.loading && !slot?.activeOrder ? (
            <Grid>
              <b>{t('Looking for orders!')}</b>
              <LinearProgress />
            </Grid>
          ) : null}

          {slot?.activeOrder ? (
            <Grid>
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

          <Grid sx={{ alignItems: 'center' }} container direction='row'>
            {!slot?.activeOrder && slot?.lastOrder ? (
              <Grid sx={{ flexDirection: 'column', alignItems: 'center' }} container>
                <Grid>
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
              <Grid sx={{ flexDirection: 'column', alignItems: 'center' }} container>
                <Grid>
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
            <Grid>{t('No existing orders found')}</Grid>
          ) : null}
        </Grid>

        <Grid sx={{ width: '100%' }}>
          <Box
            sx={{
              backgroundColor: 'background.paper',
              border: '1px solid',
              borderRadius: '4px',
              borderColor: theme.palette.mode === 'dark' ? '#434343' : '#c4c4c4',
            }}
          >
            <Grid
              sx={{ flexDirection: 'column', alignItems: 'center', padding: 2 }}
              container
              spacing={2}
            >
              <Grid sx={{ width: '100%' }}>
                <Typography variant='caption'>{t('Garage Key')}</Typography>
                <GarageKeyInput
                  garageKey={garageKey?.encodedKey ?? ''}
                  setGarageKey={setInputGarageKey}
                  editable={false}
                  label={t('Garage Key')}
                />
              </Grid>

              <Grid sx={{ justifyContent: 'center', width: '100%' }} container direction='row'>
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

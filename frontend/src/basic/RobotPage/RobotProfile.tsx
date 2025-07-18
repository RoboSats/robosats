import React, { useState, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Grid,
  LinearProgress,
  Typography,
  Alert,
  Select,
  MenuItem,
  Box,
  useTheme,
  type SelectChangeEvent,
  IconButton,
} from '@mui/material';
import { Key, Bolt, Add, DeleteSweep, Download, Settings } from '@mui/icons-material';
import RobotAvatar from '../../components/RobotAvatar';
import TokenInput from './TokenInput';
import { type Slot, type Robot } from '../../models';
import { AppContext, closeAll, type UseAppStoreType } from '../../contexts/AppContext';
import { genBase62Token } from '../../utils';
import { LoadingButton } from '@mui/lab';
import { GarageContext, type UseGarageStoreType } from '../../contexts/GarageContext';
import { type UseFederationStoreType, FederationContext } from '../../contexts/FederationContext';
import { DeleteRobotConfirmationDialog } from '../../components/Dialogs';

interface RobotProfileProps {
  robot: Robot;
  setRobot: (state: Robot) => void;
  setView: (state: 'welcome' | 'onboarding' | 'recovery' | 'profile') => void;
  inputToken: string;
  setInputToken: (state: string) => void;
  width: number;
  baseUrl: string;
}

const RobotProfile = ({
  inputToken,
  setInputToken,
  setView,
  width,
}: RobotProfileProps): React.JSX.Element => {
  const { windowSize, client, setOpen, open, navigateToPage } =
    useContext<UseAppStoreType>(AppContext);
  const { garage, slotUpdatedAt } = useContext<UseGarageStoreType>(GarageContext);
  const { federation } = useContext<UseFederationStoreType>(FederationContext);

  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const mobileView = windowSize?.width < 50;

  const [loading, setLoading] = useState<boolean>(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);

  useEffect(() => {
    const slot = garage.getSlot();
    if (slot?.hashId) {
      setLoading(false);
    }
  }, [slotUpdatedAt, loading]);

  const handleAddRobot = (): void => {
    const token = genBase62Token(36);
    void garage.createRobot(federation, token);
    setInputToken(token);
    setLoading(true);
  };

  const handleChangeSlot = (e: SelectChangeEvent<number | 'loading'>): void => {
    if (e?.target?.value) {
      garage.setCurrentSlot(e.target.value as string);
      setInputToken(garage.getSlot()?.token ?? '');
      setLoading(true);
    }
  };

  const handleDeleteRobot = (): void => {
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = (): void => {
    garage.deleteSlot();
    setDeleteDialogOpen(false);
    if (Object.keys(garage.slots).length < 1) setView('welcome');
  };

  const handleCancelDelete = (): void => {
    setDeleteDialogOpen(false);
  };

  const slot = garage.getSlot();
  const robot = slot?.getRobot();

  return (
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
            style={{}}
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
            hashId={slot?.hashId}
            smooth={true}
            style={{ maxWidth: '12.5em', maxHeight: '12.5em' }}
            placeholderType='generating'
            imageStyle={{
              transform: '',
              border: '2px solid #555',
              filter: 'drop-shadow(1px 1px 1px #000000)',
              height: `12.4em`,
              width: `12.4em`,
            }}
            tooltip={t('This is your trading avatar')}
            tooltipPosition='top'
          />
          {robot?.found && Boolean(slot?.lastOrder?.id) ? (
            <Typography align='center' variant='h6'>
              {t('Welcome back!')}
            </Typography>
          ) : (
            <></>
          )}
        </Grid>

        {federation.loading && !slot?.activeOrder?.id ? (
          <Grid>
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

        {!slot?.activeOrder?.id && Boolean(slot?.lastOrder?.id) ? (
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
            <Grid item>
              <Alert severity='warning'>
                <Grid container direction='column' alignItems='center'>
                  <Grid item>
                    {t(
                      'Reusing trading identity degrades your privacy against other users, coordinators and observers.',
                    )}
                  </Grid>
                </Grid>
              </Alert>
            </Grid>
          </Grid>
        ) : null}

        {!slot?.activeOrder && !slot?.lastOrder && !federation.loading ? (
          <Grid item>{t('No existing orders found')}</Grid>
        ) : null}

        <Grid
          item
          container
          direction='row'
          justifyContent='stretch'
          alignItems='stretch'
          sx={{ width: '100%' }}
        >
          <TokenInput
            fullWidth
            inputToken={inputToken}
            editable={false}
            label={t('Store your token safely')}
            setInputToken={setInputToken}
            onPressEnter={() => null}
          />
        </Grid>
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
              <Typography variant='caption'>{t('Robot Garage')}</Typography>
              <Select
                fullWidth
                required={true}
                inputProps={{
                  style: { textAlign: 'center' },
                }}
                value={loading ? 'loading' : garage.currentSlot}
                onChange={handleChangeSlot}
              >
                {loading ? (
                  <MenuItem key={'loading'} value={'loading'}>
                    <Typography>{t('Building...')}</Typography>
                  </MenuItem>
                ) : (
                  Object.values(garage.slots).map((slot: Slot, index: number) => {
                    return (
                      <MenuItem key={index} value={slot.token}>
                        <Grid
                          container
                          direction='row'
                          justifyContent='flex-start'
                          alignItems='center'
                          style={{ height: '2.8em' }}
                          spacing={1}
                        >
                          <Grid item>
                            <RobotAvatar
                              hashId={slot?.hashId}
                              smooth={true}
                              style={{ width: '2.6em', height: '2.6em' }}
                              placeholderType='loading'
                              small={true}
                            />
                          </Grid>
                          <Grid item>
                            <Typography variant={windowSize.width < 26 ? 'caption' : undefined}>
                              {slot?.nickname}
                            </Typography>
                          </Grid>
                        </Grid>
                      </MenuItem>
                    );
                  })
                )}
              </Select>
            </Grid>

            <Grid item container direction='row' alignItems='center' justifyContent='space-evenly'>
              <Grid item>
                <LoadingButton
                  loading={loading}
                  color='primary'
                  onClick={handleAddRobot}
                  size='large'
                >
                  <Add /> <div style={{ width: '0.5em' }} />
                  {!mobileView && t('Add Robot')}
                </LoadingButton>
              </Grid>

              {client !== 'mobile' ? (
                <Grid item>
                  <Button
                    size='large'
                    color='primary'
                    onClick={() => {
                      garage.download();
                    }}
                  >
                    <Download />
                  </Button>
                </Grid>
              ) : null}

              <Grid item>
                <Button color='primary' onClick={handleDeleteRobot} size='large'>
                  <DeleteSweep /> <div style={{ width: '0.5em' }} />
                  {!mobileView && t('Delete Robot')}
                </Button>
              </Grid>

              <Grid item>
                <Button
                  color='primary'
                  size='large'
                  onClick={() => {
                    setOpen((open) => {
                      return { ...open, recovery: true };
                    });
                  }}
                >
                  <Key /> <div style={{ width: '0.5em' }} />
                  {!mobileView && t('Recovery')}
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </Box>
      </Grid>

      <DeleteRobotConfirmationDialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        robotName={robot?.nickname}
      />
    </Grid>
  );
};

export default RobotProfile;

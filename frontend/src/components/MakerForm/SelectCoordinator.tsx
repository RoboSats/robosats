import React, { useContext, useEffect, useState } from 'react';
import {
  Grid,
  Select,
  MenuItem,
  Box,
  Tooltip,
  Typography,
  type SelectChangeEvent,
  CircularProgress,
  Stack,
  Alert,
} from '@mui/material';
import { Link } from '@mui/icons-material';
import RobotAvatar from '../RobotAvatar';
import { AppContext, type UseAppStoreType } from '../../contexts/AppContext';
import { useTheme } from '@emotion/react';
import { useTranslation } from 'react-i18next';
import { FederationContext, type UseFederationStoreType } from '../../contexts/FederationContext';
import { Coordinator } from '../../models';

interface SelectCoordinatorProps {
  coordinatorAlias: string;
  setCoordinatorAlias: (coordinatorAlias: string) => void;
}

const SelectCoordinator: React.FC<SelectCoordinatorProps> = ({
  coordinatorAlias,
  setCoordinatorAlias,
}) => {
  const { setOpen } = useContext<UseAppStoreType>(AppContext);
  const { federation } = useContext<UseFederationStoreType>(FederationContext);
  const theme = useTheme();
  const { t } = useTranslation();
  const [coordinator, setCoordinator] = useState<Coordinator>();

  const onClickCurrentCoordinator = function (shortAlias: string): void {
    setOpen((open) => {
      return { ...open, coordinator: shortAlias };
    });
  };

  const handleCoordinatorChange = (e: SelectChangeEvent<string>): void => {
    setCoordinatorAlias(e.target.value);
  };

  useEffect(() => {
    const selectedCoordinator = federation.getCoordinator(coordinatorAlias);
    if (selectedCoordinator) setCoordinator(selectedCoordinator);
  }, [coordinatorAlias]);

  return (
    <Grid item>
      {coordinator?.info && !coordinator?.info?.swap_enabled && (
        <Grid sx={{ marginBottom: 1 }}>
          <Alert severity='warning' sx={{ marginTop: 2 }}>
            {t('This coordinator does not support on-chain swaps.')}
          </Alert>
        </Grid>
      )}
      <Box
        sx={{
          backgroundColor: 'background.paper',
          border: '1px solid',
          borderRadius: '4px',
          borderColor: theme.palette.mode === 'dark' ? '#434343' : '#c4c4c4',
          '&:hover': {
            borderColor: theme.palette.mode === 'dark' ? '#ffffff' : '#2f2f2f',
          },
        }}
      >
        <Tooltip
          placement='top'
          enterTouchDelay={500}
          enterDelay={700}
          enterNextDelay={2000}
          title={t(
            'The provider the lightning and communication infrastructure. The host will be in charge of providing support and solving disputes. The trade fees are set by the host. Make sure to only select order hosts that you trust!',
          )}
        >
          <Grid container style={{ marginTop: 10, width: '100%' }}>
            <Grid
              item
              sx={{
                cursor: 'pointer',
                position: 'relative',
                left: '0.3em',
                bottom: '0.1em',
                marginBottom: 1,
                width: '30%',
              }}
              onClick={() => {
                onClickCurrentCoordinator(coordinatorAlias);
              }}
            >
              <Grid item>
                <RobotAvatar
                  shortAlias={coordinatorAlias}
                  hashId={!coordinator?.federated ? coordinator?.mainnet.onion : undefined}
                  style={{ width: '3em', height: '3em' }}
                  smooth={true}
                  flipHorizontally={false}
                  small={true}
                />
                {(coordinator?.limits === undefined ||
                  Object.keys(coordinator?.limits).length === 0) && (
                  <CircularProgress
                    size={49}
                    thickness={5}
                    style={{ marginTop: -48, position: 'absolute' }}
                  />
                )}
              </Grid>
            </Grid>

            <Grid item xs={{ width: '100%' }}>
              <Select
                variant='standard'
                fullWidth
                required={true}
                inputProps={{
                  style: {
                    textAlign: 'center',
                  },
                }}
                value={coordinatorAlias}
                onChange={handleCoordinatorChange}
                disableUnderline
              >
                {federation.getCoordinators().map((coordinator): React.JSX.Element | null => {
                  let row: React.JSX.Element | null = null;
                  if (coordinator.enabled === true) {
                    row = (
                      <MenuItem key={coordinator.shortAlias} value={coordinator.shortAlias}>
                        <Typography>{coordinator.longAlias}</Typography>
                      </MenuItem>
                    );
                  }
                  return row;
                })}
              </Select>
            </Grid>
          </Grid>
        </Tooltip>
        <Grid container>
          <Grid item>
            <Stack direction='row' alignContent='center' spacing={2} style={{ flexGrow: 1 }}>
              <Grid item>
                <Tooltip
                  placement='top'
                  enterTouchDelay={500}
                  enterDelay={700}
                  enterNextDelay={2000}
                  title={t('Maker fee')}
                >
                  <Typography
                    color='text.secondary'
                    variant='caption'
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    &nbsp;{t('Maker')[0]} {((coordinator?.info?.maker_fee ?? 0) * 100).toFixed(3)}%
                  </Typography>
                </Tooltip>
              </Grid>
              <Grid item>
                <Tooltip
                  placement='top'
                  enterTouchDelay={500}
                  enterDelay={700}
                  enterNextDelay={2000}
                  title={t('Taker fee')}
                >
                  <Typography
                    color='text.secondary'
                    variant='caption'
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    &nbsp;{t('Taker')[0]} {((coordinator?.info?.taker_fee ?? 0) * 100).toFixed(3)}%
                  </Typography>
                </Tooltip>
              </Grid>
              <Grid item>
                <Tooltip
                  placement='top'
                  enterTouchDelay={500}
                  enterDelay={700}
                  enterNextDelay={2000}
                  title={
                    coordinator?.info?.swap_enabled
                      ? t('Onchain payouts enabled')
                      : t('Onchain payouts disabled')
                  }
                >
                  <Typography
                    color={coordinator?.info?.swap_enabled ? 'primary' : 'text.secondary'}
                    variant='caption'
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Link sx={{ height: 16 }} />{' '}
                    {coordinator?.info?.swap_enabled
                      ? `${(coordinator?.info?.current_swap_fee_rate ?? 0).toFixed(1)}%`
                      : t('Disabled')}
                  </Typography>
                </Tooltip>
              </Grid>
            </Stack>
          </Grid>
        </Grid>
      </Box>
    </Grid>
  );
};

export default SelectCoordinator;

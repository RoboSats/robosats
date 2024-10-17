import React, { useContext } from 'react';
import {
  Grid,
  Select,
  MenuItem,
  Box,
  Tooltip,
  Typography,
  type SelectChangeEvent,
  CircularProgress,
} from '@mui/material';

import RobotAvatar from '../RobotAvatar';
import { AppContext, type UseAppStoreType } from '../../contexts/AppContext';
import { useTheme } from '@emotion/react';
import { useTranslation } from 'react-i18next';
import { FederationContext, type UseFederationStoreType } from '../../contexts/FederationContext';

interface SelectCoordinatorProps {
  coordinatorAlias: string;
  setCoordinator: (coordinatorAlias: string) => void;
}

const SelectCoordinator: React.FC<SelectCoordinatorProps> = ({
  coordinatorAlias,
  setCoordinator,
}) => {
  const { setOpen } = useContext<UseAppStoreType>(AppContext);
  const { federation, sortedCoordinators } = useContext<UseFederationStoreType>(FederationContext);
  const theme = useTheme();
  const { t } = useTranslation();

  const onClickCurrentCoordinator = function (shortAlias: string): void {
    setOpen((open) => {
      return { ...open, coordinator: shortAlias };
    });
  };

  const handleCoordinatorChange = (e: SelectChangeEvent<string>): void => {
    setCoordinator(e.target.value);
  };

  const coordinator = federation.getCoordinator(coordinatorAlias);

  return (
    <Grid item>
      <Tooltip
        placement='top'
        enterTouchDelay={500}
        enterDelay={700}
        enterNextDelay={2000}
        title={t(
          'The provider the lightning and communication infrastructure. The host will be in charge of providing support and solving disputes. The trade fees are set by the host. Make sure to only select order hosts that you trust!',
        )}
      >
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
          <Typography variant='caption' color='text.secondary'>
            &nbsp;{t('Order Host')}
          </Typography>

          <Grid container>
            <Grid
              item
              xs={3}
              sx={{ cursor: 'pointer', position: 'relative', left: '0.3em', bottom: '0.1em' }}
              onClick={() => {
                onClickCurrentCoordinator(coordinatorAlias);
              }}
            >
              <Grid item>
                <RobotAvatar
                  shortAlias={coordinator?.federated ? coordinator.shortAlias : undefined}
                  hashId={coordinator?.federated ? undefined : coordinator.mainnet.onion}
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

            <Grid item xs={9}>
              <Select
                variant='standard'
                fullWidth
                required={true}
                inputProps={{
                  style: { textAlign: 'center' },
                }}
                value={coordinatorAlias}
                onChange={handleCoordinatorChange}
                disableUnderline
              >
                {sortedCoordinators.map((shortAlias: string): JSX.Element | null => {
                  let row: JSX.Element | null = null;
                  const item = federation.getCoordinator(shortAlias);
                  if (item.enabled === true) {
                    row = (
                      <MenuItem key={shortAlias} value={shortAlias}>
                        <Typography>{item.longAlias}</Typography>
                      </MenuItem>
                    );
                  }
                  return row;
                })}
              </Select>
            </Grid>
          </Grid>
        </Box>
      </Tooltip>
    </Grid>
  );
};

export default SelectCoordinator;

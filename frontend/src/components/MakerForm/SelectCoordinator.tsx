import React, { useContext } from 'react';
import {
  Grid,
  Select,
  MenuItem,
  Box,
  Typography,
  type SelectChangeEvent,
  CircularProgress,
  Stack,
} from '@mui/material';
import RobotAvatar from '../RobotAvatar';
import { AppContext, type UseAppStoreType } from '../../contexts/AppContext';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { FederationContext, type UseFederationStoreType } from '../../contexts/FederationContext';
import CoordinatorFeeRow from '../CoordinatorFeeRow';

interface SelectCoordinatorProps {
  coordinatorAlias: string;
  setCoordinatorAlias: (coordinatorAlias: string) => void;
}

const SelectCoordinator: React.FC<SelectCoordinatorProps> = ({
  coordinatorAlias,
  setCoordinatorAlias,
}) => {
  const { setOpen, federationUpdatedAt } = useContext<UseAppStoreType>(AppContext);
  const { federation } = useContext<UseFederationStoreType>(FederationContext);
  // Gate on the final federation hash: the selector stays disabled until
  // discovery has settled and removed coordinators can no longer be picked.
  const loadingCoordinators = !federation.federationListLoaded;
  const theme = useTheme();
  const { t } = useTranslation();

  // Reading federationUpdatedAt causes a re-render whenever coordinator info
  // arrives (fees, swap status), so the selector and its options stay fresh.
  void federationUpdatedAt;
  const coordinator = federation.getCoordinator(coordinatorAlias);

  const onClickCurrentCoordinator = (shortAlias: string): void => {
    setOpen((open) => ({ ...open, coordinator: shortAlias }));
  };

  const handleCoordinatorChange = (e: SelectChangeEvent<string>): void => {
    setCoordinatorAlias(e.target.value);
  };

  return (
    <Box
      sx={{
        mt: 1,
        backgroundColor: 'background.paper',
        border: '1px solid',
        borderRadius: '4px',
        borderColor: theme.palette.mode === 'dark' ? '#434343' : '#c4c4c4',
        '&:hover': {
          borderColor: theme.palette.mode === 'dark' ? '#ffffff' : '#2f2f2f',
        },
        px: 1,
        height: '64px',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Grid container sx={{ alignItems: 'center' }} wrap='nowrap'>
        {/* Clickable avatar → opens coordinator profile dialog */}
        <Grid
          sx={{ cursor: loadingCoordinators ? 'default' : 'pointer', flexShrink: 0, mr: 1 }}
          onClick={() => {
            if (!loadingCoordinators) onClickCurrentCoordinator(coordinatorAlias);
          }}
        >
          {loadingCoordinators ? (
            <CircularProgress size={36} thickness={3} />
          ) : (
            <RobotAvatar
              shortAlias={coordinatorAlias}
              hashId={!coordinator?.federated ? coordinator?.mainnet?.onion : undefined}
              style={{ width: '2.4em', height: '2.4em' }}
              smooth={true}
              flipHorizontally={false}
              small={true}
            />
          )}
        </Grid>

        {/* Coordinator selector */}
        <Grid sx={{ flexGrow: 1, minWidth: 0 }}>
          {loadingCoordinators ? (
            <Typography variant='body1' color='text.secondary'>
              {t('Loading...')}
            </Typography>
          ) : (
            <Select
              variant='standard'
              fullWidth
              required
              value={coordinatorAlias}
              onChange={handleCoordinatorChange}
              disableUnderline
              disabled={loadingCoordinators}
              renderValue={(value) => {
                const selected = federation.getCoordinator(value);
                return (
                  <Stack spacing={0.25}>
                    <Typography variant='body2' sx={{ fontWeight: 500 }} noWrap>
                      {selected?.longAlias ?? value}
                    </Typography>
                    {selected != null && <CoordinatorFeeRow coordinator={selected} t={t} />}
                  </Stack>
                );
              }}
            >
              {federation.getCoordinators().map((coor): React.JSX.Element | null => {
                if (coor.enabled !== true) return null;
                return (
                  <MenuItem key={coor.shortAlias} value={coor.shortAlias}>
                    <Stack
                      direction='row'
                      spacing={1}
                      sx={{ alignItems: 'center', width: '100%', py: 0.5 }}
                    >
                      <RobotAvatar
                        shortAlias={coor.shortAlias}
                        hashId={!coor.federated ? coor.mainnet?.onion : undefined}
                        style={{ width: '2em', height: '2em', flexShrink: 0 }}
                        smooth={false}
                        flipHorizontally={false}
                        small={true}
                      />
                      <Stack spacing={0.1} sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant='body2' sx={{ fontWeight: 500 }} noWrap>
                          {coor.longAlias}
                        </Typography>
                        <CoordinatorFeeRow coordinator={coor} t={t} />
                      </Stack>
                    </Stack>
                  </MenuItem>
                );
              })}
            </Select>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default SelectCoordinator;

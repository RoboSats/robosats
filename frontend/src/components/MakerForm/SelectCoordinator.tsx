import React, { useContext } from 'react';
import {
  Grid,
  Select,
  MenuItem,
  Box,
  Tooltip,
  Typography,
  type SelectChangeEvent,
} from '@mui/material';

import RobotAvatar from '../RobotAvatar';
import { AppContext, type UseAppStoreType, hostUrl } from '../../contexts/AppContext';
import { useTheme } from '@emotion/react';
import { useTranslation } from 'react-i18next';
import type { Coordinator } from '../../models';

interface SelectCoordinatorProps {
  coordinator: string;
  setCoordinator: (coordinator: string) => void;
}

const SelectCoordinator: React.FC<SelectCoordinatorProps> = ({ coordinator, setCoordinator }) => {
  const { federation, setFocusedCoordinator, setOpen } = useContext<UseAppStoreType>(AppContext);
  const theme = useTheme();
  const { t } = useTranslation();

  const onClickCurrentCoordinator = function (shortAlias: string): void {
    setFocusedCoordinator(shortAlias);
    setOpen((open) => {
      return { ...open, coordinator: true };
    });
  };

  const handleCoordinatorChange = (e: SelectChangeEvent<string>): void => {
    setCoordinator(e.target.value);
  };

  //   'Select order host';
  //   'The host (coordinator) of your order will provide the lightning and communication infrastructure as well as will be in charge of providing support and solving disputes. Make sure to only select order hosts that you trust!';
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
                onClickCurrentCoordinator(coordinator);
              }}
            >
              <Grid item>
                <RobotAvatar
                  nickname={coordinator}
                  coordinator={true}
                  style={{ width: '3.215em', height: '3.215em' }}
                  smooth={true}
                  flipHorizontally={true}
                  baseUrl={hostUrl}
                  small={true}
                />
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
                value={coordinator}
                onChange={handleCoordinatorChange}
                disableUnderline
              >
                {Object.entries(federation).map(
                  ([shortAlias, coord]: [string, Coordinator]): JSX.Element | null => {
                    let row = null;
                    if (
                      shortAlias === coordinator ||
                      (coord.enabled === true && coord.info !== undefined)
                    ) {
                      row = (
                        <MenuItem key={shortAlias} value={shortAlias}>
                          <Typography>{coord.longAlias}</Typography>
                        </MenuItem>
                      );
                    }
                    return row;
                  },
                )}
              </Select>
            </Grid>
          </Grid>
        </Box>
      </Tooltip>
    </Grid>
  );
};

export default SelectCoordinator;

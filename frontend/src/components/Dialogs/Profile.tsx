import React, { useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Dialog,
  DialogContent,
  List,
  Typography,
  Select,
  Grid,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';

import RobotAvatar from '../RobotAvatar';
import RobotInfo from '../RobotInfo';
import { FederationContext, type UseFederationStoreType } from '../../contexts/FederationContext';
import { GarageContext, type UseGarageStoreType } from '../../contexts/GarageContext';
import { Slot, type Coordinator } from '../../models';

interface Props {
  open: boolean;
  onClose: () => void;
}

const ProfileDialog = ({ open = false, onClose }: Props): React.JSX.Element => {
  const { federation } = useContext<UseFederationStoreType>(FederationContext);
  const { garage } = useContext<UseGarageStoreType>(GarageContext);
  const { t } = useTranslation();

  useEffect(() => {
    loadRobot(garage.currentSlot ?? '');
  }, []);

  const loadRobot = (token: string) => {
    garage.setCurrentSlot(token);
    garage.fetchRobot(federation, garage.getSlot()?.token ?? '');
  };

  const handleChangeSlot = (e: SelectChangeEvent<number | 'loading'>): void => {
    if (e?.target?.value) loadRobot(e.target.value as string);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby='profile-title'
      aria-describedby='profile-description'
      fullWidth
    >
      <DialogContent style={{ width: '100%' }}>
        <Typography component='h5' variant='h5'>
          {t('Your Robot')}
        </Typography>
        <Select
          fullWidth
          inputProps={{
            style: { textAlign: 'center' },
          }}
          value={garage.currentSlot}
          onChange={handleChangeSlot}
        >
          {Object.values(garage.slots).map((slot: Slot, index: number) => {
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
                    <Typography>{slot?.nickname}</Typography>
                  </Grid>
                </Grid>
              </MenuItem>
            );
          })}
        </Select>

        <Typography>
          <b>{t('Coordinators that know your robot:')}</b>
        </Typography>

        <List
          sx={{
            width: '100%',
            bgcolor: 'background.paper',
            maxHeight: '28em',
            overflowY: 'auto',
          }}
          component='nav'
          aria-labelledby='coordinators-list'
        >
          {federation.getCoordinators().map((coordinator: Coordinator): React.JSX.Element => {
            return (
              <div key={coordinator.shortAlias}>
                <RobotInfo coordinator={coordinator} onClose={onClose} />
              </div>
            );
          })}
        </List>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileDialog;

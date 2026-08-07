import React, { useContext, useEffect, useState } from 'react';
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
  Button,
  LinearProgress,
} from '@mui/material';
import { Key } from '@mui/icons-material';

import RobotAvatar from '../RobotAvatar';
import RobotInfo from '../RobotInfo';
import { FederationContext, type UseFederationStoreType } from '../../contexts/FederationContext';
import { GarageContext, type UseGarageStoreType } from '../../contexts/GarageContext';
import { AppContext, type UseAppStoreType } from '../../contexts/AppContext';
import { Slot, type Coordinator } from '../../models';
import AuditPGPDialog from './AuditPGP';

interface Props {
  open: boolean;
  onClose: () => void;
}

const ProfileDialog = ({ open = false, onClose }: Props): React.JSX.Element => {
  const { federation } = useContext<UseFederationStoreType>(FederationContext);
  const { garage } = useContext<UseGarageStoreType>(GarageContext);
  const { slotUpdatedAt } = useContext<UseAppStoreType>(AppContext);
  const { t } = useTranslation();
  const [audit, setAudit] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const loadRobot = (token: string) => {
    garage.setCurrentSlot(token);
    garage.fetchRobot(federation, garage.getSlot()?.token ?? '');
  };

  const handleChangeSlot = (e: SelectChangeEvent<number | 'loading'>): void => {
    if (e?.target?.value) {
      setLoading(true);
      loadRobot(e.target.value as string);
    }
  };

  useEffect(() => {
    if (open) garage.fetchRobot(federation, garage.getSlot()?.token ?? '');
  }, [open]);

  useEffect(() => {
    setLoading(Boolean(garage.getSlot()?.loading));
  }, [slotUpdatedAt]);

  return (
    <>
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
          {loading && <LinearProgress />}

          <Grid
            item
            xs={1}
            style={{ width: '33%', display: 'flex', alignContent: 'center', margin: '8px 0' }}
          >
            <Button
              fullWidth
              disabled={false}
              onClick={() => setAudit(true)}
              variant='contained'
              color='primary'
              size='large'
              startIcon={<Key />}
            >
              {t('Keys')}
            </Button>
          </Grid>

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
      <AuditPGPDialog
        open={audit}
        onClose={() => {
          setAudit(false);
        }}
        onClickBack={() => {
          setAudit(false);
        }}
      />
    </>
  );
};

export default ProfileDialog;

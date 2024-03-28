import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Dialog,
  DialogContent,
  Divider,
  List,
  ListItemAvatar,
  ListItemText,
  ListItem,
  Typography,
  LinearProgress,
} from '@mui/material';

import BoltIcon from '@mui/icons-material/Bolt';
import RobotAvatar from '../RobotAvatar';
import RobotInfo from '../RobotInfo';
import { FederationContext, type UseFederationStoreType } from '../../contexts/FederationContext';
import { GarageContext, type UseGarageStoreType } from '../../contexts/GarageContext';
import { type Coordinator } from '../../models';

interface Props {
  open: boolean;
  onClose: () => void;
}

const ProfileDialog = ({ open = false, onClose }: Props): JSX.Element => {
  const { federation } = useContext<UseFederationStoreType>(FederationContext);
  const { garage, robotUpdatedAt } = useContext<UseGarageStoreType>(GarageContext);
  const { t } = useTranslation();

  const slot = garage.getSlot();

  const [loading, setLoading] = useState<boolean>(true);
  const [loadingCoordinators, setLoadingCoordinators] = useState<number>(
    Object.values(slot?.robots ?? {}).length,
  );

  useEffect(() => {
    setLoading(!garage.getSlot()?.hashId);
    setLoadingCoordinators(
      Object.values(slot?.robots ?? {}).filter((robot) => robot.loading).length,
    );
  }, [robotUpdatedAt]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby='profile-title'
      aria-describedby='profile-description'
    >
      <div style={loading ? {} : { display: 'none' }}>
        <LinearProgress />
      </div>
      <DialogContent>
        <Typography component='h5' variant='h5'>
          {t('Your Robot')}
        </Typography>
        <List>
          <Divider />

          <ListItem className='profileNickname'>
            <ListItemText>
              <Typography component='h6' variant='h6'>
                {garage.getSlot()?.nickname !== undefined && (
                  <div style={{ position: 'relative', left: '-7px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'left',
                        flexWrap: 'wrap',
                        width: 300,
                      }}
                    >
                      <BoltIcon sx={{ color: '#fcba03', height: '28px', width: '24px' }} />

                      <a>{garage.getSlot()?.nickname}</a>

                      <BoltIcon sx={{ color: '#fcba03', height: '28px', width: '24px' }} />
                    </div>
                  </div>
                )}
              </Typography>

              {loadingCoordinators > 0 ? (
                <>
                  <b>{t('Looking for your robot!')}</b>
                  <LinearProgress />
                </>
              ) : (
                <></>
              )}
            </ListItemText>

            <ListItemAvatar>
              <RobotAvatar
                avatarClass='profileAvatar'
                style={{ width: 65, height: 65 }}
                hashId={garage.getSlot()?.hashId ?? ''}
              />
            </ListItemAvatar>
          </ListItem>

          <Divider />
        </List>

        <Typography>
          <b>{t('Coordinators that know your robot:')}</b>
        </Typography>

        {Object.values(federation.coordinators).map((coordinator: Coordinator): JSX.Element => {
          const coordinatorRobot = garage.getSlot()?.getRobot(coordinator.shortAlias);
          return (
            <div key={coordinator.shortAlias}>
              <RobotInfo
                coordinator={coordinator}
                onClose={onClose}
                disabled={coordinatorRobot?.loading}
              />
            </div>
          );
        })}
      </DialogContent>
    </Dialog>
  );
};

export default ProfileDialog;

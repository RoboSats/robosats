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
  baseUrl: string;
}

const ProfileDialog = ({ open = false, baseUrl, onClose }: Props): JSX.Element => {
  const { federation } = useContext<UseFederationStoreType>(FederationContext);
  const { garage, robotUpdatedAt } = useContext<UseGarageStoreType>(GarageContext);
  const { t } = useTranslation();
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(!garage.getSlot()?.avatarLoaded);
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
            <ListItemText secondary={t('Your robot')}>
              <Typography component='h6' variant='h6'>
                {garage.getSlot()?.getRobot()?.nickname !== undefined && (
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

                      <a>{garage.getSlot()?.getRobot()?.nickname}</a>

                      <BoltIcon sx={{ color: '#fcba03', height: '28px', width: '24px' }} />
                    </div>
                  </div>
                )}
              </Typography>
            </ListItemText>

            <ListItemAvatar>
              <RobotAvatar
                avatarClass='profileAvatar'
                style={{ width: 65, height: 65 }}
                nickname={garage.getSlot()?.getRobot()?.nickname}
                baseUrl={baseUrl}
              />
            </ListItemAvatar>
          </ListItem>

          <Divider />
        </List>

        <Typography>
          <b>{t('Coordinators that know your robots')}</b>
        </Typography>

        {Object.values(federation.coordinators).map((coordinator: Coordinator): JSX.Element => {
          if (garage.getSlot()?.avatarLoaded) {
            return (
              <div key={coordinator.shortAlias}>
                <RobotInfo coordinator={coordinator} onClose={onClose} />
              </div>
            );
          } else {
            return <div key={coordinator.shortAlias} />;
          }
        })}
      </DialogContent>
    </Dialog>
  );
};

export default ProfileDialog;

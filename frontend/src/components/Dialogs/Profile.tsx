import React, { useContext } from 'react';
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
import type { Robot } from '../../models';
import { AppContext, type UseAppStoreType } from '../../contexts/AppContext';
import RobotInfo from '../RobotInfo';

interface Props {
  open: boolean;
  onClose: () => void;
  robot: Robot;
  baseUrl: string;
}

const ProfileDialog = ({ open = false, baseUrl, onClose, robot }: Props): JSX.Element => {
  const { federation } = useContext<UseAppStoreType>(AppContext);
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby='profile-title'
      aria-describedby='profile-description'
    >
      <div style={robot.loading ? {} : { display: 'none' }}>
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
                {robot.nickname !== undefined && (
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

                      <a>{robot.nickname}</a>

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
                nickname={robot.nickname}
                baseUrl={baseUrl}
              />
            </ListItemAvatar>
          </ListItem>

          <Divider />
        </List>

        <Typography>
          <b>{t('Coordinators that know your robot')}</b>
        </Typography>

        {Object.entries(federation).map(([shortAlias, coordinator]: [string, any]): JSX.Element => {
          if (coordinator.robot?.loading === false) {
            return (
              <div key={shortAlias}>
                <RobotInfo coordinator={coordinator} robot={coordinator.robot} onClose={onClose} />
              </div>
            );
          } else {
            return <div key={shortAlias} />;
          }
        })}
      </DialogContent>
    </Dialog>
  );
};

export default ProfileDialog;

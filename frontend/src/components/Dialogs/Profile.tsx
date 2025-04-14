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
  Button,
  Alert,
} from '@mui/material';
import BoltIcon from '@mui/icons-material/Bolt';
import RedeemIcon from '@mui/icons-material/Redeem';
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
  const { garage, slotUpdatedAt } = useContext<UseGarageStoreType>(GarageContext);
  const { t } = useTranslation();
  const [showClaimInfo, setShowClaimInfo] = useState<boolean>(false);

  const slot = garage.getSlot();

  const [loading, setLoading] = useState<boolean>(true);
  const [loadingRobots, setLoadingRobots] = useState<number>(
    Object.values(slot?.robots ?? {}).length,
  );

  useEffect(() => {
    setLoading(!garage.getSlot()?.hashId);
    setLoadingRobots(Object.values(slot?.robots ?? {}).filter((robot) => robot.loading).length);
  }, [slotUpdatedAt]);

  const handleClaimReward = () => {
    setShowClaimInfo(true);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="profile-title"
      aria-describedby="profile-description"
      sx={{ '& .MuiDialog-paper': { minWidth: '300px', maxWidth: '500px', borderRadius: '8px' } }}
    >
      <div style={{ display: loading ? 'block' : 'none', padding: '0' }}>
        <LinearProgress sx={{ height: '6px', borderRadius: '4px' }} />
      </div>
      <DialogContent sx={{ padding: '20px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 600, color: '#333' }}>
            {t('Your Robot')}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<RedeemIcon />}
            onClick={handleClaimReward}
            sx={{
              borderRadius: '20px',
              textTransform: 'none',
              padding: '6px 16px',
              fontWeight: 500,
              backgroundColor: '#1976d2', // Default primary color
              '&:hover': { backgroundColor: '#1565c0' },
            }}
          >
            {t('Claim Reward')}
          </Button>
        </div>

        {showClaimInfo && (
          <Alert
            severity="info"
            sx={{
              marginBottom: '16px',
              borderRadius: '8px',
              backgroundColor: '#e3f2fd',
              color: '#0d47a1',
            }}
          >
            {t(
              'To claim your rewards, please contact the coordinator of your last order. If the payment fails, you must contact the coordinator - do not generate a new invoice.',
            )}
          </Alert>
        )}

        <List sx={{ padding: 0 }}>
          <Divider sx={{ margin: '12px 0', backgroundColor: '#e0e0e0' }} />

          <ListItem
            sx={{
              padding: '12px 0',
              alignItems: 'center',
              '&:hover': { backgroundColor: '#f5f5f5', borderRadius: '4px' },
            }}
          >
            <ListItemText>
              <Typography variant="h6" sx={{ fontWeight: 500, color: '#555' }}>
                {garage.getSlot()?.nickname ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <BoltIcon sx={{ color: '#fcba03', height: '24px', width: '24px' }} />
                    <span style={{ color: '#333', fontSize: '1.25rem' }}>
                      {garage.getSlot()?.nickname}
                    </span>
                    <BoltIcon sx={{ color: '#fcba03', height: '24px', width: '24px' }} />
                  </div>
                ) : (
                  <span style={{ color: '#888', fontStyle: 'italic' }}>{t('No nickname set')}</span>
                )}
              </Typography>

              {loadingRobots > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#888' }}>
                    {t('Looking for your robot!')}
                  </Typography>
                  <LinearProgress
                    sx={{ marginTop: '4px', height: '4px', borderRadius: '2px', backgroundColor: '#e0e0e0' }}
                  />
                </div>
              )}
            </ListItemText>

            <ListItemAvatar>
              <RobotAvatar
                avatarClass="profileAvatar"
                style={{
                  width: 65,
                  height: 65,
                  border: '2px solid #fcba03',
                  borderRadius: '50%',
                }}
                hashId={garage.getSlot()?.hashId ?? ''}
              />
            </ListItemAvatar>
          </ListItem>

          <Divider sx={{ margin: '12px 0', backgroundColor: '#e0e0e0' }} />
        </List>

        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 600, color: '#333', marginBottom: '12px' }}
        >
          {t('Coordinators that know your robot:')}
        </Typography>

        {federation.getCoordinators().map((coordinator: Coordinator) => {
          const coordinatorRobot = garage.getSlot()?.getRobot(coordinator.shortAlias);
          return (
            <div
              key={coordinator.shortAlias}
              style={{ marginBottom: '12px', padding: '8px', borderRadius: '4px' }}
            >
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
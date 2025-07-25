import React, { useContext, useMemo } from 'react';
import { Tooltip, Card, CardHeader, useTheme } from '@mui/material';
import { type Event } from 'nostr-tools';

// Icons
import { Coordinator } from '../../../../models';
import RobotAvatar from '../../../../components/RobotAvatar';
import { UseAppStoreType, AppContext } from '../../../../contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { Grid } from '@mui/system';
import { GarageContext, UseGarageStoreType } from '../../../../contexts/GarageContext';

interface Props {
  event: Event;
  robotHashId?: string;
  coordinator?: Coordinator;
  setShow: (show: boolean) => void;
}

const NotificationCard: React.FC<Props> = ({ event, robotHashId, coordinator, setShow }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { navigateToPage } = useContext<UseAppStoreType>(AppContext);
  const { garage } = useContext<UseGarageStoreType>(GarageContext);

  const cardColor = theme.palette.mode === 'light' ? '#d1e6fa' : '#082745';

  const avatar = useMemo(() => {
    if (!coordinator) return <></>;

    return (
      <Grid item style={{ display: 'flex', flexDirection: 'column' }}>
        <RobotAvatar
          shortAlias={coordinator.federated ? coordinator.shortAlias : undefined}
          hashId={coordinator.federated ? undefined : coordinator.mainnet.onion}
          style={{ width: '1.55em', height: '1.55em', marginBottom: '1em' }}
          smooth={true}
          small={true}
        />
        <RobotAvatar
          hashId={robotHashId}
          style={{ width: '1.55em', height: '1.55em' }}
          smooth={true}
          small={true}
        />
      </Grid>
    );
  }, [coordinator]);

  const handleOnClick = () => {
    const orderId = event.tags.find((t) => t[0] === 'order_id')?.[1];
    if (orderId) {
      const nostrHexPubkey = event.tags.find((t) => t[0] === 'p')?.[1];
      const slot = garage.getSlotByNostrPubKey(nostrHexPubkey ?? '');
      if (slot?.token) {
        setShow(false);
        garage.setCurrentSlot(slot.token);
        navigateToPage(`order/${orderId}`, navigate);
      }
    }
  };

  return (
    <Card elevation={5} style={{ width: '100%' }}>
      <CardHeader
        sx={{ color: theme.palette.text.secondary }}
        avatar={avatar}
        style={{ backgroundColor: cardColor }}
        onClick={handleOnClick}
        title={
          <Tooltip
            placement='top'
            enterTouchDelay={0}
            enterDelay={500}
            enterNextDelay={2000}
            title={
              <>
                {new Date(event.created_at).toLocaleString()}
                <br />
                {coordinator?.longAlias}
              </>
            }
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                position: 'relative',
                left: '-0.35em',
                width: '100%',
              }}
            >
              <div
                style={{
                  width: '11.78em',
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                {event.content}
              </div>
            </div>
          </Tooltip>
        }
      />
    </Card>
  );
};

export default NotificationCard;

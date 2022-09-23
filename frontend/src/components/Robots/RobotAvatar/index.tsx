import React from 'react';
import SmoothImage from 'react-smooth-image';
import { Avatar, Badge, Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { SendReceiveIcon } from '../../Icons';

interface DepthChartProps {
  nickname: string;
  smooth?: boolean;
  style?: object;
  statusColor?: 'primary' | 'secondary' | 'default' | 'error' | 'info' | 'success' | 'warning';
  orderType?: number;
  tooltip?: string;
  avatarClass?: string;
  onLoad?: () => void;
}

const RobotAvatar: React.FC<DepthChartProps> = ({
  nickname,
  orderType,
  statusColor,
  tooltip,
  smooth = false,
  style = {},
  avatarClass = 'flippedSmallAvatar',
  onLoad = () => {},
}) => {
  const { t } = useTranslation();

  const avatarSrc: string = window.location.origin + '/static/assets/avatars/' + nickname + '.png';

  const statusBadge = (
    <div style={{ position: 'relative', left: '6px', top: '1px' }}>
      {orderType === 0 ? (
        <SendReceiveIcon
          sx={{ transform: 'scaleX(-1)', height: '18px', width: '18px' }}
          color='secondary'
        />
      ) : (
        <SendReceiveIcon sx={{ height: '20px', width: '20px' }} color='primary' />
      )}
    </div>
  );

  const getAvatar = () => {
    if (smooth) {
      return (
        <div style={style}>
          <SmoothImage
            className={avatarClass}
            src={avatarSrc}
            imageStyles={{
              borderRadius: '50%',
              transform: 'scaleX(-1)',
              border: '0.3px solid #555',
              filter: 'dropShadow(0.5px 0.5px 0.5px #000000)',
            }}
          />
        </div>
      );
    } else {
      return (
        <Avatar
          className={avatarClass}
          style={style}
          alt={nickname}
          src={avatarSrc}
          imgProps={{
            onLoad,
          }}
        />
      );
    }
  };

  const getAvatarWithBadges = () => {
    let component = getAvatar();

    if (statusColor) {
      component = (
        <Badge variant='dot' overlap='circular' badgeContent='' color={statusColor}>
          {component}
        </Badge>
      );
    }

    if (orderType !== undefined) {
      component = (
        <Badge
          overlap='circular'
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          badgeContent={statusBadge}
        >
          {component}
        </Badge>
      );
    }

    return component;
  };

  return tooltip ? (
    <Tooltip placement='right' enterTouchDelay={0} title={tooltip}>
      {getAvatarWithBadges()}
    </Tooltip>
  ) : (
    getAvatarWithBadges()
  );
};

export default RobotAvatar;

import React, { useEffect, useState } from 'react';
import SmoothImage from 'react-smooth-image';
import { Avatar, Badge, Tooltip, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { SendReceiveIcon } from '../Icons';
import { apiClient } from '../../services/api';
import placeholder from './placeholder.json';

interface Props {
  nickname: string;
  smooth?: boolean;
  flipHorizontally?: boolean;
  style?: object;
  imageStyle?: object;
  statusColor?: 'primary' | 'secondary' | 'default' | 'error' | 'info' | 'success' | 'warning';
  orderType?: number;
  tooltip?: string;
  tooltipPosition?: string;
  avatarClass?: string;
  onLoad?: () => void;
}

const RobotAvatar: React.FC<Props> = ({
  nickname,
  orderType,
  statusColor,
  tooltip,
  tooltipPosition = 'right',
  smooth = false,
  flipHorizontally = false,
  style = {},
  avatarClass = 'flippedSmallAvatar',
  imageStyle = {},
  onLoad = () => {},
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [avatarSrc, setAvatarSrc] = useState<string>();

  useEffect(() => {
    if (nickname) {
      apiClient.fileImageUrl('/static/assets/avatars/' + nickname + '.png').then(setAvatarSrc);
    }
  }, [nickname]);

  const statusBadge = (
    <div style={{ position: 'relative', left: '0.428em', top: '0.07em' }}>
      {orderType === 0 ? (
        <SendReceiveIcon
          sx={{ transform: 'scaleX(-1)', height: '0.8em', width: '0.8em' }}
          color='secondary'
        />
      ) : (
        <SendReceiveIcon sx={{ height: '0.8em', width: '0.8em' }} color='primary' />
      )}
    </div>
  );

  const getAvatar = () => {
    if (smooth) {
      return (
        <div
          style={{
            ...style,
            imageRendering: 'high-quality',
            backgroundSize: '100%',
            borderRadius: '50%',
            transform: flipHorizontally ? 'scaleX(-1)' : '',
            border: '0.3px solid #55555',
            filter: 'dropShadow(0.5px 0.5px 0.5px #000000)',
            backgroundImage: `url(data:${placeholder.image.mime};base64,${placeholder.image.data})`,
          }}
        >
          <div className={theme.palette.mode === 'dark' ? 'loadingAvatarDark' : 'loadingAvatar'}>
            <SmoothImage
              src={avatarSrc}
              imageStyles={{
                borderRadius: '50%',
                border: '0.3px solid #55555',
                filter: 'dropShadow(0.5px 0.5px 0.5px #000000)',
                ...imageStyle,
              }}
            />
          </div>
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
    <Tooltip placement={tooltipPosition} enterTouchDelay={0} title={tooltip}>
      {getAvatarWithBadges()}
    </Tooltip>
  ) : (
    getAvatarWithBadges()
  );
};

export default RobotAvatar;

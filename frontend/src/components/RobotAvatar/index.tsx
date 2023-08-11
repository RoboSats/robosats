import React, { useCallback, useEffect, useMemo, useState } from 'react';
import SmoothImage from 'react-smooth-image';
import { Avatar, Badge, Tooltip } from '@mui/material';
import { SendReceiveIcon } from '../Icons';
import { apiClient } from '../../services/api';
import placeholder from './placeholder.json';

interface Props {
  nickname: string | undefined;
  smooth?: boolean;
  coordinator?: boolean;
  small?: boolean;
  flipHorizontally?: boolean;
  style?: object;
  imageStyle?: object;
  placeholderType?: 'loading' | 'generating';
  statusColor?: 'primary' | 'secondary' | 'default' | 'error' | 'info' | 'success' | 'warning';
  orderType?: number;
  tooltip?: string;
  tooltipPosition?: string;
  avatarClass?: string;
  onLoad?: () => void;
  baseUrl: string;
}

interface BackgroundData {
  mime: string;
  data: string;
}

const RobotAvatar: React.FC<Props> = ({
  nickname,
  orderType,
  statusColor,
  tooltip,
  tooltipPosition = 'right',
  smooth = false,
  small = false,
  flipHorizontally = false,
  placeholderType = 'loading',
  style = {},
  avatarClass = 'flippedSmallAvatar',
  imageStyle = {},
  onLoad = () => {},
  coordinator = false,
  baseUrl,
}) => {
  const [avatarSrc, setAvatarSrc] = useState<string>();
  const [nicknameReady, setNicknameReady] = useState<boolean>(false);
  const [activeBackground, setActiveBackground] = useState<boolean>(true);

  const path = coordinator ? '/static/federation/' : '/static/assets/avatars/';
  const [backgroundData] = useState<BackgroundData>(
    placeholderType === 'generating' ? placeholder.generating : placeholder.loading,
  );
  const backgroundImage = `url(data:${backgroundData.mime};base64,${backgroundData.data})`;
  const className = placeholderType === 'loading' ? 'loadingAvatar' : 'generatingAvatar';

  useEffect(() => {
    if (nickname !== undefined) {
      if (window.NativeRobosats === undefined) {
        setAvatarSrc(`${baseUrl}${path}${nickname}${small ? '.small' : ''}.webp`);
        setNicknameReady(true);
      } else {
        setNicknameReady(true);
        void apiClient
          .fileImageUrl(baseUrl, `${path}${nickname}${small ? '.small' : ''}.webp`)
          .then(setAvatarSrc);
      }
    } else {
      setNicknameReady(false);
      setActiveBackground(true);
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

  const avatar = useMemo(() => {
    if (smooth) {
      return (
        <div
          style={{
            ...style,
            backgroundSize: '100%',
            borderRadius: '50%',
            transform: flipHorizontally ? 'scaleX(-1)' : '',
            border: '0.3px solid #55555',
            filter: 'dropShadow(0.5px 0.5px 0.5px #000000)',
            backgroundImage: activeBackground ? backgroundImage : '',
          }}
        >
          <div className={className}>
            <SmoothImage
              src={nicknameReady ? avatarSrc : null}
              imageStyles={{
                borderRadius: '50%',
                border: '0.3px solid #55555',
                filter: 'dropShadow(0.5px 0.5px 0.5px #000000)',
                ...imageStyle,
                onLoad: setTimeout(() => {
                  setActiveBackground(false);
                }, 5000),
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
          src={nicknameReady ? avatarSrc : null}
          imgProps={{
            sx: { transform: flipHorizontally ? 'scaleX(-1)' : '' },
            style: { transform: flipHorizontally ? 'scaleX(-1)' : '' },
            onLoad,
          }}
        />
      );
    }
  }, [nickname, nicknameReady, avatarSrc, statusColor, tooltip, avatarClass]);

  const getAvatarWithBadges = useCallback(() => {
    let component = avatar;

    if (statusColor !== undefined) {
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

    if (tooltip !== undefined) {
      component = (
        <Tooltip placement={tooltipPosition} enterTouchDelay={0} title={tooltip}>
          {component}
        </Tooltip>
      );
    }
    return component;
  }, [avatar]);

  return getAvatarWithBadges();
};

export default RobotAvatar;

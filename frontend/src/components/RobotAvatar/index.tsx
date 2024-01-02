import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import SmoothImage from 'react-smooth-image';
import { Avatar, Badge, Tooltip } from '@mui/material';
import { SendReceiveIcon } from '../Icons';
import placeholder from './placeholder.json';
import { robohash } from './RobohashGenerator';
import { AppContext, UseAppStoreType } from '../../contexts/AppContext';

interface Props {
  shortAlias?: string | undefined;
  hashId?: string | undefined;
  smooth?: boolean;
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
}

interface BackgroundData {
  mime: string;
  data: string;
}

const RobotAvatar: React.FC<Props> = ({
  shortAlias,
  hashId,
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
}) => {
  const [avatarSrc, setAvatarSrc] = useState<string>('');
  const [activeBackground, setActiveBackground] = useState<boolean>(true);
  const { hostUrl } = useContext<UseAppStoreType>(AppContext);
  const backgroundFadeTime = 3000;

  const [backgroundData] = useState<BackgroundData>(placeholder.loading);
  const backgroundImage = `url(data:${backgroundData.mime};base64,${backgroundData.data})`;
  const className = placeholderType === 'loading' ? 'loadingAvatar' : 'generatingAvatar';

  useEffect(() => {
    // TODO: HANDLE ANDROID AVATARS TOO (when window.NativeRobosats !== undefined)
    if (hashId !== undefined) {
      robohash
        .generate(hashId, small ? 'small' : 'large')
        .then((avatar) => {
          setAvatarSrc(avatar);
        })
        .catch(() => {
          setAvatarSrc('');
        });
      setTimeout(() => {
        setActiveBackground(false);
      }, backgroundFadeTime);
    }
  }, [hashId]);

  useEffect(() => {
    if (shortAlias !== undefined) {
      if (window.NativeRobosats === undefined) {
        setAvatarSrc(
          `${hostUrl}/static/federation/avatars/${shortAlias}${small ? '.small' : ''}.webp`,
        );
      } else {
        setAvatarSrc(
          `file:///android_asset/Web.bundle/assets/federation/avatars/${shortAlias}${
            small ? ' .small' : ''
          }.webp`,
        );
      }
      setTimeout(() => {
        setActiveBackground(false);
      }, backgroundFadeTime);
    } else {
      setActiveBackground(true);
    }
  }, [shortAlias]); // TODO: should hashId

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
            backgroundImage:
              activeBackground && placeholderType == 'loading' ? backgroundImage : '',
          }}
        >
          <div className={className}>
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
          alt={hashId ?? shortAlias ?? 'unknown'}
          src={avatarSrc}
          imgProps={{
            sx: { transform: flipHorizontally ? 'scaleX(-1)' : '' },
            style: { transform: flipHorizontally ? 'scaleX(-1)' : '' },
            onLoad,
          }}
        />
      );
    }
  }, [hashId, shortAlias, avatarSrc, statusColor, tooltip, avatarClass]);

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

import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Avatar, Badge, Tooltip, type TooltipProps } from '@mui/material';
import { SendReceiveIcon } from '../Icons';
import placeholder from './placeholder.json';
import { AppContext, type UseAppStoreType } from '../../contexts/AppContext';
import { roboidentitiesClient } from '../../services/Roboidentities/Web';

interface Props {
  shortAlias?: string;
  coordinatorShortAlias?: string;
  hashId?: string;
  smooth?: boolean;
  small?: boolean;
  flipHorizontally?: boolean;
  style?: object;
  imageStyle?: object;
  placeholderType?: 'loading' | 'generating';
  statusColor?: 'primary' | 'secondary' | 'default' | 'error' | 'info' | 'success' | 'warning';
  orderType?: number;
  tooltip?: string;
  tooltipPosition?: TooltipProps['placement'];
  baseUrl?: string;
  avatarClass?: string;
  onLoad?: () => void;
}

interface BackgroundData {
  mime: string;
  data: string;
}

const RobotAvatar: React.FC<Props> = ({
  shortAlias,
  coordinatorShortAlias,
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
  const [backgroundData] = useState<BackgroundData>(placeholder.loading);
  const backgroundImage = `url(data:${backgroundData.mime};base64,${backgroundData.data})`;
  const { hostUrl, client } = useContext<UseAppStoreType>(AppContext);
  const [, forceUpdate] = useState(0);

  const size = small ? 'small' : 'large';

  const avatarSrc: string | undefined = (() => {
    if (shortAlias) {
      return client !== 'mobile'
        ? `${hostUrl}/static/federation/avatars/${shortAlias}${small ? '.small' : ''}.webp`
        : `file:///android_asset/static/assets/federation/avatars/${shortAlias}.webp`;
    }
    if (hashId) {
      return roboidentitiesClient.getRobohashFromCache(hashId, size);
    }
    return undefined;
  })();

  const activeBackground = avatarSrc === undefined && !shortAlias;

  const className = placeholderType === 'loading' ? 'loadingAvatar' : 'generatingAvatar';

  useEffect(() => {
    if (!hashId || roboidentitiesClient.getRobohashFromCache(hashId, size) !== undefined) return;

    let cancelled = false;
    roboidentitiesClient
      .generateRobohash(hashId, size)
      .then(() => {
        if (!cancelled) forceUpdate((n) => n + 1);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [hashId, size]);

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

  const coordinatorBadge = (
    <div style={{ position: 'relative', right: '0.428em' }}>
      <RobotAvatar
        shortAlias={coordinatorShortAlias}
        style={{ height: '0.9em', width: '0.9em' }}
        small={true}
      />
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
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: 0,
                opacity: avatarSrc ? 1 : 0,
                overflow: 'hidden',
                paddingBottom: '100%',
              }}
            >
              {avatarSrc && (
                <img
                  src={avatarSrc}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    borderRadius: '50%',
                    border: '0.3px solid #55555',
                    filter: 'dropShadow(0.5px 0.5px 0.5px #000000)',
                    ...imageStyle,
                  }}
                />
              )}
            </div>
          </div>
        </div>
      );
    } else {
      const src = avatarSrc ?? `data:${backgroundData.mime};base64,${backgroundData.data}`;
      return (
        <Avatar
          className={avatarClass}
          style={style}
          alt={hashId ?? shortAlias ?? 'unknown'}
          src={src}
          slotProps={{
            img: {
              style: { transform: flipHorizontally ? 'scaleX(-1)' : '' },
              onLoad,
            },
          }}
        />
      );
    }
  }, [
    hashId,
    shortAlias,
    avatarSrc,
    avatarClass,
    activeBackground,
    smooth,
    flipHorizontally,
    className,
    backgroundImage,
    imageStyle,
    style,
  ]);

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

    if (coordinatorShortAlias !== undefined) {
      component = (
        <Badge
          overlap='circular'
          anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
          badgeContent={coordinatorBadge}
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

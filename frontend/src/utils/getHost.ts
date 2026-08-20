import defaultFederation from '../../static/federation.json';
import { Origin } from '../models';

export const getHost = function (): string {
  const url =
    window.location !== window.parent.location ? document.referrer : document.location.href;
  return url.split('/')[2];
};

export const getHostUrl = (network = 'mainnet'): string => {
  const [client] = window.RobosatsSettings.split('-');
  const randomAlias =
    Object.keys(defaultFederation)[
      Math.floor(Math.random() * Object.keys(defaultFederation).length)
    ];
  const fedEntry = (
    defaultFederation as unknown as Record<string, Record<string, Record<string, string>>>
  )[randomAlias];
  const onionUrl = fedEntry?.[network]?.['onion'];
  if (!onionUrl) {
    console.warn(
      `[getHostUrl] No onion URL found for coordinator "${randomAlias}" on network "${network}". Falling back to empty host.`,
    );
  }
  let host: string = onionUrl ?? '';
  let protocol: string = 'http:';
  if (client !== 'mobile') {
    host = getHost();
    protocol = location.protocol;
  }
  const hostUrl = `${protocol}//${host}`;
  return hostUrl;
};

export const getOrigin = (network = 'mainnet'): Origin => {
  const host = getHostUrl(network);
  let origin: Origin = 'onion';
  const [client] = window.RobosatsSettings.split('-');
  if (
    client === 'mobile' ||
    client === 'desktop' ||
    host.includes('.onion') ||
    host.includes(':8888')
  ) {
    origin = 'onion';
  } else if (host.includes('i2p')) {
    origin = 'i2p';
  } else {
    origin = 'clearnet';
  }

  return origin;
};

export default getHost;

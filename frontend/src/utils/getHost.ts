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
  let host: string = defaultFederation[randomAlias][network].onion;
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

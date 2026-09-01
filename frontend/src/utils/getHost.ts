import { Origin } from '../models';
import { Federation } from '../models/Federation.model';

export const getHost = function (): string {
  const url =
    window.location !== window.parent.location ? document.referrer : document.location.href;
  return url.split('/')[2];
};

/** Return the live federation document from the Federation model's static property. */
function getLiveFederation(): Record<string, Record<string, Record<string, string>>> {
  return Federation.liveFedDoc as Record<string, Record<string, Record<string, string>>>;
}

export const getHostUrl = (network = 'mainnet'): string => {
  const [client] = window.RobosatsSettings.split('-');
  // For non-mobile clients the host comes from window.location, not the federation list.
  if (client !== 'mobile') {
    return `${location.protocol}//${getHost()}`;
  }
  // Mobile: pick a random onion from the live (voted) federation list.
  const liveFed = getLiveFederation();
  const aliases = Object.keys(liveFed);
  const randomAlias = aliases[Math.floor(Math.random() * aliases.length)];
  const fedEntry = liveFed[randomAlias];
  const onionUrl = fedEntry?.[network]?.['onion'];
  if (!onionUrl) {
    console.warn(
      `[getHostUrl] No onion URL found for coordinator "${randomAlias}" on network "${network}". Falling back to empty host.`,
    );
  }
  return `http://${onionUrl ?? ''}`;
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

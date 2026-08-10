import { apiClient } from './api';
import type { Federation } from '../models';

const PROFILE_TTL = 30 * 60 * 1000;
const PROBE_TIMEOUT = 15 * 1000;

let cache: { key: string; at: number; map: Record<string, number> } | null = null;

const isReachableUrl = (url: string | undefined): boolean =>
  url !== undefined && url !== '' && url !== 'null' && url !== 'undefined';

const probeDevFund = async (
  shortAlias: string,
  url: string,
): Promise<{ shortAlias: string; donatesToDevFund: number } | null> => {
  const data = (await Promise.race([
    apiClient.get(url, '/api/info/', undefined, true),
    new Promise((resolve) => setTimeout(() => resolve(null), PROBE_TIMEOUT)),
  ])) as { devfund?: unknown } | null;

  const donatesToDevFund = data?.devfund;
  if (typeof donatesToDevFund === 'number' && Number.isFinite(donatesToDevFund)) {
    return { shortAlias, donatesToDevFund };
  }
  return null;
};

export const fetchDevFundProfiles = async (
  federation: Federation,
): Promise<Record<string, number>> => {
  const coordinators = federation
    .getCoordinators()
    .filter((coordinator) => coordinator.enabled === true && coordinator.shortAlias !== 'local');
  const urls = coordinators
    .map((coordinator) => `${coordinator.shortAlias}|${coordinator.url}`)
    .sort()
    .join(';');

  if (cache && cache.key === urls && Date.now() - cache.at < PROFILE_TTL) {
    return cache.map;
  }

  const results: Record<string, number> = {};
  await Promise.allSettled(
    coordinators
      .filter((coordinator) => isReachableUrl(coordinator.url))
      .map((coordinator) =>
        probeDevFund(coordinator.shortAlias, coordinator.url).then((profile) => {
          if (profile) results[profile.shortAlias] = profile.donatesToDevFund;
        }),
      ),
  );

  cache = { key: urls, at: Date.now(), map: results };
  return results;
};

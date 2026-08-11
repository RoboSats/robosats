import type { Coordinator, Federation } from '../models';

const PROFILE_TTL = 30 * 60 * 1000;
const PROBE_TIMEOUT = 15 * 1000;

let cache: { key: string; at: number; map: Record<string, number> } | null = null;

const isReachableUrl = (url: string | undefined): boolean =>
  url !== undefined && url !== '' && url !== 'null' && url !== 'undefined';

const readDevFund = (coordinator: Coordinator): number | undefined => {
  const devfund = coordinator.info?.devfund;
  return typeof devfund === 'number' && Number.isFinite(devfund) ? devfund : undefined;
};

const loadCoordinatorDevFund = async (coordinator: Coordinator): Promise<number | undefined> => {
  if (readDevFund(coordinator) !== undefined) return readDevFund(coordinator);
  await Promise.race([
    coordinator.loadInfo(),
    new Promise((resolve) => setTimeout(resolve, PROBE_TIMEOUT)),
  ]);
  return readDevFund(coordinator);
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
        loadCoordinatorDevFund(coordinator).then((donatesToDevFund) => {
          if (donatesToDevFund !== undefined) results[coordinator.shortAlias] = donatesToDevFund;
        }),
      ),
  );

  cache = { key: urls, at: Date.now(), map: results };
  return results;
};

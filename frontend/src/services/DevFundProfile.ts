import type { Coordinator, Federation } from '../models';

const PROFILE_TTL = 30 * 60 * 1000;

let cache: { key: string; at: number; map: Record<string, number> } | null = null;

const readDevFund = (coordinator: Coordinator): number | undefined => {
  const devfund = coordinator.info?.devfund;
  return typeof devfund === 'number' && Number.isFinite(devfund) ? devfund : undefined;
};

/**
 * Reads already-loaded coordinator.info.devfund for each enabled coordinator.
 * This must be called after loadCoordinatorData() has settled so that info is
 * already populated — no HTTP requests are issued here.
 * Coordinators without loaded info simply contribute no DevFund override and
 * their badges.donatesToDevFund falls back to the static federation.json value.
 */
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
  coordinators.forEach((coordinator) => {
    const devFund = readDevFund(coordinator);
    if (devFund !== undefined) results[coordinator.shortAlias] = devFund;
  });

  cache = { key: urls, at: Date.now(), map: results };
  return results;
};

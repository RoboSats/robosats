// Sorts/ranks coordinators randomly
//
// This function returns a list of coordinators short aliases that is used for
//     1. Sort the order book orders
//     2. Show a default host on the maker form page
//
// The sorting of coordinators possibly has a direct relationship to the amount
// of trades that they will host as many robots might not have a strong preference
//
// The coordinators will be sampled at random weighted by the % contribution they
// donate to the development fund. This is the only way envisioned to incentivize
// donations to the development fund.

import defaultFederation from '../../static/federation.json';

export default function federationLottery(): string[] {
  return Object.values(defaultFederation)
    .map((coor) => {
      const chance = coor.badges.donatesToDevFund > 50 ? 50 : coor.badges?.donatesToDevFund || 0;

      return {
        shortAlias: coor.shortAlias,
        weight: chance > 0 ? -Math.log(Math.random()) / chance : Number.POSITIVE_INFINITY,
        tie: Math.random(), // Add a random tie-breaker to ensure fairness in case of equal chances
      };
    })
    .sort((a, b) => a.weight - b.weight || a.tie - b.tie)
    .map((coordinator) => coordinator.shortAlias);
}

// // Verification

// function generateSampleFederation(numCoordinators: number): Record<string, { badges:{ donatesToDevFund: number }}> {
// const federation: Record<string, {badges:{ donatesToDevFund: number }}> = {};

// for (let i = 0; i < numCoordinators; i++) {
//     const shortAlias = `user${i + 1}`;
//     const donatesToDevFund = Math.floor(Math.random()*100);
//     federation[shortAlias] = { badges:{ donatesToDevFund }};
// }

// return federation;
// }

// function runFederationLotteryMultipleTimes(numTimes: number, numCoordinators: number): string[][] {
// const results: string[][] = [];
// const federation = generateSampleFederation(numCoordinators);

// for (let i = 0; i < numTimes; i++) {
//     const rankedCoordinators = federationLottery(federation);
//     results.push(rankedCoordinators);
// }

// }

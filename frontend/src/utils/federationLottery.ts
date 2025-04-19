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
  // Create an array to store the coordinator short aliases and their corresponding weights (chance)
  const coordinatorChance: Array<{ shortAlias: string; chance: number }> = [];

  // Convert the `federation` object into an array of {shortAlias, chance}
  Object.values(defaultFederation).forEach((coor) => {
    const chance = coor.badges.donatesToDevFund > 50 ? 50 : coor.badges?.donatesToDevFund;
    coordinatorChance.push({ shortAlias: coor.shortAlias, chance });
  });

  // Sort randomly the coordinatorChance array using weighted shuffling algorithm
  const shuffledCoordinators = coordinatorChance.sort((a, b) => {
    return Math.random() * b.chance - Math.random() * a.chance;
  });

  // Extract the coordinator names from the shuffled array and return the result
  const sortedCoordinators = shuffledCoordinators.map((coordinator) => coordinator.shortAlias);

  return sortedCoordinators;
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

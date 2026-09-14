/** Minimal stub for the Roboidentities service used in Jest tests.
 *  RoboidentitiesWebClient pulls in robo-identities-wasm (WASM/ESM-only),
 *  which cannot run in a plain Node Jest env. */
import { type RoboidentitiesClient } from '../Roboidentities/type';

const client: RoboidentitiesClient = {
  generateRoboname: (_initialString: string) => Promise.resolve('TestRobot'),
  generateRobohash: (_initialString: string, _size: 'small' | 'large') => Promise.resolve(''),
};

export const roboidentitiesClient = client;

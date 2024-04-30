export interface RoboidentitiesClient {
  generateRoboname: (initialString: string) => Promise<string>;
  generateRobohash: (initialString: string, size: 'small' | 'large') => Promise<string>;
}

export interface RoboidentitiesClient {
  generateRoboname: (initialString: string) => Promise<string>;
  generateRobohash: (initialString: string, size: 'small' | 'large') => Promise<string>;
  getRobohashFromCache: (initialString: string, size: 'small' | 'large') => string | undefined;
}

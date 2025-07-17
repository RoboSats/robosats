import worldmap from '../../static/assets/geo/countries-coastline-10km.geo.json';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const getWorldmapGeojson = async (_apiClient, _baseUrl) => {
  return worldmap;
};

export default getWorldmapGeojson;

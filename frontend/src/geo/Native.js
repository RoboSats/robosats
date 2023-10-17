import worldmap from '../../static/assets/geo/countries-coastline-10km.geo.json';

const getWorldmapGeojson = async (_apiClient, _baseUrl) => {
  return worldmap;
};

export default getWorldmapGeojson;

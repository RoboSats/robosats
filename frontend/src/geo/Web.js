export const getWorldmapGeojson = async (apiClient, baseUrl) => {
  return apiClient.get(baseUrl, '/static/assets/geo/countries-coastline-10km.geo.json');
};

export default getWorldmapGeojson;

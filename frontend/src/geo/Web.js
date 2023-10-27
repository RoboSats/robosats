// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const getWorldmapGeojson = async (apiClient, baseUrl) => {
  return apiClient.get(baseUrl, '/static/assets/geo/countries-coastline-10km.geo.json');
};

export default getWorldmapGeojson;

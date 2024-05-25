// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const getWorldmapGeojson = async (apiClient, baseUrl) => {
  return apiClient.get(baseUrl.substring(baseUrl.indexOf("http://")+7), '/static/assets/geo/countries-coastline-10km.geo.json');
};

export default getWorldmapGeojson;

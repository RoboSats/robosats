import TorModule from '../../lib/native/TorModule';

class TorClient {
  public get: (baseUrl: string, path: string, headers: object) => Promise<object> = async (
    baseUrl,
    path,
    headers,
  ) => {
    return await new Promise<object>(async (resolve, reject) => {
      try {
        const response = await TorModule.sendRequest(
          'GET',
          `${baseUrl}${path}`,
          JSON.stringify(headers),
          '{}',
        );
        resolve(JSON.parse(response));
      } catch (error) {
        reject(error);
      }
    });
  };

  public delete: (baseUrl: string, path: string, headers: object) => Promise<object> = async (
    baseUrl,
    path,
    headers,
  ) => {
    return await new Promise<object>(async (resolve, reject) => {
      try {
        const response = await TorModule.sendRequest(
          'DELETE',
          `${baseUrl}${path}`,
          JSON.stringify(headers),
          '{}',
        );
        resolve(JSON.parse(response));
      } catch (error) {
        reject(error);
      }
    });
  };

  public post: (baseUrl: string, path: string, body: object, headers: object) => Promise<object> =
    async (baseUrl, path, body, headers) => {
      return await new Promise<object>(async (resolve, reject) => {
        try {
          const json = JSON.stringify(body);
          const response = await TorModule.sendRequest(
            'POST',
            `${baseUrl}${path}`,
            JSON.stringify(headers),
            json,
          );
          resolve(JSON.parse(response));
        } catch (error) {
          reject(error);
        }
      });
    };
}

export default TorClient;

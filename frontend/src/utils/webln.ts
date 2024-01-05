import { requestProvider, type WebLNProvider } from 'webln';

const getWebln = async (): Promise<WebLNProvider> => {
  const resultPromise = new Promise<WebLNProvider>((resolve, reject) => {
    requestProvider()
      .then((webln) => {
        if (webln.enable !== undefined) {
          webln.enable().catch((error) => {
            console.error("Couldn't enable Webln:", error);
            reject(error);
          });
          resolve(webln);
        }
      })
      .catch((error) => {
        console.log("Couldn't connect to Webln:", error);
        reject(new Error("Couldn't connect to Webln"));
      });
  });
  return await resultPromise;
};

export default getWebln;

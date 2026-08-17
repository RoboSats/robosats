import { requestProvider, type WebLNProvider } from 'webln';

const getWebln = async (): Promise<WebLNProvider> => {
  const resultPromise = new Promise<WebLNProvider>((resolve, reject) => {
    requestProvider()
      .then((webln) => {
        if (webln != null) {
          webln
            .enable()
            .then(() => {
              resolve(webln);
            })
            .catch(() => {
              reject(new Error("Couldn't connect to Webln"));
            });
        } else {
          reject(new Error("Couldn't connect to Webln"));
        }
      })
      .catch((err) => {
        console.log("Couldn't connect to Webln", err);
        reject(err);
      });
  });

  return await resultPromise;
};

export default getWebln;

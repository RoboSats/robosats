import { requestProvider, WeblnProvider } from 'webln';

export const getWebln = async (): Promise<WeblnProvider> => {
  const resultPromise = new Promise<WeblnProvider>(async (resolve, reject) => {
    try {
      const webln = await requestProvider();
      if (webln) {
        webln.enable();
        resolve(webln);
      }
    } catch (err) {
      console.log("Coulnd't connect to Webln");
      reject();
    }
  });

  return await resultPromise;
};

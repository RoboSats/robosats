import { requestProvider, WebLNProvider } from "webln";

export const getWebLN = async (): Promise<WebLNProvider> => {
  const resultPromise = new Promise<WebLNProvider>(async (resolve, reject) => {
    try {
      const webln = await requestProvider()
      if (webln) { 
        if (!webln.enable) { webln.enable() }
        resolve(webln)
      }
    } catch (err) {
      console.log("Coulnd't connect to WebLN")
      reject()
    }
  })

  return  resultPromise
}

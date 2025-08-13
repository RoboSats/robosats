/* function to save DATA as text from browser
 * @param {String} file -- file name to save to
 * @param {filename} data -- object to save
 */

import { systemClient } from '../services/System';

const saveAsJson = (
  filename: string,
  dataObjToWrite: object,
  client: 'mobile' | 'web' | 'desktop' | string,
): void => {
  const jsonString = JSON.stringify(dataObjToWrite, null, 2);

  if (client === 'mobile') {
    systemClient.copyToClipboard(jsonString);
  } else {
    const blob = new Blob([jsonString], { type: 'text/json' });
    const link = document.createElement('a');

    link.download = filename;
    link.href = window.URL.createObjectURL(blob);
    link.dataset.downloadurl = ['text/json', link.download, link.href].join(':');

    const evt = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true,
    });

    link.dispatchEvent(evt);
    link.remove();
  }
};

export default saveAsJson;

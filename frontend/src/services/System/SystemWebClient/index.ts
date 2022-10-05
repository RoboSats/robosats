import { SystemClient } from '..';

class SystemWebClient implements SystemClient {
  public copyToClipboard: (value: string) => void = (value) => {
    // navigator clipboard api needs a secure context (https)
    // this function attempts to copy also on http contexts
    // useful on the http i2p site and on torified browsers
    if (navigator.clipboard && window.isSecureContext) {
      // navigator clipboard api method'
      navigator.clipboard.writeText(value);
    } else {
      // text area method
      const textArea = document.createElement('textarea');
      textArea.value = value;
      // make the textarea out of viewport
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      // here the magic happens
      document.execCommand('copy');
      textArea.remove();
    }
  };
}

export default SystemWebClient;

const getHost = function (): string {
  const url =
    window.location !== window.parent.location ? document.referrer : document.location.href;
  return url.split('/')[2];
};

export default getHost;

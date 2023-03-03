import React, { useEffect, useRef } from 'react';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { SafeAreaView, Text, Platform, Appearance } from 'react-native';
import TorClient from './services/Tor';
import Clipboard from '@react-native-clipboard/clipboard';
import NetInfo from '@react-native-community/netinfo';
import EncryptedStorage from 'react-native-encrypted-storage';

const backgroundColors = {
  light: 'white',
  dark: 'black',
};

const App = () => {
  const colorScheme = Appearance.getColorScheme() ?? 'light';
  const torClient = new TorClient();
  const webViewRef = useRef<WebView>();
  const uri = (Platform.OS === 'android' ? 'file:///android_asset/' : '') + 'Web.bundle/index.html';

  const injectMessageResolve = (id: string, data?: object) => {
    const json = JSON.stringify(data || {});
    webViewRef.current?.injectJavaScript(
      `(function() {window.NativeRobosats.onMessageResolve(${id}, ${json});})();`,
    );
  };

  const injectMessage = (message: object) => {
    const json = JSON.stringify(message);
    webViewRef.current?.injectJavaScript(
      `(function() {window.NativeRobosats?.onMessage(${json});})();`,
    );
  };

  const init = (reponseId: string) => {
    const loadCookie = async (key: string) => {
      return await EncryptedStorage.getItem(key).then((value) => {
        if (value) {
          const json = JSON.stringify({ key, value });
          webViewRef.current?.injectJavaScript(
            `(function() {window.NativeRobosats?.loadCookie(${json});})();`,
          );
        }
      });
    };

    EncryptedStorage.removeItem('sessionid');
    EncryptedStorage.removeItem('csrftoken');
    loadCookie('settings_fontsize_basic');
    loadCookie('settings_language');
    loadCookie('settings_mode');
    loadCookie('settings_network');
    loadCookie('garage').then(() => injectMessageResolve(reponseId));
  };

  const onMessage = async (event: WebViewMessageEvent) => {
    const data = JSON.parse(event.nativeEvent.data);
    if (data.category === 'http') {
      sendTorStatus();
      if (data.type === 'get') {
        torClient
          .get(data.baseUrl, data.path, data.headers)
          .then((response: object) => {
            injectMessageResolve(data.id, response);
          })
          .catch(sendTorStatus)
          .finally(sendTorStatus);
      } else if (data.type === 'post') {
        torClient
          .post(data.baseUrl, data.path, data.body, data.headers)
          .then((response: object) => {
            injectMessageResolve(data.id, response);
          })
          .catch(sendTorStatus)
          .finally(sendTorStatus);
      } else if (data.type === 'delete') {
        torClient
          .delete(data.baseUrl, data.path, data.headers)
          .then((response: object) => {
            injectMessageResolve(data.id, response);
          })
          .catch(sendTorStatus)
          .finally(sendTorStatus);
      } else if (data.type === 'xhr') {
        torClient
          .request(data.baseUrl, data.path)
          .then((response: object) => {
            injectMessageResolve(data.id, response);
          })
          .catch(sendTorStatus)
          .finally(sendTorStatus);
      }
    } else if (data.category === 'system') {
      if (data.type === 'init') {
        init(data.id);
      } else if (data.type === 'copyToClipboardString') {
        Clipboard.setString(data.detail);
      } else if (data.type === 'setCookie') {
        setCookie(data.key, data.detail);
      } else if (data.type === 'deleteCookie') {
        EncryptedStorage.removeItem(data.key);
      }
    }
  };

  const setCookie = async (key: string, value: string) => {
    try {
      await EncryptedStorage.setItem(key, value);
      const storedValue = await EncryptedStorage.getItem(key);
      injectMessage({
        category: 'system',
        type: 'setCookie',
        key,
        detail: storedValue,
      });
    } catch (error) {}
  };

  const sendTorStatus = async () => {
    NetInfo.fetch().then(async (state) => {
      let daemonStatus = 'ERROR';
      if (state.isInternetReachable) {
        try {
          daemonStatus = await torClient.daemon.getDaemonStatus();
        } catch {}
      }

      injectMessage({
        category: 'system',
        type: 'torStatus',
        detail: daemonStatus,
      });
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: backgroundColors[colorScheme] }}>
      <WebView
        source={{
          uri,
        }}
        onMessage={onMessage}
        // @ts-expect-error
        style={{ backgroundColor: backgroundColors[colorScheme] }}
        ref={(ref) => (webViewRef.current = ref)}
        overScrollMode='never'
        javaScriptEnabled={true}
        domStorageEnabled={true}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        originWhitelist={[uri]}
        scalesPageToFit={true}
        startInLoadingState={true}
        mixedContentMode={'always'}
        allowsInlineMediaPlayback={true}
        allowsFullscreenVideo={false}
        setBuiltInZoomControls={false}
        allowingReadAccessToURL={uri}
        allowFileAccess={true}
        allowsBackForwardNavigationGestures={true}
        mediaPlaybackRequiresUserAction={false}
        allowsLinkPreview={false}
        renderLoading={() => <Text></Text>}
        onError={(syntheticEvent) => <Text>{syntheticEvent.type}</Text>}
      />
    </SafeAreaView>
  );
};

export default App;

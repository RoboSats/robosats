import React, { useRef, useEffect } from 'react';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { SafeAreaView, Text, Platform, Appearance, NativeModules } from 'react-native';
import TorClient from './services/Tor';
import Clipboard from '@react-native-clipboard/clipboard';
import NetInfo from '@react-native-community/netinfo';
import EncryptedStorage from 'react-native-encrypted-storage';
import { name as app_name, version as app_version } from './package.json';

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

  const init = (responseId: string) => {
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

    loadCookie('robot_token');
    loadCookie('settings_fontsize_basic');
    loadCookie('settings_language');
    loadCookie('settings_mode');
    loadCookie('settings_light_qr');
    loadCookie('settings_network');
    loadCookie('garage').then(() => injectMessageResolve(responseId));
  };

  const onCatch = (dataId: string, event: any) => {
    let json = '{}';
    let code = 500;
    if (event.message) {
      const reponse = /Request Response Code \((?<code>\d*)\)\: (?<json>\{.*\})/.exec(
        event.message,
      );
      json = reponse?.groups?.json ?? '{}';
      code = reponse?.groups?.code ? parseInt(reponse?.groups?.code) : 500;
    }
    injectMessageResolve(dataId, {
      headers: {},
      respCode: code,
      json: JSON.parse(json),
    });
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
          .catch((e) => onCatch(data.id, e))
          .finally(sendTorStatus);
      } else if (data.type === 'post') {
        torClient
          .post(data.baseUrl, data.path, data.body, data.headers)
          .then((response: object) => {
            injectMessageResolve(data.id, response);
          })
          .catch((e) => onCatch(data.id, e))
          .finally(sendTorStatus);
      } else if (data.type === 'delete') {
        torClient
          .delete(data.baseUrl, data.path, data.headers)
          .then((response: object) => {
            injectMessageResolve(data.id, response);
          })
          .catch((e) => onCatch(data.id, e))
          .finally(sendTorStatus);
      } else if (data.type === 'xhr') {
        torClient
          .request(data.baseUrl, data.path)
          .then((response: object) => {
            injectMessageResolve(data.id, response);
          })
          .catch((e) => onCatch(data.id, e))
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

  const sendTorStatus = async (event?: any) => {
    NetInfo.fetch().then(async (state) => {
      let daemonStatus = 'ERROR';
      if (state.isInternetReachable) {
        try {
          daemonStatus = await NativeModules.RoboTor.getTorStatus();
        } catch (e) {
          throw e;
        }
      }

      injectMessage({
        category: 'system',
        type: 'torStatus',
        detail: daemonStatus,
      });
    });
  };

  useEffect(() => {
    const bootstrapAsyncTor = async () => {
      try {
        await torClient.attemptStartTor();
      } catch (e) {
        console.error('Error starting Tor: ', e);
        throw e;
      }
    };
    bootstrapAsyncTor(); //hack to execute async method on app boot
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: backgroundColors[colorScheme] }}>
      <WebView
        source={{
          uri,
        }}
        onMessage={onMessage}
        // @ts-expect-error
        userAgent={`${app_name} v${app_version} Android`}
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
        mediaPlaybackRequiresUserAction={false} // Allow autoplay
        allowsLinkPreview={false}
        renderLoading={() => <Text></Text>}
        onError={(syntheticEvent) => <Text>{syntheticEvent.type}</Text>}
      />
    </SafeAreaView>
  );
};

export default App;

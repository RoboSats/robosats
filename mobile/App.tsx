import React, { useEffect, useRef } from 'react';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { SafeAreaView, Text, Platform, Appearance, DeviceEventEmitter } from 'react-native';
import TorClient from './services/Tor';
import Clipboard from '@react-native-clipboard/clipboard';
import EncryptedStorage from 'react-native-encrypted-storage';
import { name as app_name, version as app_version } from './package.json';
import TorModule from './native/TorModule';
import RoboIdentitiesModule from './native/RoboIdentitiesModule';
import NotificationsModule from './native/NotificationsModule';
import SystemModule from './native/SystemModule';

const backgroundColors = {
  light: 'white',
  dark: 'black',
};

export type TorStatus = 'ON' | 'STARTING' | 'STOPPING' | 'OFF';

const App = () => {
  const colorScheme = Appearance.getColorScheme() ?? 'light';
  const torClient = new TorClient();
  const webViewRef = useRef<WebView>();
  const uri = (Platform.OS === 'android' ? 'file:///android_asset/' : '') + 'Web.bundle/index.html';

  useEffect(() => {
    TorModule.start();
    DeviceEventEmitter.addListener('navigateToPage', (payload) => {
      window.navigateToPage = payload;
      injectMessage({
        category: 'system',
        type: 'navigateToPage',
        detail: payload,
      });
    });
    DeviceEventEmitter.addListener('TorStatus', (payload) => {
      if (payload.torStatus === 'OFF') TorModule.restart();
      injectMessage({
        category: 'system',
        type: 'torStatus',
        detail: payload.torStatus,
      });
    });
    DeviceEventEmitter.addListener('WsMessage', (payload) => {
      injectMessage({
        category: 'ws',
        type: 'wsMessage',
        detail: payload,
      });
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      TorModule.getTorStatus();
    }, 2000);
    return () => clearInterval(interval);
  }, []);

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

  const onLoadEnd = () => {
    if (window.navigateToPage) {
      injectMessage({
        category: 'system',
        type: 'navigateToPage',
        detail: window.navigateToPage,
      });
      window.navigateToPage = undefined;
    }
  };

  const init = (responseId: string) => {
    const loadCookie = async (key: string) => {
      return await EncryptedStorage.getItem(key).then((value) => {
        if (value) {
          const json = JSON.stringify({ key, value });
          webViewRef.current?.injectJavaScript(
            `(function() {window.NativeRobosats?.loadCookie(${json});})();`,
          );
          return value;
        }
      });
    };

    loadCookie('settings_fontsize_basic');
    loadCookie('settings_language');
    loadCookie('settings_mode');
    loadCookie('settings_light_qr');
    loadCookie('settings_network');
    loadCookie('settings_connection');
    loadCookie('settings_use_proxy').then((useProxy: string | undefined) => {
      SystemModule.useProxy(useProxy ?? 'true');
    });
    loadCookie('settings_stop_notifications').then((stopNotifications: string | undefined) => {
      SystemModule.stopNotifications(stopNotifications ?? 'false');
    });
    loadCookie('garage_slots').then((slots) => {
      NotificationsModule.monitorOrders(slots ?? '{}');
      injectMessageResolve(responseId);
    });
  };

  const onCatch = (dataId: string, event: unknown) => {
    let json = '{}';
    let code = 500;
    if (event.message) {
      const reponse = /Request Response Code \((?<code>\d*)\): (?<json>\{.*\})/.exec(event.message);
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
    if (data.category === 'ws') {
      TorModule.getTorStatus();
      if (data.type === 'open') {
        torClient
          .wsOpen(data.path)
          .then((connection: boolean) => {
            injectMessageResolve(data.id, { connection });
          })
          .catch((e) => onCatch(data.id, e))
          .finally(TorModule.getTorStatus);
      } else if (data.type === 'send') {
        torClient
          .wsSend(data.path, data.message)
          .catch((e) => onCatch(data.id, e))
          .finally(TorModule.getTorStatus);
      } else if (data.type === 'close') {
        torClient
          .wsClose(data.path)
          .then((connection: boolean) => {
            injectMessageResolve(data.id, { connection });
          })
          .finally(TorModule.getTorStatus);
      }
    } else if (data.category === 'http') {
      TorModule.getTorStatus();
      if (data.type === 'get') {
        torClient
          .get(data.baseUrl, data.path, data.headers)
          .then((response: object) => {
            injectMessageResolve(data.id, response);
          })
          .catch((e) => onCatch(data.id, e))
          .finally(TorModule.getTorStatus);
      } else if (data.type === 'post') {
        torClient
          .post(data.baseUrl, data.path, data.body, data.headers)
          .then((response: object) => {
            injectMessageResolve(data.id, response);
          })
          .catch((e) => onCatch(data.id, e))
          .finally(TorModule.getTorStatus);
      } else if (data.type === 'delete') {
        torClient
          .delete(data.baseUrl, data.path, data.headers)
          .then((response: object) => {
            injectMessageResolve(data.id, response);
          })
          .catch((e) => onCatch(data.id, e))
          .finally(TorModule.getTorStatus);
      }
    } else if (data.category === 'system') {
      if (data.type === 'init') {
        init(data.id);
      } else if (data.type === 'copyToClipboardString') {
        Clipboard.setString(data.detail);
      } else if (data.type === 'setCookie') {
        setCookie(data.key, data.detail);
        if (data.key === 'federation') {
          SystemModule.setFederation(data.detail ?? '{}');
        } else if (data.key === 'garage_slots') {
          NotificationsModule.monitorOrders(data.detail ?? '{}');
        } else if (data.key === 'settings_use_proxy') {
          SystemModule.useProxy(data.detail ?? 'true');
        } else if (data.key === 'settings_stop_notifications') {
          SystemModule.stopNotifications(data.detail ?? 'false');
        }
      } else if (data.type === 'deleteCookie') {
        EncryptedStorage.removeItem(data.key);
      }
    } else if (data.category === 'roboidentities') {
      if (data.type === 'roboname') {
        const roboname = await RoboIdentitiesModule.generateRoboname(data.detail);
        injectMessageResolve(data.id, { roboname });
      } else if (data.type === 'robohash') {
        const robohash = await RoboIdentitiesModule.generateRobohash(data.detail);
        injectMessageResolve(data.id, { robohash });
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
    } catch (e) {
      console.log('setCookie', e);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: backgroundColors[colorScheme] }}>
      <WebView
        source={{
          uri,
        }}
        onMessage={onMessage}
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
        onLoadEnd={() => setTimeout(onLoadEnd, 3000)}
      />
    </SafeAreaView>
  );
};

export default App;

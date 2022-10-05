import React, { useEffect, useRef } from 'react';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { SafeAreaView, Text, Platform } from 'react-native';
import { torClient } from './services/Tor';
import Clipboard from '@react-native-clipboard/clipboard';

const App = () => {
  const webViewRef = useRef<WebView>();
  const uri = (Platform.OS === 'android' ? 'file:///android_asset/' : '') + 'Web.bundle/index.html';

  const injectMessageResolve = (id: string, data: object) => {
    const json = JSON.stringify(data);
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

  const onMessage = async (event: WebViewMessageEvent) => {
    const data = JSON.parse(event.nativeEvent.data);
    if (data.category === 'http') {
      sendTorStatus();

      if (data.type === 'get') {
        torClient
          .get(data.path)
          .then((response: object) => {
            injectMessageResolve(data.id, response);
          })
          .finally(sendTorStatus);
      } else if (data.type === 'post') {
        torClient
          .post(data.path, data.body, data.headers)
          .then((response: object) => {
            injectMessageResolve(data.id, response);
          })
          .finally(sendTorStatus);
      } else if (data.type === 'delete') {
        torClient
          .delete(data.path, data.headers)
          .then((response: object) => {
            injectMessageResolve(data.id, response);
          })
          .finally(sendTorStatus);
      } else if (data.type === 'xhr') {
        torClient
          .request(data.path)
          .then((response: object) => {
            injectMessageResolve(data.id, response);
          })
          .finally(sendTorStatus);
      }
    } else if (data.category === 'system') {
      if (data.type === 'copyToClipboardString') {
        Clipboard.setString(data.detail);
      }
    }
  };

  const sendTorStatus = async () => {
    let daemonStatus;
    try {
      daemonStatus = await torClient.daemon.getDaemonStatus();
    } catch {
      daemonStatus = 'ERROR';
    }
    injectMessage({
      category: 'system',
      type: 'tor',
      detail: daemonStatus,
    });
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <WebView
        source={{
          uri,
        }}
        onMessage={onMessage}
        // @ts-expect-error
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
        allowsBackForwardNavigationGestures={false}
        mediaPlaybackRequiresUserAction={false}
        allowsLinkPreview={false}
        renderLoading={() => <Text>Loading RoboSats</Text>}
        onError={(syntheticEvent) => <Text>{syntheticEvent.type}</Text>}
      />
    </SafeAreaView>
  );
};

export default App;

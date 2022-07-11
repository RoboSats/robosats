import React from 'react';
import { WebView, WebViewMessageEvent } from "react-native-webview";
import {SafeAreaView, Text, Platform} from 'react-native';
// import Tor from "react-native-tor";

// Initialize the module
// const tor = Tor();

// const makeTorRequest = async()=>{
//     // Start the daemon and socks proxy (no need for Orbot and yes iOS supported!)
//     await tor.startIfNotStarted();

//     try{
//        // Use built in client to make REST calls to .onion urls routed through the Sock5 proxy !
//        const resp = await tor.get('http://robosats6tkf3eva7x2voqso3a5wcorsnw34jveyxfqi2fu7oyheasid.onion/api/info');
//        return resp
//     } catch(error){
//       // Catch a network or server error like you normally with any other fetch library
//     }
// }

const App = () => {
  // Webview with local html/js in a single location for andrid/iOS
  // https://yelotofu.com/react-native-load-local-static-site-inside-webview-2b93eb1c4225
  const htmlPath = (Platform.OS === 'android' ? 'file:///android_asset/' : '') + 'Web.bundle/index.html';

  const uri = 'https://robosats.onion.moe'
  const onion = 'http://robosats6tkf3eva7x2voqso3a5wcorsnw34jveyxfqi2fu7oyheasid.onion'

  const runFirst = `
      // document.body.style.backgroundColor = 'red';
      // const currentLocation = window.location;
      // setTimeout(function() { window.alert(currentLocation) }, 000);
      // true; // note: this is required, or you'll sometimes get silent failures
    `;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <WebView
        source={{ uri: uri }}
        // source={{ baseUrl: 'file:///android_asset/Web.bundle/' }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        sharedCookiesEnabled={true}
        originWhitelist={['*']} //originWhitelist={[uri,uri2]}
        scalesPageToFit={true}
        startInLoadingState={true}
        mixedContentMode={"always"}
        allowsInlineMediaPlayback={true}
        allowsFullscreenVideo={false}
        setBuiltInZoomControls={false}
        allowingReadAccessToURL={uri}
        allowFileAccess={true}
        allowsBackForwardNavigationGestures={false}
        mediaPlaybackRequiresUserAction={false}
        allowsLinkPreview={false}
        injectedJavaScript={runFirst}
        renderLoading={() => <Text>Loading RoboSats</Text>}
        onError={(syntheticEvent) => <Text>{syntheticEvent}</Text>}
      />
    </SafeAreaView>
  );
};

export default App;

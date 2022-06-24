import React from 'react';
import { WebView, WebViewMessageEvent } from "react-native-webview";
import {SafeAreaView, Text} from 'react-native';
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
  const uri = 'https://unsafe2.robosats.com'
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <WebView
        source={{
          uri: uri,
        }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        sharedCookiesEnabled={true}
        originWhitelist={[uri]}
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
        renderLoading={() => <Text>Loading RoboSats</Text>}
      />
    </SafeAreaView>
  );
};

export default App;

import React from "react";
import type {Node} from 'react';
import { WebView } from 'react-native-webview';
// import Tor from "react-native-tor";
import {
  SafeAreaView,
  Text,
} from 'react-native';

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

const App: () => Node = () => {
  const uri = 'http://unsafe2.robosats.com'
  const local = 'file://android_asset/frontend/index.html'
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <WebView
        source={{
          uri: uri,
        }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        sharedCookiesEnabled={true}
        originWhitelist={["*"]}
        scalesPageToFit={true}
        startInLoadingState={true}
        mixedContentMode={"always"}
        allowsInlineMediaPlayback={true}
        allowsFullscreenVideo={true}
        allowsBackForwardNavigationGestures={true}
        allowsLinkPreview={false}
        renderLoading={() => <Text>Loading RoboSats Webview</Text>}
      />
    </SafeAreaView>
  );
};

export default App;
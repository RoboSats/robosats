import React from 'react';
import type {Node} from 'react';
// import { WebView } from 'react-native-webview';
// import Tor from "react-native-tor";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  useColorScheme,
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
  const isDarkMode = useColorScheme() === 'dark';
  //const info = makeTorRequest()
  return (
    <SafeAreaView>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <Text>This app is running! Next steps: user react-native-webview and react-native-tor to load the webapp.</Text>
        {/* <Text>{info}</Text> */}
        {/* <WebView source={{ uri: 'http://unsafe.robosats.com/' }} /> */}
      </ScrollView>
    </SafeAreaView>
  );
};

export default App;
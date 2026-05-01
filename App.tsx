import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { StackNavigator } from './src/navegacion/StackNavigatior';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  //return (
    /*
    <View style={styles.container}>
      <Text>Open up App.tsx to start working on your app!</Text>
      <StatusBar style="auto" />
    </View>*/
    return <SafeAreaProvider><StackNavigator/></SafeAreaProvider>


}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

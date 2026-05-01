import 'react-native-gesture-handler';
import React from 'react';
// necesito que importes en ves de appNavigator a StackNavigator, ya que el componente se llama StackNavigator y no AppNavigator
// import AppNavigator from './src/navegacion/StackNavigatior';
import { StackNavigator } from './src/navegacion/StackNavigatior';

export default function App() {
  return <StackNavigator />;
}
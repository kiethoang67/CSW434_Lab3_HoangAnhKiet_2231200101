/**
 * App.tsx — Displays only the Compass interface (Screen 1)
 */

import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import CompassScreen from './src/screens/CompassScreen';

const App: React.FC = () => (
  <SafeAreaView style={styles.root}>
    <StatusBar barStyle="dark-content" backgroundColor="#F4F7FC" />
    <CompassScreen />
  </SafeAreaView>
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F4F7FC',
  },
});

export default App;

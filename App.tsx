import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';

import AppNavigator from '@navigation/AppNavigator';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AIServiceProvider } from '@/contexts/AIServiceContext';

const App: React.FC = () => {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AIServiceProvider>
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          </AIServiceProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;

import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';

import AppNavigator from '@navigation/AppNavigator';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AIServiceProvider } from '@/contexts/AIServiceContext';
import { OfflineProvider } from '@/contexts/OfflineContext';
import LiveUpdateService from '@/services/update/LiveUpdateService';
import OfflineBanner from '@/components/OfflineBanner';

const App: React.FC = () => {
  // Initialize live update service on app launch
  useEffect(() => {
    LiveUpdateService.initialize();

    // Cleanup on unmount
    return () => {
      LiveUpdateService.cleanup();
    };
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <OfflineProvider>
          <ThemeProvider>
            <AIServiceProvider>
              <NavigationContainer>
                <OfflineBanner />
                <AppNavigator />
              </NavigationContainer>
            </AIServiceProvider>
          </ThemeProvider>
        </OfflineProvider>
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

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import HomeScreen from '@screens/HomeScreen';
import EditorScreen from '@screens/EditorScreen';
import EnhancedEditorScreen from '@screens/EnhancedEditorScreen';
import SettingsScreen from '@screens/SettingsScreen';
import TerminalScreen from '@screens/TerminalScreen';
import PackageManagerScreen from '@screens/PackageManagerScreen';
import FileManagerScreen from '@screens/FileManagerScreen';
import { useTheme } from '@/contexts/ThemeContext';

export type RootStackParamList = {
  Main: undefined;
  Editor: { snippetId?: string };
  EnhancedEditor: { snippetId?: string };
};

export type MainTabParamList = {
  Home: undefined;
  Editor: undefined;
  Terminal: undefined;
  Packages: undefined;
  Files: undefined;
  Settings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabs: React.FC = () => {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: theme.border,
        },
        headerStyle: {
          backgroundColor: theme.background,
        },
        headerTintColor: theme.text,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color, size }) => <Icon name="home" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Editor"
        component={EnhancedEditorScreen}
        options={{
          title: 'Editör',
          tabBarIcon: ({ color, size }) => <Icon name="code-braces" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Terminal"
        component={TerminalScreen}
        options={{
          title: 'Terminal',
          tabBarIcon: ({ color, size }) => <Icon name="console" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Packages"
        component={PackageManagerScreen}
        options={{
          title: 'Paketler',
          tabBarIcon: ({ color, size }) => <Icon name="package-variant" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Files"
        component={FileManagerScreen}
        options={{
          title: 'Dosyalar',
          tabBarIcon: ({ color, size }) => <Icon name="folder" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Ayarlar',
          tabBarIcon: ({ color, size }) => <Icon name="cog" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator: React.FC = () => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.background,
        },
        headerTintColor: theme.text,
        cardStyle: {
          backgroundColor: theme.background,
        },
      }}
    >
      <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="Editor"
        component={EditorScreen}
        options={{
          title: 'Basit Editör',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="EnhancedEditor"
        component={EnhancedEditorScreen}
        options={{
          title: 'Gelişmiş Editör',
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;

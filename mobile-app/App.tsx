import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import DashboardScreen from './screens/DashboardScreen';
import ScanScreen from './screens/ScanScreen';
import ResultsScreen from './screens/ResultsScreen';
import LearnScreen from './screens/LearnScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function ScanStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Scan" component={ScanScreen} />
      <Stack.Screen name="Results" component={ResultsScreen} />
    </Stack.Navigator>
  );
}

function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="Results" component={ResultsScreen} />
    </Stack.Navigator>
  );
}

const ICON_MAP: Record<string, string> = {
  Dashboard: 'grid-outline',
  Scanner: 'shield-outline',
  Results: 'bar-chart-outline',
  Learn: 'book-outline',
};

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: true,
          headerTitle: route.name === 'Dashboard' ? 'Novapilot' : route.name,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={ICON_MAP[route.name] as any} size={size} color={color} />
          ),
          tabBarActiveTintColor: '#00D1FF',
          tabBarInactiveTintColor: '#666',
          tabBarStyle: { 
            backgroundColor: '#0A0C10', 
            borderTopWidth: 1, 
            borderTopColor: '#1A1D23',
            paddingTop: 5,
          },
          headerStyle: { 
            backgroundColor: '#0A0C10', 
            borderBottomWidth: 1, 
            borderBottomColor: '#1A1D23' 
          },
          headerTitleStyle: { color: '#00D1FF', fontWeight: 'bold' },
          headerShadowVisible: false,
        })}
      >
        <Tab.Screen name="Dashboard" component={DashboardStack} />
        <Tab.Screen name="Scanner"   component={ScanStack} />
        <Tab.Screen name="Results"   component={ResultsScreen} />
        <Tab.Screen name="Learn"     component={LearnScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

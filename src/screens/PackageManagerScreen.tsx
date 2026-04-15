import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTheme } from '@/contexts/ThemeContext';
import { spacing, typography, borderRadius } from '@constants/theme';

interface Package {
  name: string;
  version: string;
  description: string;
  installed: boolean;
  manager: 'npm' | 'pip' | 'gem' | 'composer' | 'gradle';
  downloads?: string;
}

const POPULAR_PACKAGES: Package[] = [
  {
    name: 'react',
    version: '18.2.0',
    description: 'JavaScript library for building user interfaces',
    installed: true,
    manager: 'npm',
    downloads: '25M/week',
  },
  {
    name: 'axios',
    version: '1.6.5',
    description: 'Promise based HTTP client',
    installed: true,
    manager: 'npm',
    downloads: '45M/week',
  },
  {
    name: 'lodash',
    version: '4.17.21',
    description: 'Utility library delivering consistency',
    installed: false,
    manager: 'npm',
    downloads: '38M/week',
  },
  {
    name: 'typescript',
    version: '5.3.3',
    description: 'TypeScript is a superset of JavaScript',
    installed: true,
    manager: 'npm',
    downloads: '32M/week',
  },
  {
    name: 'numpy',
    version: '1.26.0',
    description: 'Fundamental package for scientific computing',
    installed: false,
    manager: 'pip',
    downloads: '12M/month',
  },
  {
    name: 'pandas',
    version: '2.1.0',
    description: 'Data analysis and manipulation tool',
    installed: false,
    manager: 'pip',
    downloads: '10M/month',
  },
  {
    name: 'requests',
    version: '2.31.0',
    description: 'HTTP library for Python',
    installed: false,
    manager: 'pip',
    downloads: '85M/month',
  },
  {
    name: 'django',
    version: '5.0',
    description: 'High-level Python web framework',
    installed: false,
    manager: 'pip',
    downloads: '3M/month',
  },
];

const PackageManagerScreen: React.FC = () => {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [packages, setPackages] = useState<Package[]>(POPULAR_PACKAGES);
  const [selectedManager, setSelectedManager] = useState<Package['manager'] | 'all'>('all');
  const [loading, setLoading] = useState(false);

  const managers: Array<{ id: Package['manager'] | 'all'; name: string; icon: string }> = [
    { id: 'all', name: 'All', icon: 'package-variant' },
    { id: 'npm', name: 'NPM', icon: 'npm' },
    { id: 'pip', name: 'PIP', icon: 'language-python' },
    { id: 'gem', name: 'Gem', icon: 'language-ruby' },
    { id: 'composer', name: 'Composer', icon: 'language-php' },
    { id: 'gradle', name: 'Gradle', icon: 'language-java' },
  ];

  const filteredPackages = packages.filter(pkg => {
    const matchesSearch =
      pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesManager = selectedManager === 'all' || pkg.manager === selectedManager;
    return matchesSearch && matchesManager;
  });

  const handleInstall = (pkg: Package) => {
    Alert.alert(
      'Install Package',
      `Do you want to install ${pkg.name}@${pkg.version}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Install',
          onPress: () => {
            setLoading(true);
            // Simulate installation
            setTimeout(() => {
              setPackages(prev =>
                prev.map(p =>
                  p.name === pkg.name ? { ...p, installed: true } : p
                )
              );
              setLoading(false);
              Alert.alert('Success', `${pkg.name} installed successfully!`);
            }, 1500);
          },
        },
      ]
    );
  };

  const handleUninstall = (pkg: Package) => {
    Alert.alert(
      'Uninstall Package',
      `Do you want to uninstall ${pkg.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Uninstall',
          style: 'destructive',
          onPress: () => {
            setLoading(true);
            setTimeout(() => {
              setPackages(prev =>
                prev.map(p =>
                  p.name === pkg.name ? { ...p, installed: false } : p
                )
              );
              setLoading(false);
              Alert.alert('Success', `${pkg.name} uninstalled successfully!`);
            }, 1000);
          },
        },
      ]
    );
  };

  const getManagerIcon = (manager: Package['manager']) => {
    const managerData = managers.find(m => m.id === manager);
    return managerData?.icon || 'package';
  };

  const renderPackage = ({ item }: { item: Package }) => (
    <View style={[styles.packageCard, { backgroundColor: theme.surface }]}>
      <View style={styles.packageHeader}>
        <Icon name={getManagerIcon(item.manager)} size={24} color={theme.primary} />
        <View style={styles.packageInfo}>
          <Text style={[styles.packageName, { color: theme.text }]}>{item.name}</Text>
          <Text style={[styles.packageVersion, { color: theme.textSecondary }]}>
            v{item.version}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor: item.installed ? theme.error : theme.primary,
            },
          ]}
          onPress={() => (item.installed ? handleUninstall(item) : handleInstall(item))}
          disabled={loading}
        >
          <Icon
            name={item.installed ? 'delete' : 'download'}
            size={18}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>

      <Text style={[styles.packageDescription, { color: theme.textSecondary }]}>
        {item.description}
      </Text>

      <View style={styles.packageFooter}>
        <View style={[styles.badge, { backgroundColor: theme.background }]}>
          <Icon name="download" size={12} color={theme.textSecondary} />
          <Text style={[styles.badgeText, { color: theme.textSecondary }]}>
            {item.downloads}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: theme.background }]}>
          <Text style={[styles.badgeText, { color: theme.textSecondary }]}>
            {item.manager.toUpperCase()}
          </Text>
        </View>
        {item.installed && (
          <View style={[styles.badge, { backgroundColor: theme.success + '20' }]}>
            <Icon name="check-circle" size={12} color={theme.success} />
            <Text style={[styles.badgeText, { color: theme.success }]}>Installed</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Package Manager</Text>
        <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
          Install and manage packages
        </Text>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.surface }]}>
        <Icon name="magnify" size={20} color={theme.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search packages..."
          placeholderTextColor={theme.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close-circle" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Manager Filter */}
      <View style={styles.managerFilter}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={managers}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.managerButton,
                {
                  backgroundColor:
                    selectedManager === item.id ? theme.primary : theme.surface,
                },
              ]}
              onPress={() => setSelectedManager(item.id)}
            >
              <Icon
                name={item.icon}
                size={18}
                color={selectedManager === item.id ? '#FFFFFF' : theme.text}
              />
              <Text
                style={[
                  styles.managerButtonText,
                  {
                    color: selectedManager === item.id ? '#FFFFFF' : theme.text,
                  },
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.managerFilterContent}
        />
      </View>

      {/* Packages List */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      )}

      <FlatList
        data={filteredPackages}
        keyExtractor={item => item.name}
        renderItem={renderPackage}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="package-variant-closed" size={64} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No packages found
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
              Try a different search query
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: spacing.lg,
    borderBottomLeftRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.lg,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.md,
  },
  managerFilter: {
    marginBottom: spacing.md,
  },
  managerFilterContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  managerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  managerButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  listContent: {
    padding: spacing.md,
  },
  packageCard: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  packageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  packageInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  packageName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  packageVersion: {
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  packageDescription: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.sm,
  },
  packageFooter: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.medium,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
});

export default PackageManagerScreen;

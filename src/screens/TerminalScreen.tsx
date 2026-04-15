import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTheme } from '@/contexts/ThemeContext';
import { spacing, typography, borderRadius } from '@constants/theme';

interface TerminalLine {
  id: string;
  type: 'command' | 'output' | 'error' | 'info';
  content: string;
  timestamp: Date;
}

const TerminalScreen: React.FC = () => {
  const { theme } = useTheme();
  const [lines, setLines] = useState<TerminalLine[]>([
    {
      id: '0',
      type: 'info',
      content: 'AI Mobile Code Terminal v0.1.0',
      timestamp: new Date(),
    },
    {
      id: '1',
      type: 'info',
      content: 'Type "help" for available commands',
      timestamp: new Date(),
    },
  ]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  // Auto-scroll to bottom when new lines added
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [lines]);

  const addLine = (type: TerminalLine['type'], content: string) => {
    const newLine: TerminalLine = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
    };
    setLines(prev => [...prev, newLine]);
  };

  const executeCommand = (cmd: string) => {
    const trimmedCmd = cmd.trim();
    if (!trimmedCmd) return;

    // Add command to history
    setCommandHistory(prev => [...prev, trimmedCmd]);
    setHistoryIndex(-1);

    // Display command
    addLine('command', `$ ${trimmedCmd}`);

    // Parse and execute
    const [command, ...args] = trimmedCmd.split(' ');

    switch (command.toLowerCase()) {
      case 'help':
        executeHelp();
        break;

      case 'clear':
        setLines([]);
        break;

      case 'echo':
        addLine('output', args.join(' '));
        break;

      case 'date':
        addLine('output', new Date().toString());
        break;

      case 'pwd':
        addLine('output', '/home/mobile-code-editor');
        break;

      case 'ls':
        executeLS();
        break;

      case 'whoami':
        addLine('output', 'mobile-user');
        break;

      case 'uname':
        addLine('output', `${Platform.OS} ${Platform.Version}`);
        break;

      case 'history':
        executeHistory();
        break;

      case 'npm':
        executeNPM(args);
        break;

      case 'node':
        executeNode(args);
        break;

      case 'python':
        executePython(args);
        break;

      case 'git':
        executeGit(args);
        break;

      default:
        addLine('error', `Command not found: ${command}`);
        addLine('info', 'Type "help" for available commands');
    }

    setCurrentCommand('');
  };

  const executeHelp = () => {
    const helpText = [
      '',
      'Available Commands:',
      '  help      - Show this help message',
      '  clear     - Clear terminal',
      '  echo      - Print text',
      '  date      - Show current date/time',
      '  pwd       - Print working directory',
      '  ls        - List files (simulated)',
      '  whoami    - Show current user',
      '  uname     - Show system info',
      '  history   - Show command history',
      '  npm       - NPM commands (simulated)',
      '  node      - Node.js info',
      '  python    - Python info',
      '  git       - Git commands (simulated)',
      '',
    ];
    helpText.forEach(line => addLine('output', line));
  };

  const executeLS = () => {
    const files = [
      'src/',
      'package.json',
      'README.md',
      'node_modules/',
      'App.tsx',
      '.gitignore',
    ];
    files.forEach(file => addLine('output', file));
  };

  const executeHistory = () => {
    if (commandHistory.length === 0) {
      addLine('info', 'No command history');
      return;
    }
    commandHistory.forEach((cmd, index) => {
      addLine('output', `${index + 1}  ${cmd}`);
    });
  };

  const executeNPM = (args: string[]) => {
    if (args.length === 0) {
      addLine('info', 'npm version 9.8.1');
      return;
    }

    const subcommand = args[0];
    switch (subcommand) {
      case 'version':
      case '-v':
        addLine('output', 'npm: 9.8.1');
        addLine('output', 'node: v18.17.0');
        break;

      case 'list':
      case 'ls':
        addLine('info', 'Installed packages:');
        addLine('output', 'react-native@0.73.4');
        addLine('output', 'typescript@5.3.3');
        addLine('output', 'axios@1.6.5');
        break;

      case 'install':
        if (args.length < 2) {
          addLine('error', 'Missing package name');
        } else {
          addLine('info', `Installing ${args[1]}...`);
          setTimeout(() => {
            addLine('output', `✓ ${args[1]} installed successfully`);
          }, 100);
        }
        break;

      default:
        addLine('error', `Unknown npm command: ${subcommand}`);
    }
  };

  const executeNode = (args: string[]) => {
    if (args.length === 0 || args[0] === '-v' || args[0] === '--version') {
      addLine('output', 'v18.17.0');
    } else {
      addLine('info', 'Node.js REPL not supported in mobile terminal');
    }
  };

  const executePython = (args: string[]) => {
    if (args.length === 0 || args[0] === '--version') {
      addLine('output', 'Python 3.11.0');
    } else {
      addLine('info', 'Python REPL not supported in mobile terminal');
    }
  };

  const executeGit = (args: string[]) => {
    if (args.length === 0) {
      addLine('info', 'git version 2.41.0');
      return;
    }

    const subcommand = args[0];
    switch (subcommand) {
      case 'status':
        addLine('output', 'On branch main');
        addLine('output', 'nothing to commit, working tree clean');
        break;

      case 'log':
        addLine('output', 'commit abc123 (HEAD -> main)');
        addLine('output', 'Author: User <user@example.com>');
        addLine('output', 'Date: ' + new Date().toDateString());
        addLine('output', '    Initial commit');
        break;

      case 'branch':
        addLine('output', '* main');
        break;

      default:
        addLine('info', `Git command simulated: git ${args.join(' ')}`);
    }
  };

  const handleKeyPress = (key: string) => {
    if (key === 'Enter') {
      executeCommand(currentCommand);
    }
  };

  const navigateHistory = (direction: 'up' | 'down') => {
    if (commandHistory.length === 0) return;

    let newIndex = historyIndex;
    if (direction === 'up') {
      newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
    } else {
      newIndex = historyIndex === -1 ? -1 : Math.min(commandHistory.length - 1, historyIndex + 1);
    }

    setHistoryIndex(newIndex);
    if (newIndex >= 0) {
      setCurrentCommand(commandHistory[newIndex]);
    } else {
      setCurrentCommand('');
    }
  };

  const getLineColor = (type: TerminalLine['type']) => {
    switch (type) {
      case 'command':
        return theme.primary;
      case 'error':
        return theme.error;
      case 'info':
        return theme.textSecondary;
      default:
        return theme.text;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#0C0C0C' }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: '#1E1E1E', borderBottomColor: theme.border }]}>
        <Icon name="console" size={20} color={theme.primary} />
        <Text style={[styles.headerTitle, { color: theme.text }]}>Terminal</Text>
        <TouchableOpacity onPress={() => setLines([])}>
          <Icon name="delete-sweep" size={20} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Terminal Output */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.output}
        contentContainerStyle={styles.outputContent}
      >
        {lines.map(line => (
          <Text
            key={line.id}
            style={[
              styles.line,
              { color: getLineColor(line.type) },
              line.type === 'command' && styles.commandLine,
            ]}
          >
            {line.content}
          </Text>
        ))}
      </ScrollView>

      {/* Input Area */}
      <View style={[styles.inputContainer, { backgroundColor: '#1E1E1E', borderTopColor: theme.border }]}>
        <Text style={[styles.prompt, { color: theme.primary }]}>$</Text>
        <TextInput
          ref={inputRef}
          style={[styles.input, { color: theme.text }]}
          value={currentCommand}
          onChangeText={setCurrentCommand}
          onSubmitEditing={() => executeCommand(currentCommand)}
          placeholder="Type a command..."
          placeholderTextColor={theme.textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: theme.primary }]}
          onPress={() => executeCommand(currentCommand)}
        >
          <Icon name="send" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* History Navigation (Hidden buttons for functionality) */}
      <View style={styles.historyButtons}>
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => navigateHistory('up')}
        >
          <Icon name="arrow-up" size={16} color={theme.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => navigateHistory('down')}
        >
          <Icon name="arrow-down" size={16} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  output: {
    flex: 1,
  },
  outputContent: {
    padding: spacing.md,
  },
  line: {
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 4,
  },
  commandLine: {
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderTopWidth: 1,
  },
  prompt: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    padding: 0,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  historyButtons: {
    position: 'absolute',
    right: spacing.md,
    bottom: 80,
    flexDirection: 'column',
    gap: spacing.xs,
  },
  historyButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default TerminalScreen;

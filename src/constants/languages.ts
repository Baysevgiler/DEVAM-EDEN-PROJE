import { ProgrammingLanguage } from '@/types';

export interface LanguageConfig {
  id: ProgrammingLanguage;
  name: string;
  extension: string;
  icon: string;
  color: string;
  prismLanguage: string;
}

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  {
    id: 'javascript',
    name: 'JavaScript',
    extension: '.js',
    icon: 'language-javascript',
    color: '#F7DF1E',
    prismLanguage: 'javascript',
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    extension: '.ts',
    icon: 'language-typescript',
    color: '#3178C6',
    prismLanguage: 'typescript',
  },
  {
    id: 'python',
    name: 'Python',
    extension: '.py',
    icon: 'language-python',
    color: '#3776AB',
    prismLanguage: 'python',
  },
  {
    id: 'java',
    name: 'Java',
    extension: '.java',
    icon: 'language-java',
    color: '#007396',
    prismLanguage: 'java',
  },
  {
    id: 'kotlin',
    name: 'Kotlin',
    extension: '.kt',
    icon: 'language-kotlin',
    color: '#7F52FF',
    prismLanguage: 'kotlin',
  },
  {
    id: 'swift',
    name: 'Swift',
    extension: '.swift',
    icon: 'language-swift',
    color: '#FA7343',
    prismLanguage: 'swift',
  },
  {
    id: 'go',
    name: 'Go',
    extension: '.go',
    icon: 'language-go',
    color: '#00ADD8',
    prismLanguage: 'go',
  },
  {
    id: 'rust',
    name: 'Rust',
    extension: '.rs',
    icon: 'language-rust',
    color: '#CE422B',
    prismLanguage: 'rust',
  },
  {
    id: 'cpp',
    name: 'C++',
    extension: '.cpp',
    icon: 'language-cpp',
    color: '#00599C',
    prismLanguage: 'cpp',
  },
  {
    id: 'csharp',
    name: 'C#',
    extension: '.cs',
    icon: 'language-csharp',
    color: '#239120',
    prismLanguage: 'csharp',
  },
  {
    id: 'php',
    name: 'PHP',
    extension: '.php',
    icon: 'language-php',
    color: '#777BB4',
    prismLanguage: 'php',
  },
  {
    id: 'ruby',
    name: 'Ruby',
    extension: '.rb',
    icon: 'language-ruby',
    color: '#CC342D',
    prismLanguage: 'ruby',
  },
  {
    id: 'html',
    name: 'HTML',
    extension: '.html',
    icon: 'language-html5',
    color: '#E34F26',
    prismLanguage: 'html',
  },
  {
    id: 'css',
    name: 'CSS',
    extension: '.css',
    icon: 'language-css3',
    color: '#1572B6',
    prismLanguage: 'css',
  },
  {
    id: 'sql',
    name: 'SQL',
    extension: '.sql',
    icon: 'database',
    color: '#4479A1',
    prismLanguage: 'sql',
  },
];

export const getLanguageConfig = (language: ProgrammingLanguage): LanguageConfig => {
  const config = SUPPORTED_LANGUAGES.find(lang => lang.id === language);
  if (!config) {
    throw new Error(`Unsupported language: ${language}`);
  }
  return config;
};

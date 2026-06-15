import { useTheme } from './useTheme';

const LIGHT = {
  text: '#231F17',
  grid: '#DED5C3',
  primary: '#2F6F4E',
  accent: '#E0703A',
  success: '#3F8F5B',
  warning: '#C7911F',
  danger: '#D1503C',
  info: '#3E7CA6',
};

const DARK = {
  text: '#F2EEE3',
  grid: '#3C3C34',
  primary: '#6DC49A',
  accent: '#F2935A',
  success: '#6DC49A',
  warning: '#E8C25E',
  danger: '#E68074',
  info: '#7AB2D6',
};

export function useChartColors() {
  const { theme } = useTheme();
  return theme === 'dark' ? DARK : LIGHT;
}

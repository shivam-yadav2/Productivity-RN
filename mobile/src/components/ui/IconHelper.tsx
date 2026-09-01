import React from 'react';
import * as LucideIcons from 'lucide-react-native';

interface IconHelperProps {
  name: string;
  size?: number;
  color?: string;
}

export const IconHelper: React.FC<IconHelperProps> = ({ name, size = 20, color = '#8A8680' }) => {
  const IconComponent = (LucideIcons as any)[name] || LucideIcons.CircleDot;
  return <IconComponent size={size} color={color} />;
};

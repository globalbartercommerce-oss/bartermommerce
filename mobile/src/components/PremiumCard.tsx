import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface PremiumCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'gold' | 'emerald' | 'glass';
}

export const PremiumCard: React.FC<PremiumCardProps> = ({ 
  children, 
  style, 
  variant = 'default' 
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'gold':
        return styles.goldCard;
      case 'emerald':
        return styles.emeraldCard;
      case 'glass':
        return styles.glassCard;
      default:
        return styles.defaultCard;
    }
  };

  return (
    <View style={[styles.card, getVariantStyle(), style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 5,
  },
  defaultCard: {
    backgroundColor: '#15120F',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  goldCard: {
    backgroundColor: '#1E1A14',
    borderWidth: 1,
    borderColor: '#C9A96E',
  },
  emeraldCard: {
    backgroundColor: '#0F1813',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
});

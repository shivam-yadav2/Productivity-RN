import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Crypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';
import { SecurityType } from '../types';
import { settingsRepository } from '../database/repositories/settingsRepo';
import { audioService } from '../services/audioService';

interface SecurityContextType {
  isLocked: boolean;
  securityType: SecurityType;
  hasPin: boolean;
  isBiometricsAvailable: boolean;
  unlockWithPin: (pin: string) => Promise<boolean>;
  unlockWithBiometric: () => Promise<boolean>;
  unlockWithBiometrics: () => Promise<boolean>;
  setPin: (pin: string) => void;
  removePin: () => void;
  setSecurityType: (type: SecurityType) => void;
  lockNow: () => void;
  lockApp: () => void;
}

const SecurityContext = createContext<SecurityContextType | null>(null);

// Simple fast SHA-256 hash for local pin storage
async function hashPin(pin: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    pin + '_salt_ppf_ledger'
  );
}

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [securityType, setSecType] = useState<SecurityType>('NONE');
  const [pinHash, setPinHash] = useState<string | undefined>(undefined);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isBiometricsAvailable, setIsBiometricsAvailable] = useState<boolean>(false);

  useEffect(() => {
    try {
      const settings = settingsRepository.get();
      setSecType(settings.securityType || 'NONE');
      setPinHash(settings.pinHash);
      if (settings.securityType !== 'NONE' && settings.pinHash) {
        setIsLocked(true);
      }
    } catch {
      // default
    }

    (async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        setIsBiometricsAvailable(hasHardware && isEnrolled);
      } catch {
        setIsBiometricsAvailable(false);
      }
    })();
  }, []);

  const unlockWithPin = async (pin: string): Promise<boolean> => {
    if (!pinHash) {
      setIsLocked(false);
      return true;
    }

    const hashed = await hashPin(pin);
    if (hashed === pinHash) {
      setIsLocked(false);
      audioService.playSuccessTone();
      return true;
    }

    audioService.triggerHaptic('medium');
    return false;
  };

  const unlockWithBiometric = async (): Promise<boolean> => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock the app',
        disableDeviceFallback: false,
      });
      if (result.success) {
        setIsLocked(false);
        audioService.playSuccessTone();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const setPin = async (pin: string) => {
    const hashed = await hashPin(pin);
    setPinHash(hashed);
    setSecType('PIN');
    settingsRepository.update({
      pinHash: hashed,
      securityType: 'PIN',
    });
  };

  const removePin = () => {
    setPinHash(undefined);
    setSecType('NONE');
    setIsLocked(false);
    settingsRepository.update({
      pinHash: undefined,
      securityType: 'NONE',
    });
  };

  const setSecurityType = (type: SecurityType) => {
    setSecType(type);
    settingsRepository.update({ securityType: type });
  };

  const lockNow = () => {
    if (securityType !== 'NONE' && pinHash) {
      setIsLocked(true);
    }
  };

  return (
    <SecurityContext.Provider
      value={{
        isLocked,
        securityType,
        hasPin: Boolean(pinHash),
        isBiometricsAvailable,
        unlockWithPin,
        unlockWithBiometric,
        unlockWithBiometrics: unlockWithBiometric,
        setPin,
        removePin,
        setSecurityType,
        lockNow,
        lockApp: lockNow,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
};

export function useSecurity(): SecurityContextType {
  const ctx = useContext(SecurityContext);
  if (!ctx) {
    throw new Error('useSecurity must be used within SecurityProvider');
  }
  return ctx;
}

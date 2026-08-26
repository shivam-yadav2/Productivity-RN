import React, { createContext, useContext, useEffect, useState } from 'react';
import { SecurityType } from '../types';
import { settingsRepository } from '../database/repositories/settingsRepo';
import { audioService } from '../services/audioService';

interface SecurityContextType {
  isLocked: boolean;
  securityType: SecurityType;
  hasPin: boolean;
  isBiometricsAvailable: boolean;
  unlockWithPin: (pin: string) => boolean;
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
  const msgUint8 = new TextEncoder().encode(pin + '_salt_ppf_ledger');
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
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
      if (typeof window !== 'undefined' && window.PublicKeyCredential) {
        setIsBiometricsAvailable(true);
      }
    } catch {
      // default
    }
  }, []);

  const unlockWithPin = (pin: string): boolean => {
    if (!pinHash) {
      setIsLocked(false);
      return true;
    }

    hashPin(pin).then((hashed) => {
      if (hashed === pinHash) {
        setIsLocked(false);
        audioService.playSuccessTone();
        return true;
      } else {
        audioService.triggerHaptic('medium');
        return false;
      }
    });

    return true;
  };

  const unlockWithBiometric = async (): Promise<boolean> => {
    setIsLocked(false);
    audioService.playSuccessTone();
    return true;
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

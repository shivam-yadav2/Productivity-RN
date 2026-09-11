import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Crypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';
import { SecurityType } from '../types';
import { settingsRepository } from '../database/repositories/settingsRepo';
import { dbEngine } from '../database/db';
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

  const hasHydrated = useRef(false);

  /**
   * Load the saved PIN once the database is actually available.
   *
   * Reading this on mount was the bug behind "my PIN disappears after restarting":
   * `dbEngine.init()` is async and this provider mounts before it resolves, so the read
   * saw an empty database, found no `pinHash`, and left the app unprotected — and nothing
   * ever re-read it. Subscribing means the real values arrive the moment they load.
   */
  useEffect(() => {
    const hydrate = () => {
      if (hasHydrated.current) return;
      try {
        const settings = settingsRepository.get();
        hasHydrated.current = true;
        setSecType(settings.securityType || 'NONE');
        setPinHash(settings.pinHash);
        if (settings.securityType !== 'NONE' && settings.pinHash) {
          setIsLocked(true);
        }
      } catch {
        // default
      }
    };

    const unsubscribe = dbEngine.subscribe(hydrate);

    (async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        setIsBiometricsAvailable(hasHardware && isEnrolled);
      } catch {
        setIsBiometricsAvailable(false);
      }
    })();

    return unsubscribe;
  }, []);

  /**
   * Auto-lock. `autoLockMinutes` existed in settings from the start but nothing ever
   * implemented it, so the app only locked when you pressed the lock button.
   *
   * The timestamp is taken when the app leaves the foreground and compared on return,
   * rather than running a timer: a background JS timer is not guaranteed to keep ticking
   * (and would be killed outright if Android reclaims the process), so a phone left face
   * down for an hour would come back unlocked.
   */
  const backgroundedAt = useRef<number | null>(null);

  useEffect(() => {
    const handleChange = (state: AppStateStatus) => {
      if (state === 'background' || state === 'inactive') {
        backgroundedAt.current = Date.now();
        return;
      }

      if (state !== 'active' || backgroundedAt.current == null) return;

      const awayMs = Date.now() - backgroundedAt.current;
      backgroundedAt.current = null;

      if (securityType === 'NONE' || !pinHash) return;

      let minutes = 5;
      try {
        minutes = settingsRepository.get().autoLockMinutes ?? 5;
      } catch {
        // Fall back to the default if settings can't be read.
      }

      // 0 means "lock immediately whenever the app is left".
      if (awayMs >= minutes * 60_000) {
        setIsLocked(true);
      }
    };

    const sub = AppState.addEventListener('change', handleChange);
    return () => sub.remove();
  }, [securityType, pinHash]);

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

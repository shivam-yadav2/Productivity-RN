import React, { useState } from 'react';
import { useSecurity } from '../../context/SecurityContext';
import { Shield, Delete, Fingerprint, Lock } from 'lucide-react';
import { audioService } from '../../services/audioService';

export const PinLockScreen: React.FC = () => {
  const { unlockWithPin, unlockWithBiometrics, isBiometricsAvailable } = useSecurity();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      audioService.playSoftClick();
      audioService.triggerHaptic('light');

      if (nextPin.length === 4) {
        setTimeout(() => {
          const success = unlockWithPin(nextPin);
          if (success) {
            audioService.playSuccessTone();
            audioService.triggerHaptic('success');
          } else {
            setError(true);
            audioService.triggerHaptic('medium');
            setTimeout(() => {
              setPin('');
              setError(false);
            }, 500);
          }
        }, 100);
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
    setError(false);
    audioService.playSoftClick();
  };

  const handleBiometricClick = async () => {
    await unlockWithBiometrics();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 bg-zinc-900 text-zinc-100 select-none">
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 shadow-lg">
          <Lock className="w-8 h-8" />
        </div>

        <div className="text-center">
          <h2 className="text-lg font-bold text-zinc-100">Private & Secured</h2>
          <p className="text-xs text-zinc-400 mt-1">Enter your 4-digit PIN to access your data</p>
        </div>

        {/* PIN Dots */}
        <div className="flex items-center gap-4 my-4">
          {[0, 1, 2, 3].map((i) => {
            const filled = pin.length > i;
            return (
              <div
                key={i}
                className={`w-4 h-4 rounded-full border transition-all duration-200 ${
                  error
                    ? 'bg-rose-500 border-rose-500 animate-shake'
                    : filled
                    ? 'bg-white border-white scale-110'
                    : 'border-zinc-600 bg-zinc-800'
                }`}
              />
            );
          })}
        </div>

        {error && <span className="text-xs text-rose-400 font-semibold">Incorrect PIN</span>}
      </div>

      {/* Number Keypad */}
      <div className="w-full max-w-xs flex flex-col gap-3 pb-8">
        <div className="grid grid-cols-3 gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button
              key={d}
              onClick={() => handleDigit(d)}
              className="h-16 rounded-2xl bg-zinc-800/80 hover:bg-zinc-700 active:bg-zinc-600 text-2xl font-bold font-mono text-zinc-100 flex items-center justify-center transition-all cursor-pointer"
            >
              {d}
            </button>
          ))}

          {/* Biometric trigger */}
          <button
            onClick={handleBiometricClick}
            className="h-16 rounded-2xl bg-zinc-800/40 hover:bg-zinc-800 text-zinc-400 flex items-center justify-center transition-all cursor-pointer"
            title="Unlock with Biometrics"
          >
            <Fingerprint className="w-6 h-6" />
          </button>

          <button
            onClick={() => handleDigit('0')}
            className="h-16 rounded-2xl bg-zinc-800/80 hover:bg-zinc-700 active:bg-zinc-600 text-2xl font-bold font-mono text-zinc-100 flex items-center justify-center transition-all cursor-pointer"
          >
            0
          </button>

          <button
            onClick={handleDelete}
            className="h-16 rounded-2xl bg-zinc-800/40 hover:bg-zinc-800 text-zinc-400 flex items-center justify-center transition-all cursor-pointer"
            title="Delete digit"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

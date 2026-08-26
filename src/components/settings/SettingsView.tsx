import React, { useState, useRef } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { useTheme } from '../../context/ThemeContext';
import { useSecurity } from '../../context/SecurityContext';
import { settingsRepository } from '../../database/repositories/settingsRepo';
import { backupService } from '../../services/backupService';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import {
  Moon,
  Sun,
  Shield,
  Lock,
  Download,
  Upload,
  FileSpreadsheet,
  Trash2,
  Volume2,
  Vibrate,
  DollarSign,
  Calendar,
  Check,
  AlertTriangle,
  Fingerprint,
} from 'lucide-react';
import { audioService } from '../../services/audioService';

interface SettingsViewProps {
  onOpenAccountsManager: () => void;
  onOpenCategoriesManager: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onOpenAccountsManager,
  onOpenCategoriesManager,
}) => {
  const { db } = useDatabase();
  const { theme, toggleTheme } = useTheme();
  const { isLocked, hasPin, setPin, removePin, isBiometricsAvailable } = useSecurity();

  const [newPinInput, setNewPinInput] = useState('');
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pinError, setPinError] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleUpdateSetting = (key: any, value: any) => {
    settingsRepository.update({ [key]: value });
    audioService.triggerHaptic('light');
  };

  const handleSetPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPinInput.length !== 4 || !/^\d{4}$/.test(newPinInput)) {
      setPinError('PIN must be exactly 4 digits');
      return;
    }
    setPin(newPinInput);
    setShowPinSetup(false);
    setNewPinInput('');
    setPinError('');
    audioService.playSuccessTone();
  };

  const handleRemovePin = () => {
    removePin();
    audioService.triggerHaptic('medium');
  };

  const handleExportJSON = () => {
    backupService.exportJSON();
    audioService.triggerHaptic('medium');
  };

  const handleExportCSV = () => {
    backupService.exportTransactionsCSV();
    audioService.triggerHaptic('medium');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        backupService.importJSON(text);
        audioService.playSuccessTone();
        alert('Database restored successfully.');
      } catch (err: any) {
        alert(err?.message || 'Invalid backup file format');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleFactoryReset = () => {
    backupService.resetDatabase();
    setShowResetConfirm(false);
    audioService.triggerHaptic('medium');
  };

  return (
    <div className="flex flex-col gap-5 pb-8">
      {/* Visual & Audio Preferences */}
      <Card className="p-4 flex flex-col gap-3">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
          Appearance & Feedback
        </span>

        <div className="flex items-center justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            {theme === 'dark' ? (
              <Moon className="w-4 h-4 text-indigo-400" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500" />
            )}
            <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Theme</span>
          </div>
          <button
            onClick={toggleTheme}
            className="px-3 py-1 text-xs font-semibold rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700"
          >
            {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
          </button>
        </div>

        <div className="flex items-center justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-zinc-500" />
            <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Sound Effects</span>
          </div>
          <input
            type="checkbox"
            checked={db.settings.soundEnabled}
            onChange={(e) => handleUpdateSetting('soundEnabled', e.target.checked)}
            className="w-4 h-4 rounded text-zinc-900 accent-zinc-900 cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between py-1.5">
          <div className="flex items-center gap-2">
            <Vibrate className="w-4 h-4 text-zinc-500" />
            <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Haptic Feedback</span>
          </div>
          <input
            type="checkbox"
            checked={db.settings.hapticEnabled ?? db.settings.hapticsEnabled ?? true}
            onChange={(e) => {
              handleUpdateSetting('hapticEnabled', e.target.checked);
              handleUpdateSetting('hapticsEnabled', e.target.checked);
            }}
            className="w-4 h-4 rounded text-zinc-900 accent-zinc-900 cursor-pointer"
          />
        </div>
      </Card>

      {/* Currency & Financial Configuration */}
      <Card className="p-4 flex flex-col gap-3">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
          Finance Configuration
        </span>

        <div className="flex items-center justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800">
          <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            Primary Currency
          </span>
          <select
            value={db.settings.currency || 'INR'}
            onChange={(e) => handleUpdateSetting('currency', e.target.value)}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200"
          >
            <option value="INR">INR (₹ Indian Rupee)</option>
            <option value="USD">USD ($ US Dollar)</option>
            <option value="EUR">EUR (€ Euro)</option>
            <option value="GBP">GBP (£ British Pound)</option>
            <option value="AED">AED (د.إ UAE Dirham)</option>
            <option value="CAD">CAD ($ Canadian Dollar)</option>
            <option value="AUD">AUD ($ Australian Dollar)</option>
            <option value="JPY">JPY (¥ Japanese Yen)</option>
          </select>
        </div>

        <div className="flex items-center justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800">
          <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            Default Account
          </span>
          <select
            value={db.settings.defaultAccountId || ''}
            onChange={(e) => handleUpdateSetting('defaultAccountId', e.target.value)}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200"
          >
            {Object.values(db.accounts).map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={onOpenAccountsManager}>
            Manage Accounts
          </Button>
          <Button variant="outline" size="sm" onClick={onOpenCategoriesManager}>
            Manage Categories
          </Button>
        </div>
      </Card>

      {/* Security & App Lock */}
      <Card className="p-4 flex flex-col gap-3">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
          Security & Privacy
        </span>

        <div className="flex items-center justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-zinc-500" />
            <div>
              <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                App PIN Lock
              </div>
              <div className="text-[10px] text-zinc-400">
                {hasPin ? 'PIN protection active' : 'No PIN configured'}
              </div>
            </div>
          </div>

          {hasPin ? (
            <button
              onClick={handleRemovePin}
              className="text-xs text-rose-600 font-semibold hover:underline"
            >
              Remove PIN
            </button>
          ) : (
            <button
              onClick={() => setShowPinSetup(!showPinSetup)}
              className="px-3 py-1 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold"
            >
              Set PIN
            </button>
          )}
        </div>

        {showPinSetup && (
          <form
            onSubmit={handleSetPinSubmit}
            className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700 flex flex-col gap-2"
          >
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Enter a 4-digit PIN:
            </span>
            <div className="flex items-center gap-2">
              <input
                type="password"
                maxLength={4}
                value={newPinInput}
                onChange={(e) => {
                  setNewPinInput(e.target.value);
                  setPinError('');
                }}
                placeholder="••••"
                className="w-24 px-3 py-1.5 text-center text-base tracking-widest font-mono rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 focus:outline-none"
                autoFocus
              />
              <Button type="submit" size="sm">
                Save
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPinSetup(false)}
              >
                Cancel
              </Button>
            </div>
            {pinError && <span className="text-xs text-rose-500 font-medium">{pinError}</span>}
          </form>
        )}

        <div className="flex items-center justify-between py-1.5">
          <div className="flex items-center gap-2">
            <Fingerprint className="w-4 h-4 text-zinc-500" />
            <div>
              <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Biometric Unlock
              </div>
              <div className="text-[10px] text-zinc-400">
                {isBiometricsAvailable ? 'Fingerprint / Face ID available' : 'Client biometric simulation active'}
              </div>
            </div>
          </div>
          <input
            type="checkbox"
            checked={db.settings.biometricsEnabled}
            onChange={(e) => handleUpdateSetting('biometricsEnabled', e.target.checked)}
            className="w-4 h-4 rounded text-zinc-900 accent-zinc-900 cursor-pointer"
          />
        </div>
      </Card>

      {/* Backup, Export & Restore */}
      <Card className="p-4 flex flex-col gap-3">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
          Data Ownership & Backup
        </span>

        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          Your data never leaves your device. Export regular backups to retain full offline ownership.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={handleExportJSON} className="justify-start">
            <Download className="w-4 h-4 mr-2 text-blue-600" />
            Export JSON Backup
          </Button>

          <Button variant="outline" size="sm" onClick={handleExportCSV} className="justify-start">
            <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-600" />
            Export Transactions CSV
          </Button>
        </div>

        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              Restore Database
            </span>
            <span className="text-[10px] text-zinc-400">Import a previously exported JSON backup</span>
          </div>

          <div>
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-3.5 h-3.5 mr-1.5" /> Select File
            </Button>
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="p-4 flex flex-col gap-3 border-rose-200 dark:border-rose-950 bg-rose-50/30 dark:bg-rose-950/10">
        <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
          Danger Zone
        </span>

        {showResetConfirm ? (
          <div className="flex flex-col gap-2 p-3 bg-white dark:bg-zinc-900 rounded-xl border border-rose-300 dark:border-rose-800">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 text-xs font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>Are you sure you want to reset all data?</span>
            </div>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
              This will erase all accounts, transactions, tasks, and habits, and reload fresh initial data.
            </p>
            <div className="flex items-center gap-2 justify-end mt-1">
              <Button size="sm" variant="ghost" onClick={() => setShowResetConfirm(false)}>
                Cancel
              </Button>
              <Button size="sm" variant="danger" onClick={handleFactoryReset}>
                Confirm Reset
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Factory Reset Database
              </span>
              <span className="text-[10px] text-zinc-500">Restore factory defaults and clean state</span>
            </div>
            <Button size="sm" variant="danger" onClick={() => setShowResetConfirm(true)}>
              <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Reset Data
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

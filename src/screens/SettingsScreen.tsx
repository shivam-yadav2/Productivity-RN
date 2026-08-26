import React from 'react';
import { SettingsView } from '../components/settings/SettingsView';

interface SettingsScreenProps {
  onOpenAccountsManager: () => void;
  onOpenCategoriesManager: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onOpenAccountsManager,
  onOpenCategoriesManager,
}) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col pt-1">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Settings & Privacy
        </h1>
        <span className="text-xs text-zinc-500">Local preferences, security, and full offline backups</span>
      </div>

      <SettingsView
        onOpenAccountsManager={onOpenAccountsManager}
        onOpenCategoriesManager={onOpenCategoriesManager}
      />
    </div>
  );
};

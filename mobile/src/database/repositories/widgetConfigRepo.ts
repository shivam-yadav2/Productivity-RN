import { dbEngine } from '../db';
import { WidgetConfig, WidgetName, DEFAULT_WIDGET_CONFIG } from '../../types';

/** Android widget ids are numeric; the table is keyed by their string form. */
function keyFor(widgetId: number): string {
  return `w_${widgetId}`;
}

export const widgetConfigRepository = {
  /** Always returns a usable config — falls back to defaults for a widget that was
   *  pinned before configuration existed, or added without opening the config screen. */
  get(widgetId: number, widgetName: WidgetName): WidgetConfig {
    const existing = dbEngine.getTables().widgetConfigs[keyFor(widgetId)];
    if (existing) return existing;
    return {
      id: keyFor(widgetId),
      widgetName,
      ...DEFAULT_WIDGET_CONFIG,
      updatedAt: new Date().toISOString(),
    };
  },

  save(widgetId: number, widgetName: WidgetName, params: Partial<WidgetConfig>): WidgetConfig {
    const id = keyFor(widgetId);
    const existing = dbEngine.getTables().widgetConfigs[id];

    const updated: WidgetConfig = {
      ...DEFAULT_WIDGET_CONFIG,
      ...(existing || {}),
      ...params,
      id,
      widgetName,
      updatedAt: new Date().toISOString(),
    };

    dbEngine.runTransaction((db) => {
      db.widgetConfigs[id] = updated;
    });

    return updated;
  },

  delete(widgetId: number): void {
    dbEngine.runTransaction((db) => {
      delete db.widgetConfigs[keyFor(widgetId)];
    });
  },
};

import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, useColorScheme } from 'react-native';
import type { WidgetConfigurationScreenProps } from 'react-native-android-widget';
import { WidgetPreview } from 'react-native-android-widget';
import { dbEngine } from '../database/db';
import { widgetConfigRepository } from '../database/repositories/widgetConfigRepo';
import { WidgetConfig, WidgetName, WidgetAccent, WidgetThemeMode, DEFAULT_WIDGET_CONFIG } from '../types';
import { ink, surface, accent } from '../utils/theme';
import { renderConfiguredWidget } from './widgetTaskHandler';

const THEME_OPTIONS: { value: WidgetThemeMode; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const ACCENT_OPTIONS: { value: WidgetAccent; label: string; swatch: string }[] = [
  { value: 'neutral', label: 'Neutral', swatch: ink[900] },
  { value: 'purple', label: 'Purple', swatch: accent.purple.base },
  { value: 'orange', label: 'Orange', swatch: accent.orange.base },
  { value: 'blue', label: 'Blue', swatch: accent.blue.base },
  { value: 'pink', label: 'Pink', swatch: accent.pink.base },
];

const STREAK_DAY_OPTIONS = [7, 10, 14];

/**
 * Opened by the launcher when a widget is added (and again via long-press → Configure).
 * This runs as its own React root in a separate Activity — no DatabaseProvider, no
 * ThemeProvider, no NativeWind context above it — so it reads the db directly and uses
 * plain inline styles rather than the app's usual `className` conventions.
 */
export function WidgetConfigurationScreen({
  widgetInfo,
  renderWidget,
  setResult,
}: WidgetConfigurationScreenProps) {
  const isDark = useColorScheme() === 'dark';
  const widgetName = widgetInfo.widgetName as WidgetName;

  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [previewEl, setPreviewEl] = useState<React.JSX.Element | null>(null);

  const c = {
    bg: isDark ? ink[950] : ink[50],
    card: isDark ? surface.dark : surface.light,
    text: isDark ? ink[100] : ink[900],
    muted: isDark ? '#8E8B96' : ink[500],
    border: isDark ? '#2A2830' : ink[200],
    selectedBg: isDark ? ink[100] : ink[900],
    selectedText: isDark ? ink[900] : '#FFFFFF',
  };

  useEffect(() => {
    dbEngine.init().then(() => {
      setConfig(widgetConfigRepository.get(widgetInfo.widgetId, widgetName));
    });
  }, [widgetInfo.widgetId, widgetName]);

  // Preview renders through the same code path the real widget uses, so what's shown here
  // is the actual widget output rather than a hand-made approximation of it.
  const rebuildPreview = useCallback(
    async (next: WidgetConfig) => {
      const representation = await renderConfiguredWidget(widgetInfo, next);
      if (!representation) return;
      const el =
        'light' in representation
          ? isDark
            ? representation.dark
            : representation.light
          : representation;
      setPreviewEl(el as React.JSX.Element);
    },
    [widgetInfo, isDark]
  );

  useEffect(() => {
    if (config) rebuildPreview(config);
  }, [config, rebuildPreview]);

  const update = (patch: Partial<WidgetConfig>) => {
    setConfig((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const handleSave = async () => {
    if (!config) return;
    widgetConfigRepository.save(widgetInfo.widgetId, widgetName, config);
    const representation = await renderConfiguredWidget(widgetInfo, config);
    if (representation) renderWidget(representation);
    setResult('ok');
  };

  if (!config) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={c.muted} />
      </View>
    );
  }

  const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <View style={{ marginBottom: 22 }}>
      <Text
        style={{
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 1,
          color: c.muted,
          marginBottom: 10,
        }}
      >
        {title.toUpperCase()}
      </Text>
      {children}
    </View>
  );

  const Chip: React.FC<{ label: string; selected: boolean; onPress: () => void; swatch?: string }> = ({
    label,
    selected,
    onPress,
    swatch,
  }) => (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 999,
        marginRight: 8,
        marginBottom: 8,
        backgroundColor: selected ? c.selectedBg : c.card,
        borderWidth: 1,
        borderColor: selected ? c.selectedBg : c.border,
      }}
    >
      {swatch && (
        <View style={{ width: 13, height: 13, borderRadius: 7, backgroundColor: swatch }} />
      )}
      <Text style={{ fontSize: 13, fontWeight: '600', color: selected ? c.selectedText : c.text }}>
        {label}
      </Text>
    </Pressable>
  );

  const Toggle: React.FC<{ label: string; hint?: string; value: boolean; onToggle: () => void }> = ({
    label,
    hint,
    value,
    onToggle,
  }) => (
    <Pressable
      onPress={onToggle}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: c.card,
        borderWidth: 1,
        borderColor: c.border,
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 12,
      }}
    >
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: c.text }}>{label}</Text>
        {hint && <Text style={{ fontSize: 11, color: c.muted, marginTop: 2 }}>{hint}</Text>}
      </View>
      <View
        style={{
          width: 46,
          height: 27,
          borderRadius: 999,
          padding: 3,
          backgroundColor: value ? c.selectedBg : c.border,
          alignItems: value ? 'flex-end' : 'flex-start',
        }}
      >
        <View style={{ width: 21, height: 21, borderRadius: 999, backgroundColor: value ? c.selectedText : c.card }} />
      </View>
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 12 }}>
        <Text style={{ fontSize: 22, fontWeight: '800', color: c.text, marginBottom: 3 }}>
          Customize widget
        </Text>
        <Text style={{ fontSize: 13, color: c.muted, marginBottom: 20 }}>
          Changes preview live below.
        </Text>

        <View
          style={{
            alignItems: 'center',
            paddingVertical: 18,
            marginBottom: 24,
            borderRadius: 22,
            backgroundColor: isDark ? '#000000' : ink[200],
          }}
        >
          {previewEl && (
            <WidgetPreview
              renderWidget={() => previewEl}
              width={Math.min(widgetInfo.width || 250, 300)}
              height={Math.min(widgetInfo.height || 120, 200)}
            />
          )}
        </View>

        <Section title="Theme">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {THEME_OPTIONS.map((o) => (
              <Chip
                key={o.value}
                label={o.label}
                selected={config.theme === o.value}
                onPress={() => update({ theme: o.value })}
              />
            ))}
          </View>
          <Text style={{ fontSize: 11, color: c.muted, marginTop: 2 }}>
            Auto follows your phone's light/dark setting.
          </Text>
        </Section>

        <Section title="Accent">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {ACCENT_OPTIONS.map((o) => (
              <Chip
                key={o.value}
                label={o.label}
                swatch={o.swatch}
                selected={config.accent === o.value}
                onPress={() => update({ accent: o.value })}
              />
            ))}
          </View>
        </Section>

        {widgetName === 'Balance' && (
          <Section title="Privacy">
            <Toggle
              label="Hide amounts"
              hint="Shows dots instead of your balance."
              value={Boolean(config.hideAmount)}
              onToggle={() => update({ hideAmount: !config.hideAmount })}
            />
          </Section>
        )}

        {widgetName === 'HabitStreak' && (
          <Section title="History">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {STREAK_DAY_OPTIONS.map((d) => (
                <Chip
                  key={d}
                  label={`${d} days`}
                  selected={(config.streakDays || 7) === d}
                  onPress={() => update({ streakDays: d })}
                />
              ))}
            </View>
          </Section>
        )}

        {widgetName === 'Today' && (
          <Section title="Content">
            <Toggle
              label="Show next task"
              hint="Displays the next task's title under the count."
              value={config.showNextTask !== false}
              onToggle={() => update({ showNextTask: config.showNextTask === false })}
            />
          </Section>
        )}

        <Pressable
          onPress={() => update({ ...DEFAULT_WIDGET_CONFIG })}
          style={{ paddingVertical: 10, alignSelf: 'flex-start' }}
        >
          <Text style={{ fontSize: 13, fontWeight: '600', color: c.muted }}>Reset to defaults</Text>
        </Pressable>
      </ScrollView>

      <View
        style={{
          flexDirection: 'row',
          gap: 10,
          padding: 16,
          borderTopWidth: 1,
          borderTopColor: c.border,
          backgroundColor: c.bg,
        }}
      >
        <Pressable
          onPress={() => setResult('cancel')}
          style={{
            flex: 1,
            paddingVertical: 14,
            borderRadius: 16,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: c.border,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: '600', color: c.text }}>Cancel</Text>
        </Pressable>
        <Pressable
          onPress={handleSave}
          style={{
            flex: 2,
            paddingVertical: 14,
            borderRadius: 16,
            alignItems: 'center',
            backgroundColor: c.selectedBg,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: '700', color: c.selectedText }}>Add widget</Text>
        </Pressable>
      </View>
    </View>
  );
}

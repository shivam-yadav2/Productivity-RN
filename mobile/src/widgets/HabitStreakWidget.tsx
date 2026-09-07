import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { WidgetPalette } from './widgetTheme';

export interface HabitStreakRow {
  name: string;
  color: string;
  /** true/false per day, oldest first, ending today. */
  days: boolean[];
}

interface HabitStreakWidgetProps {
  doneToday: number;
  totalHabits: number;
  rows: HabitStreakRow[];
  palette: WidgetPalette;
  width: number;
  height: number;
  /** When false, every row uses the widget's accent instead of each habit's own colour. */
  useHabitColors: boolean;
}

function Dot({ filled, color, track, size }: { filled: boolean; color: string; track: string; size: number }) {
  return (
    <FlexWidget
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: (filled ? color : track) as any,
        marginRight: 4,
      }}
    />
  );
}

/** Home-screen widget: a dot row per habit over the last N days. Tapping opens Habits. */
export function HabitStreakWidget({
  doneToday,
  totalHabits,
  rows,
  palette,
  width,
  height,
  useHabitColors,
}: HabitStreakWidgetProps) {
  const compact = height < 110;
  const dotSize = width < 220 ? 9 : width < 300 ? 11 : 13;
  const labelWidth = width < 220 ? 52 : 72;

  // Only as many rows as actually fit — an overflowing FlexWidget silently clips, which
  // reads as a broken widget rather than a full one.
  const rowHeight = dotSize + 10;
  const maxRows = Math.max(1, Math.floor((height - (compact ? 40 : 52)) / rowHeight));
  const visibleRows = rows.slice(0, maxRows);

  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: 'personalapp://habits' }}
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: palette.bg as any,
        borderRadius: 24,
        padding: compact ? 11 : 14,
        flexDirection: 'column',
      }}
    >
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          width: 'match_parent',
          marginBottom: compact ? 6 : 10,
        }}
      >
        <TextWidget text="Habits" style={{ fontSize: compact ? 12 : 14, fontWeight: '800', color: palette.text as any }} />
        <TextWidget
          text={`${doneToday}/${totalHabits}`}
          style={{ fontSize: compact ? 11 : 13, fontWeight: '700', color: palette.faint as any }}
        />
      </FlexWidget>

      {visibleRows.length === 0 ? (
        <TextWidget text="No habits yet" style={{ fontSize: 12, color: palette.faint as any }} />
      ) : (
        <FlexWidget style={{ flexDirection: 'column', width: 'match_parent' }}>
          {visibleRows.map((row, i) => (
            <FlexWidget
              key={row.name}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                width: 'match_parent',
                marginTop: i === 0 ? 0 : 8,
              }}
            >
              <TextWidget
                text={row.name}
                maxLines={1}
                truncate="END"
                style={{ fontSize: 11, fontWeight: '600', color: palette.muted as any, width: labelWidth }}
              />
              <FlexWidget style={{ flexDirection: 'row' }}>
                {row.days.map((filled, di) => (
                  <Dot
                    key={di}
                    filled={filled}
                    color={useHabitColors ? row.color : palette.accentFill}
                    track={palette.track}
                    size={dotSize}
                  />
                ))}
              </FlexWidget>
            </FlexWidget>
          ))}
        </FlexWidget>
      )}
    </FlexWidget>
  );
}

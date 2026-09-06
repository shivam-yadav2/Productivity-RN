import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { ink, surface } from '../utils/theme';

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
}

const DOT_SIZE = 12;

function Dot({ filled, color }: { filled: boolean; color: string }) {
  return (
    <FlexWidget
      style={{
        width: DOT_SIZE,
        height: DOT_SIZE,
        borderRadius: DOT_SIZE / 2,
        backgroundColor: filled ? (color as any) : ink[100],
        marginRight: 4,
      }}
    />
  );
}

/** Home-screen widget: a row of dots per habit for the last 7 days. Tapping opens Habits. */
export function HabitStreakWidget({ doneToday, totalHabits, rows }: HabitStreakWidgetProps) {
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: 'personalapp://habits' }}
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: surface.light,
        borderRadius: 24,
        padding: 14,
        flexDirection: 'column',
      }}
    >
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          width: 'match_parent',
          marginBottom: 10,
        }}
      >
        <TextWidget text="Habits" style={{ fontSize: 14, fontWeight: '800', color: ink[900] }} />
        <TextWidget
          text={`${doneToday}/${totalHabits}`}
          style={{ fontSize: 13, fontWeight: '700', color: ink[400] }}
        />
      </FlexWidget>

      {rows.length === 0 ? (
        <TextWidget text="No habits yet" style={{ fontSize: 12, color: ink[400] }} />
      ) : (
        <FlexWidget style={{ flexDirection: 'column', width: 'match_parent' }}>
          {rows.map((row, i) => (
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
                style={{ fontSize: 11, fontWeight: '600', color: ink[700], width: 70 }}
              />
              <FlexWidget style={{ flexDirection: 'row' }}>
                {row.days.map((filled, di) => (
                  <Dot key={di} filled={filled} color={row.color} />
                ))}
              </FlexWidget>
            </FlexWidget>
          ))}
        </FlexWidget>
      )}
    </FlexWidget>
  );
}

import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { ink, surface } from '../utils/theme';

interface TodayWidgetProps {
  dayName: string;
  dayNumber: string;
  monthName: string;
  taskCount: number;
  nextTaskTitle: string | null;
}

/** Home-screen widget: today's date + task count / next task. Tapping opens Tasks. */
export function TodayWidget({ dayName, dayNumber, monthName, taskCount, nextTaskTitle }: TodayWidgetProps) {
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: 'personalapp://tasks' }}
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: surface.light,
        borderRadius: 24,
        padding: 16,
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <FlexWidget style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
        <TextWidget
          text={dayName}
          style={{ fontSize: 15, fontWeight: '700', color: ink[400], marginRight: 6 }}
        />
        <TextWidget text={monthName} style={{ fontSize: 15, fontWeight: '700', color: ink[400] }} />
      </FlexWidget>

      <TextWidget text={dayNumber} style={{ fontSize: 36, fontWeight: '800', color: ink[900] }} />

      <FlexWidget style={{ flexDirection: 'column' }}>
        <TextWidget
          text={taskCount === 0 ? 'All caught up' : `${taskCount} task${taskCount === 1 ? '' : 's'} due today`}
          style={{ fontSize: 12, fontWeight: '600', color: ink[700] }}
        />
        {nextTaskTitle && (
          <TextWidget
            text={nextTaskTitle}
            maxLines={1}
            truncate="END"
            style={{ fontSize: 11, fontWeight: '500', color: ink[400], marginTop: 2 }}
          />
        )}
      </FlexWidget>
    </FlexWidget>
  );
}

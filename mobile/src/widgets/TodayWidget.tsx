import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { WidgetPalette } from './widgetTheme';

interface TodayWidgetProps {
  dayName: string;
  dayNumber: string;
  monthName: string;
  taskCount: number;
  nextTaskTitle: string | null;
  palette: WidgetPalette;
  width: number;
  height: number;
  showNextTask: boolean;
}

/** Home-screen widget: today's date + task count / next task. Tapping opens Tasks. */
export function TodayWidget({
  dayName,
  dayNumber,
  monthName,
  taskCount,
  nextTaskTitle,
  palette,
  width,
  height,
  showNextTask,
}: TodayWidgetProps) {
  const compact = height < 110 || width < 160;
  const roomy = height >= 160 && width >= 240;
  const dateSize = compact ? 26 : roomy ? 46 : 36;

  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: 'personalapp://tasks' }}
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: palette.bg as any,
        borderRadius: 24,
        padding: compact ? 12 : 16,
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <FlexWidget style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
        <TextWidget
          text={dayName}
          style={{ fontSize: compact ? 12 : 15, fontWeight: '700', color: palette.text as any, marginRight: 6 }}
        />
        <TextWidget
          text={monthName}
          style={{ fontSize: compact ? 12 : 15, fontWeight: '700', color: palette.faint as any }}
        />
      </FlexWidget>

      <TextWidget text={dayNumber} style={{ fontSize: dateSize, fontWeight: '800', color: palette.text as any }} />

      <FlexWidget style={{ flexDirection: 'column' }}>
        <TextWidget
          text={taskCount === 0 ? 'All caught up' : `${taskCount} task${taskCount === 1 ? '' : 's'} due today`}
          maxLines={1}
          truncate="END"
          style={{ fontSize: compact ? 11 : 12, fontWeight: '600', color: palette.muted as any }}
        />
        {showNextTask && nextTaskTitle && !compact && (
          <TextWidget
            text={nextTaskTitle}
            maxLines={1}
            truncate="END"
            style={{ fontSize: 11, fontWeight: '500', color: palette.accentText as any, marginTop: 2 }}
          />
        )}
      </FlexWidget>
    </FlexWidget>
  );
}

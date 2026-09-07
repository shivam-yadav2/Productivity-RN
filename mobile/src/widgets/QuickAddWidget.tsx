import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { accent } from '../utils/theme';
import { WidgetPalette } from './widgetTheme';
import { WidgetAccent } from '../types';

interface CellProps {
  glyph: string;
  label: string;
  bg: string;
  fg: string;
  uri: string;
  compact: boolean;
}

function Cell({ glyph, label, bg, fg, uri, compact }: CellProps) {
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri }}
      style={{
        flex: 1,
        height: 'match_parent',
        backgroundColor: bg as any,
        borderRadius: 18,
        marginHorizontal: 4,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <TextWidget text={glyph} style={{ fontSize: compact ? 15 : 18, fontWeight: '800', color: fg as any }} />
      {!compact && (
        <TextWidget text={label} style={{ fontSize: 10, fontWeight: '600', color: fg as any, marginTop: 2 }} />
      )}
    </FlexWidget>
  );
}

interface QuickAddWidgetProps {
  palette: WidgetPalette;
  height: number;
  /** 'neutral' keeps the three tiles individually colour-coded; any other accent tints
   *  all three the same, for a home screen that wants one consistent colour. */
  accentName: WidgetAccent;
  isDark: boolean;
}

/** Home-screen widget: three shortcuts straight into the add-expense/task/note forms. */
export function QuickAddWidget({ palette, height, accentName, isDark }: QuickAddWidgetProps) {
  const compact = height < 70;

  const uniform = accentName !== 'neutral';
  const tint = (a: { bg: string; base: string; deep: string }) => ({
    bg: uniform ? palette.accentBg : isDark ? a.deep : a.bg,
    fg: uniform ? palette.accentText : isDark ? '#FFFFFF' : a.deep,
  });

  const expense = tint(accent.orange);
  const task = tint(accent.blue);
  const note = tint(accent.purple);

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: palette.bg as any,
        borderRadius: 24,
        padding: 8,
        flexDirection: 'row',
      }}
    >
      <Cell glyph="+" label="Expense" bg={expense.bg} fg={expense.fg} uri="personalapp://add-expense" compact={compact} />
      <Cell glyph="✓" label="Task" bg={task.bg} fg={task.fg} uri="personalapp://add-task" compact={compact} />
      <Cell glyph="✎" label="Note" bg={note.bg} fg={note.fg} uri="personalapp://add-note" compact={compact} />
    </FlexWidget>
  );
}

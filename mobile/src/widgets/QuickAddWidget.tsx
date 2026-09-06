import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { surface, accent } from '../utils/theme';

interface CellProps {
  glyph: string;
  label: string;
  bg: string;
  fg: string;
  uri: string;
}

function Cell({ glyph, label, bg, fg, uri }: CellProps) {
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
      <TextWidget text={glyph} style={{ fontSize: 18, fontWeight: '800', color: fg as any }} />
      <TextWidget text={label} style={{ fontSize: 10, fontWeight: '600', color: fg as any, marginTop: 2 }} />
    </FlexWidget>
  );
}

/** Home-screen widget: three tappable shortcuts straight into the add-expense/add-task/
 *  add-note forms — no data to show, purely a speed-dial for capture-first entry. */
export function QuickAddWidget() {
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: surface.light,
        borderRadius: 24,
        padding: 8,
        flexDirection: 'row',
      }}
    >
      <Cell glyph="+" label="Expense" bg={accent.orange.bg} fg={accent.orange.deep} uri="personalapp://add-expense" />
      <Cell glyph="✓" label="Task" bg={accent.blue.bg} fg={accent.blue.deep} uri="personalapp://add-task" />
      <Cell glyph="✎" label="Note" bg={accent.purple.bg} fg={accent.purple.deep} uri="personalapp://add-note" />
    </FlexWidget>
  );
}

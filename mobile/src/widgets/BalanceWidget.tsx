import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { ink, surface } from '../utils/theme';

interface BalanceWidgetProps {
  balanceText: string;
  spentTodayText: string;
}

/** Home-screen widget: total balance + today's spend. Tapping it opens Money. */
export function BalanceWidget({ balanceText, spentTodayText }: BalanceWidgetProps) {
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: 'personalapp://money' }}
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
      <TextWidget
        text="BALANCE"
        style={{ fontSize: 11, fontWeight: '700', color: ink[400], letterSpacing: 1 }}
      />
      <TextWidget
        text={balanceText}
        maxLines={1}
        truncate="END"
        style={{ fontSize: 30, fontWeight: '800', color: ink[900] }}
      />
      <TextWidget
        text={`Spent today ${spentTodayText}`}
        maxLines={1}
        truncate="END"
        style={{ fontSize: 12, fontWeight: '500', color: ink[500] }}
      />
    </FlexWidget>
  );
}

import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { WidgetPalette } from './widgetTheme';

interface BalanceWidgetProps {
  balanceText: string;
  spentTodayText: string;
  palette: WidgetPalette;
  /** Widget size in dp, so type and padding can scale instead of clipping when resized. */
  width: number;
  height: number;
  hideAmount?: boolean;
}

/** Home-screen widget: total balance + today's spend. Tapping it opens Money. */
export function BalanceWidget({
  balanceText,
  spentTodayText,
  palette,
  width,
  height,
  hideAmount,
}: BalanceWidgetProps) {
  // Resizing a widget re-renders it with new dp bounds; scaling off the smaller axis keeps
  // a short-and-wide widget from blowing the type up past its own height.
  const compact = height < 100 || width < 160;
  const roomy = height >= 150 && width >= 250;

  const amountSize = compact ? 22 : roomy ? 38 : 30;
  const pad = compact ? 12 : 16;

  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: 'personalapp://money' }}
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: palette.bg as any,
        borderRadius: 24,
        padding: pad,
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <TextWidget
        text="BALANCE"
        style={{ fontSize: compact ? 9 : 11, fontWeight: '700', color: palette.faint as any, letterSpacing: 1 }}
      />
      <TextWidget
        text={hideAmount ? '••••••' : balanceText}
        maxLines={1}
        truncate="END"
        style={{ fontSize: amountSize, fontWeight: '800', color: palette.text as any }}
      />
      {!compact && (
        <TextWidget
          text={hideAmount ? 'Spent today ••••' : `Spent today ${spentTodayText}`}
          maxLines={1}
          truncate="END"
          style={{ fontSize: 12, fontWeight: '500', color: palette.muted as any }}
        />
      )}
    </FlexWidget>
  );
}

import React from 'react';
import { View } from 'react-native';
import { Skeleton, SkeletonCard, SkeletonRow } from '../ui/Skeleton';

/**
 * Screen-shaped placeholders shown while a tab's real content is still being built.
 *
 * Each one mirrors the layout of its screen (same rough block sizes, same order), so the
 * swap to real content reads as the placeholder filling in rather than the page changing
 * shape underneath you.
 */

const Header: React.FC<{ withAction?: boolean }> = ({ withAction }) => (
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 4,
    }}
  >
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Skeleton width={42} height={42} borderRadius={16} />
      <View style={{ gap: 7 }}>
        <Skeleton width={132} height={17} />
        <Skeleton width={92} height={11} />
      </View>
    </View>
    {withAction && <Skeleton width={40} height={40} borderRadius={999} />}
  </View>
);

export const HomeSkeleton: React.FC = () => (
  <View style={{ flex: 1, gap: 22 }}>
    <Header withAction />

    {/* Day picker strip */}
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} width={44} height={62} borderRadius={18} />
      ))}
    </View>

    {/* Balance hero */}
    <SkeletonCard height={128} />

    {/* "Your day" grid */}
    <View style={{ gap: 12 }}>
      <Skeleton width={96} height={16} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <SkeletonCard height={150} />
        </View>
        <View style={{ flex: 1, gap: 12 }}>
          <SkeletonCard height={69} />
          <SkeletonCard height={69} />
        </View>
      </View>
    </View>

    {/* Tasks */}
    <View style={{ gap: 12 }}>
      <Skeleton width={128} height={14} />
      <SkeletonRow />
      <SkeletonRow />
    </View>
  </View>
);

export const MoneySkeleton: React.FC = () => (
  <View style={{ flex: 1, gap: 16 }}>
    <View
      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}
    >
      <View style={{ gap: 7 }}>
        <Skeleton width={158} height={19} />
        <Skeleton width={186} height={11} />
      </View>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        <Skeleton width={64} height={30} borderRadius={12} />
        <Skeleton width={72} height={30} borderRadius={12} />
      </View>
    </View>

    {/* Account strip */}
    <View style={{ flexDirection: 'row', gap: 10 }}>
      <Skeleton width={160} height={104} borderRadius={24} />
      <Skeleton width={150} height={104} borderRadius={24} />
      <Skeleton width={90} height={104} borderRadius={24} />
    </View>

    {/* Segmented control */}
    <Skeleton height={40} borderRadius={16} />

    <View style={{ gap: 12 }}>
      <SkeletonRow />
      <SkeletonRow />
      <SkeletonRow />
      <SkeletonRow />
    </View>
  </View>
);

export const ProductivitySkeleton: React.FC = () => (
  <View style={{ flex: 1, gap: 16 }}>
    <View style={{ gap: 7, paddingTop: 4 }}>
      <Skeleton width={148} height={19} />
      <Skeleton width={196} height={11} />
    </View>

    <Skeleton height={40} borderRadius={16} />
    <Skeleton height={44} borderRadius={16} />

    <View style={{ gap: 12 }}>
      <SkeletonRow />
      <SkeletonRow />
      <SkeletonRow />
      <SkeletonRow />
    </View>
  </View>
);

export const DocumentsSkeleton: React.FC = () => (
  <View style={{ flex: 1, gap: 14 }}>
    <View style={{ gap: 7, paddingTop: 4 }}>
      <Skeleton width={128} height={19} />
      <Skeleton width={104} height={11} />
    </View>

    <Skeleton height={38} borderRadius={14} />

    <View style={{ gap: 10 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Skeleton key={i} height={66} borderRadius={20} />
      ))}
    </View>
  </View>
);

export const SettingsSkeleton: React.FC = () => (
  <View style={{ flex: 1, gap: 18 }}>
    <View style={{ gap: 7, paddingTop: 4 }}>
      <Skeleton width={112} height={19} />
      <Skeleton width={170} height={11} />
    </View>

    {[0, 1, 2].map((section) => (
      <View key={section} style={{ gap: 10 }}>
        <Skeleton width={92} height={11} />
        <Skeleton height={54} borderRadius={20} />
        <Skeleton height={54} borderRadius={20} />
      </View>
    ))}
  </View>
);

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export interface MonthFilterState {
  month: number; // 1 to 12
  year: number;  // e.g. 2026
  isOverall: boolean;
}

interface MonthFilterBarProps {
  filterState: MonthFilterState;
  onChange: (newState: MonthFilterState) => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const MonthFilterBar: React.FC<MonthFilterBarProps> = ({ filterState, onChange }) => {
  const { colors } = useTheme();

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const isCurrentMonthActive =
    filterState.month === currentMonth &&
    filterState.year === currentYear &&
    !filterState.isOverall;

  const handlePrevMonth = () => {
    let newMonth = filterState.month - 1;
    let newYear = filterState.year;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    onChange({
      month: newMonth,
      year: newYear,
      isOverall: false,
    });
  };

  const handleNextMonth = () => {
    let newMonth = filterState.month + 1;
    let newYear = filterState.year;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    // Don't allow selecting future month past current calendar month
    if (newYear > currentYear || (newYear === currentYear && newMonth > currentMonth)) {
      return;
    }
    onChange({
      month: newMonth,
      year: newYear,
      isOverall: false,
    });
  };

  const canNextMonth =
    filterState.year < currentYear ||
    (filterState.year === currentYear && filterState.month < currentMonth);

  const handleResetToCurrentMonth = () => {
    onChange({
      month: currentMonth,
      year: currentYear,
      isOverall: false,
    });
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
        },
      ]}>
      {/* Mode Toggle: Monthly vs All-Time */}
      <View style={[styles.toggleTrack, { backgroundColor: colors.chipBg }]}>
        <TouchableOpacity
          style={[
            styles.toggleBtn,
            !filterState.isOverall && { backgroundColor: colors.primary },
          ]}
          onPress={() => onChange({ ...filterState, isOverall: false })}
          activeOpacity={0.8}>
          <Text
            style={[
              styles.toggleBtnText,
              { color: !filterState.isOverall ? '#ffffff' : colors.textSecondary },
            ]}>
            📅 Monthly
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleBtn,
            filterState.isOverall && { backgroundColor: colors.primary },
          ]}
          onPress={() => onChange({ ...filterState, isOverall: true })}
          activeOpacity={0.8}>
          <Text
            style={[
              styles.toggleBtnText,
              { color: filterState.isOverall ? '#ffffff' : colors.textSecondary },
            ]}>
            🌐 All-Time
          </Text>
        </TouchableOpacity>
      </View>

      {/* Month Navigator Controls */}
      {!filterState.isOverall ? (
        <View style={styles.navRow}>
          <TouchableOpacity
            style={[styles.arrowBtn, { backgroundColor: colors.chipBg }]}
            onPress={handlePrevMonth}
            activeOpacity={0.7}>
            <Text style={[styles.arrowText, { color: colors.primary }]}>‹</Text>
          </TouchableOpacity>

          <View style={styles.monthDisplay}>
            <Text style={[styles.monthTitle, { color: colors.text }]}>
              {MONTH_NAMES[filterState.month - 1]} {filterState.year}
            </Text>
            <Text style={[styles.monthSubtitle, { color: colors.textSecondary }]}>
              {isCurrentMonthActive ? 'Active Cycle' : 'Historical Cycle'}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.arrowBtn,
              { backgroundColor: colors.chipBg },
              !canNextMonth && styles.arrowBtnDisabled,
            ]}
            onPress={handleNextMonth}
            disabled={!canNextMonth}
            activeOpacity={0.7}>
            <Text
              style={[
                styles.arrowText,
                { color: canNextMonth ? colors.primary : colors.textMuted },
              ]}>
              ›
            </Text>
          </TouchableOpacity>

          {!isCurrentMonthActive && (
            <TouchableOpacity
              style={[styles.resetBtn, { borderColor: colors.primary }]}
              onPress={handleResetToCurrentMonth}
              activeOpacity={0.7}>
              <Text style={[styles.resetText, { color: colors.primary }]}>Today</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.allTimeInfo}>
          <Text style={[styles.allTimeText, { color: colors.primary }]}>
            Showing all historical records across all months
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  toggleTrack: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 3,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 4,
  },
  arrowBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowBtnDisabled: {
    opacity: 0.35,
  },
  arrowText: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 24,
  },
  monthDisplay: {
    alignItems: 'center',
    flex: 1,
  },
  monthTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  monthSubtitle: {
    fontSize: 10,
    marginTop: 1,
  },
  resetBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    marginLeft: 6,
  },
  resetText: {
    fontSize: 11,
    fontWeight: '700',
  },
  allTimeInfo: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  allTimeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});

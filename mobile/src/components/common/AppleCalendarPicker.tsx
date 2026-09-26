import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';

interface SingleDateProps {
  mode: 'single';
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onClose?: () => void;
  startDate?: never;
  endDate?: never;
  onSelectRange?: never;
}

interface RangeDateProps {
  mode: 'range';
  startDate: Date | null;
  endDate: Date | null;
  onSelectRange: (start: Date, end: Date) => void;
  onClose?: () => void;
  selectedDate?: never;
  onSelectDate?: never;
}

type Props = SingleDateProps | RangeDateProps;

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

const DAYS_OF_WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const AppleCalendarPicker: React.FC<Props> = (props) => {
  const { theme } = useTheme();

  const initialDate =
    props.mode === 'single'
      ? props.selectedDate
      : props.startDate || new Date();

  const [currentYear, setCurrentYear] = useState<number>(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(initialDate.getMonth());

  const [tempRangeStart, setTempRangeStart] = useState<Date | null>(null);

  const prevMonth = () => {
    Haptics.selectionAsync();
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    Haptics.selectionAsync();
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  const today = new Date();
  const isToday = (day: number) => {
    return (
      today.getDate() === day &&
      today.getMonth() === currentMonth &&
      today.getFullYear() === currentYear
    );
  };

  const isSameDay = (d1: Date | null, d2: Date | null) => {
    if (!d1 || !d2) return false;
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  };

  const isDayInRange = (date: Date, start: Date | null, end: Date | null) => {
    if (!start || !end) return false;
    const t = date.getTime();
    const s = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
    const e = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
    return t > s && t < e;
  };

  const handleDayPress = (day: number) => {
    Haptics.selectionAsync();
    const clickedDate = new Date(currentYear, currentMonth, day, 12, 0, 0);

    if (props.mode === 'single') {
      props.onSelectDate(clickedDate);
      if (props.onClose) {
        setTimeout(() => {
          props.onClose?.();
        }, 150);
      }
    } else {
      if (!tempRangeStart) {
        setTempRangeStart(clickedDate);
        props.onSelectRange(clickedDate, clickedDate);
      } else {
        if (clickedDate.getTime() < tempRangeStart.getTime()) {
          setTempRangeStart(clickedDate);
          props.onSelectRange(clickedDate, clickedDate);
        } else {
          props.onSelectRange(tempRangeStart, clickedDate);
          setTempRangeStart(null);
          if (props.onClose) {
            setTimeout(() => {
              props.onClose?.();
            }, 250);
          }
        }
      }
    }
  };

  const handleRangePreset = (preset: '7d' | '30d' | 'this_month' | 'last_month') => {
    Haptics.selectionAsync();
    if (props.mode !== 'range') return;
    setTempRangeStart(null);

    const now = new Date();
    if (preset === '7d') {
      const s = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      props.onSelectRange(s, now);
      setCurrentMonth(now.getMonth());
      setCurrentYear(now.getFullYear());
    } else if (preset === '30d') {
      const s = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      props.onSelectRange(s, now);
      setCurrentMonth(now.getMonth());
      setCurrentYear(now.getFullYear());
    } else if (preset === 'this_month') {
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      props.onSelectRange(s, now);
      setCurrentMonth(now.getMonth());
      setCurrentYear(now.getFullYear());
    } else if (preset === 'last_month') {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const e = new Date(now.getFullYear(), now.getMonth(), 0);
      props.onSelectRange(s, e);
      setCurrentMonth(s.getMonth());
      setCurrentYear(s.getFullYear());
    }

    if (props.onClose) {
      setTimeout(() => {
        props.onClose?.();
      }, 250);
    }
  };

  const gridCells = [];
  for (let i = 0; i < firstDayIndex; i++) {
    gridCells.push(<View key={`empty-${i}`} style={styles.dayCell} />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(currentYear, currentMonth, day, 12, 0, 0);

    let isSelected = false;
    let isStart = false;
    let isEnd = false;
    let inRange = false;

    if (props.mode === 'single') {
      isSelected = isSameDay(dateObj, props.selectedDate);
    } else {
      isStart = isSameDay(dateObj, props.startDate);
      isEnd = isSameDay(dateObj, props.endDate);
      isSelected = isStart || isEnd;
      inRange = isDayInRange(dateObj, props.startDate, props.endDate);
    }

    const currentDayToday = isToday(day);

    gridCells.push(
      <TouchableOpacity
        key={`day-${day}`}
        style={[
          styles.dayCell,
          inRange && { backgroundColor: theme.primaryLight },
          isStart && props.endDate && !isSameDay(props.startDate, props.endDate) && styles.rangeStartCell,
          isEnd && props.startDate && !isSameDay(props.startDate, props.endDate) && styles.rangeEndCell
        ]}
        onPress={() => handleDayPress(day)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.dayCircle,
            isSelected && { backgroundColor: theme.primary },
            currentDayToday && !isSelected && [styles.todayCircle, { borderColor: theme.primary }]
          ]}
        >
          <Text
            style={[
              styles.dayText,
              { color: isSelected ? '#FFFFFF' : theme.textPrimary },
              isSelected && styles.selectedDayText,
              currentDayToday && !isSelected && { color: theme.primary, fontWeight: '700' }
            ]}
          >
            {day}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
      {/* Quick Presets for Range Mode */}
      {props.mode === 'range' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.presetsRow}
        >
          <TouchableOpacity
            style={[styles.presetChip, { backgroundColor: theme.inputBg }]}
            onPress={() => handleRangePreset('7d')}
            activeOpacity={0.7}
          >
            <Text style={[styles.presetText, { color: theme.primary }]}>Last 7 Days</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.presetChip, { backgroundColor: theme.inputBg }]}
            onPress={() => handleRangePreset('30d')}
            activeOpacity={0.7}
          >
            <Text style={[styles.presetText, { color: theme.primary }]}>Last 30 Days</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.presetChip, { backgroundColor: theme.inputBg }]}
            onPress={() => handleRangePreset('this_month')}
            activeOpacity={0.7}
          >
            <Text style={[styles.presetText, { color: theme.primary }]}>This Month</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.presetChip, { backgroundColor: theme.inputBg }]}
            onPress={() => handleRangePreset('last_month')}
            activeOpacity={0.7}
          >
            <Text style={[styles.presetText, { color: theme.primary }]}>Last Month</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Top Status & Done bar if dismissable */}
      {props.onClose && (
        <View style={[styles.topActionBar, { borderBottomColor: theme.separator }]}>
          <Text style={[styles.topStatusText, { color: theme.textSecondary }]}>
            {props.mode === 'single'
              ? 'Tap date to select'
              : tempRangeStart
              ? 'Tap end date to finish'
              : 'Tap start date'}
          </Text>
          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              props.onClose?.();
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.topDoneText, { color: theme.primary }]}>Done</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Month & Navigation Header */}
      <View style={styles.monthHeader}>
        <TouchableOpacity
          onPress={prevMonth}
          style={[styles.navArrow, { backgroundColor: theme.fill }]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.navArrowText, { color: theme.primary }]}>‹</Text>
        </TouchableOpacity>

        <Text style={[styles.monthTitle, { color: theme.textPrimary }]}>
          {MONTH_NAMES[currentMonth]} {currentYear}
        </Text>

        <TouchableOpacity
          onPress={nextMonth}
          style={[styles.navArrow, { backgroundColor: theme.fill }]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.navArrowText, { color: theme.primary }]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Day of Week Labels */}
      <View style={styles.weekRow}>
        {DAYS_OF_WEEK.map((d, i) => (
          <View key={`dow-${i}`} style={styles.dayOfWeekCell}>
            <Text style={[styles.dayOfWeekText, { color: theme.textSecondary }]}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Grid of Days */}
      <View style={styles.daysGrid}>{gridCells}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 0.5
  },
  topActionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    marginBottom: 8,
    borderBottomWidth: 0.5
  },
  topStatusText: {
    fontSize: 13,
    fontWeight: '500'
  },
  topDoneText: {
    fontSize: 15,
    fontWeight: '600'
  },
  presetsRow: {
    flexDirection: 'row',
    marginBottom: 14
  },
  presetChip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 8
  },
  presetText: {
    fontSize: 13,
    fontWeight: '600'
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 4
  },
  monthTitle: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2
  },
  navArrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center'
  },
  navArrowText: {
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 24
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 8
  },
  dayOfWeekCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  dayOfWeekText: {
    fontSize: 13,
    fontWeight: '600'
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  dayCell: {
    width: '14.28%',
    height: 42,
    alignItems: 'center',
    justifyContent: 'center'
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center'
  },
  todayCircle: {
    borderWidth: 1.5
  },
  dayText: {
    fontSize: 15,
    fontWeight: '500'
  },
  selectedDayText: {
    fontWeight: '700'
  },
  rangeStartCell: {
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18
  },
  rangeEndCell: {
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18
  }
});

import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";

// ── helpers ───────────────────────────────────────────────────────────────────

function parseDateStr(s: string): Date | null {
  if (!s || s.replace(/\D/g, "").length < 6) return null;
  const [dd, mm, yy] = s.split("/");
  const year = 2000 + parseInt(yy ?? "0", 10);
  const month = parseInt(mm ?? "0", 10) - 1;
  const day = parseInt(dd ?? "0", 10);
  if (month < 0 || month > 11 || day < 1 || day > 31) return null;
  const d = new Date(year, month, day);
  return isNaN(d.getTime()) ? null : d;
}

function formatToMask(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(2);
  return `${dd}/${mm}/${yy}`;
}

function applyMask(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 6);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function buildGrid(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

const MONTH_NAMES = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];
const DAY_LABELS = ["D","S","T","Q","Q","S","S"];

// ── DatePickerField ───────────────────────────────────────────────────────────

interface DatePickerFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  floatBg?: string;
}

export function DatePickerField({
  label,
  value,
  onChange,
  floatBg = "#1E2E52",
}: DatePickerFieldProps) {
  const colors = useColors();
  const today = new Date();

  const selectedDate = parseDateStr(value);

  const [open, setOpen] = useState(false);
  const [calYear, setCalYear] = useState(selectedDate?.getFullYear() ?? today.getFullYear());
  const [calMonth, setCalMonth] = useState(selectedDate?.getMonth() ?? today.getMonth());
  const [tempDay, setTempDay] = useState<number | null>(selectedDate?.getDate() ?? null);

  const openPicker = () => {
    const d = parseDateStr(value) ?? today;
    setCalYear(d.getFullYear());
    setCalMonth(d.getMonth());
    setTempDay(d.getDate());
    setOpen(true);
  };

  const handleTextChange = (raw: string) => {
    onChange(applyMask(raw));
  };

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
    setTempDay(null);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
    setTempDay(null);
  };

  const selectToday = () => {
    setCalYear(today.getFullYear());
    setCalMonth(today.getMonth());
    setTempDay(today.getDate());
  };

  const confirmSelection = () => {
    if (tempDay) {
      const d = new Date(calYear, calMonth, tempDay);
      onChange(formatToMask(d));
    }
    setOpen(false);
  };

  const grid = buildGrid(calYear, calMonth);

  const isTodaySel =
    today.getFullYear() === calYear &&
    today.getMonth() === calMonth &&
    today.getDate() === tempDay;

  return (
    <>
      {/* ── Input field ── */}
      <View
        style={[
          styles.container,
          { borderColor: value ? "rgba(251,191,36,0.3)" : "rgba(255,255,255,0.1)" },
        ]}
      >
        <View style={[styles.floatLabel, { backgroundColor: floatBg }]}>
          <Text style={styles.floatLabelText}>{label}</Text>
        </View>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={value}
            onChangeText={handleTextChange}
            keyboardType="numeric"
            placeholder="DD/MM/AA"
            placeholderTextColor="#4A6080"
            maxLength={8}
          />
          <TouchableOpacity onPress={openPicker} hitSlop={12} style={styles.calIcon}>
            <Feather name="calendar" size={17} color={value ? "#FBBF24" : "#6B85A8"} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Calendar modal ── */}
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={[styles.card, { backgroundColor: "#1B294B" }]} onPress={() => {}}>

            {/* Month nav */}
            <View style={styles.monthRow}>
              <TouchableOpacity onPress={prevMonth} hitSlop={12} style={styles.navBtn}>
                <Feather name="chevron-left" size={20} color="#FBBF24" />
              </TouchableOpacity>
              <Text style={styles.monthTitle}>
                {MONTH_NAMES[calMonth]} {calYear}
              </Text>
              <TouchableOpacity onPress={nextMonth} hitSlop={12} style={styles.navBtn}>
                <Feather name="chevron-right" size={20} color="#FBBF24" />
              </TouchableOpacity>
            </View>

            {/* Day labels */}
            <View style={styles.dayLabelsRow}>
              {DAY_LABELS.map((l, i) => (
                <Text key={i} style={styles.dayLabel}>{l}</Text>
              ))}
            </View>

            {/* Days grid */}
            <View style={styles.grid}>
              {grid.map((day, idx) => {
                if (day === null) return <View key={idx} style={styles.cell} />;

                const isSelected = day === tempDay;
                const isTodayCell =
                  today.getFullYear() === calYear &&
                  today.getMonth() === calMonth &&
                  today.getDate() === day;

                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.cell,
                      isSelected && styles.cellSelected,
                      !isSelected && isTodayCell && styles.cellToday,
                    ]}
                    onPress={() => setTempDay(day)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.cellText,
                        isSelected && styles.cellTextSelected,
                        !isSelected && isTodayCell && styles.cellTextToday,
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Actions */}
            <View style={[styles.actionsRow, { borderTopColor: "rgba(255,255,255,0.08)" }]}>
              <TouchableOpacity onPress={selectToday} style={styles.todayBtn}>
                <Text style={styles.todayBtnText}>Hoje</Text>
              </TouchableOpacity>
              <View style={styles.actionsRight}>
                <TouchableOpacity onPress={() => setOpen(false)} hitSlop={8} style={styles.actionBtn}>
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={confirmSelection}
                  disabled={!tempDay}
                  style={[styles.actionBtn, styles.okBtn, { opacity: tempDay ? 1 : 0.4 }]}
                >
                  <Text style={styles.okBtnText}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>

          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
    position: "relative",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  floatLabel: {
    position: "absolute",
    top: -9,
    left: 10,
    paddingHorizontal: 4,
    zIndex: 1,
  },
  floatLabelText: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    color: "#6B85A8",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    padding: 0,
  },
  calIcon: {
    paddingLeft: 8,
  },

  // Modal
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: 320,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
    elevation: 24,
  },
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  navBtn: {
    padding: 4,
  },
  monthTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  dayLabelsRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  dayLabel: {
    flex: 1,
    textAlign: "center",
    color: "#6B85A8",
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    width: "14.28%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 100,
  },
  cellSelected: {
    backgroundColor: "#FBBF24",
  },
  cellToday: {
    borderWidth: 1.5,
    borderColor: "#FBBF24",
  },
  cellText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  cellTextSelected: {
    color: "#0B1329",
    fontFamily: "Inter_700Bold",
  },
  cellTextToday: {
    color: "#FBBF24",
    fontFamily: "Inter_600SemiBold",
  },

  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  todayBtn: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  todayBtnText: {
    color: "#FBBF24",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  actionsRight: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  okBtn: {
    backgroundColor: "#FBBF24",
    borderRadius: 8,
    paddingHorizontal: 20,
  },
  cancelBtnText: {
    color: "#6B85A8",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  okBtnText: {
    color: "#0B1329",
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
});

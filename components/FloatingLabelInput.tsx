import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  KeyboardTypeOptions,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

interface FloatingLabelInputProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  icon?: keyof typeof Feather.glyphMap;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  autoFocus?: boolean;
  floatBg?: string;
  error?: boolean;
}

export function FloatingLabelInput({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  keyboardType,
  multiline,
  autoFocus,
  floatBg = "#1E2E52",
  error,
}: FloatingLabelInputProps) {
  return (
    <View
      style={[
        styles.container,
        {
          borderColor: error
            ? "#EF4444"
            : value
              ? "rgba(251,191,36,0.3)"
              : "rgba(255,255,255,0.1)",
        },
      ]}
    >
      <View style={[styles.floatLabel, { backgroundColor: floatBg }]}>
        <Text style={styles.floatLabelText}>{label}</Text>
      </View>
      <View style={[styles.row, multiline && styles.rowMultiline]}>
        {icon && (
          <Feather
            name={icon}
            size={15}
            color={value ? "#FBBF24" : "#6B85A8"}
            style={[styles.icon, multiline && styles.iconMultiline]}
          />
        )}
        <TextInput
          style={[styles.input, multiline && styles.inputMultiline, { color: "#FFFFFF" }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#4A6080"
          keyboardType={keyboardType}
          multiline={multiline}
          autoFocus={autoFocus}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    position: "relative",
    backgroundColor: "rgba(255,255,255,0.04)",
    marginTop: 10,
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
    marginTop: 4,
  },
  rowMultiline: {
    alignItems: "flex-start",
  },
  icon: {
    marginRight: 8,
  },
  iconMultiline: {
    marginTop: 3,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    padding: 0,
  },
  inputMultiline: {
    minHeight: 40,
    textAlignVertical: "top",
  },
});

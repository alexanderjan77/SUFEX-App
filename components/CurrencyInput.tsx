import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { formatCurrencyInput, parseCurrencyInput } from "@/utils/format";

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

export function CurrencyInput({
  value,
  onChange,
  label,
  autoFocus,
}: CurrencyInputProps) {
  const colors = useColors();
  const ref = useRef<TextInput>(null);
  const [rawText, setRawText] = useState(
    value > 0 ? formatCurrencyInput(value) : "R$ 0,00"
  );

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  const handleChange = (text: string) => {
    const digits = text.replace(/[^\d]/g, "");
    const parsed = parseInt(digits || "0", 10) / 100;
    const formatted = formatCurrencyInput(parsed);
    setRawText(formatted);
    onChange(parsed);
  };

  return (
    <View style={styles.wrapper}>
      {label && (
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {label}
        </Text>
      )}
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => ref.current?.focus()}
        style={[
          styles.container,
          { backgroundColor: colors.surfaceLight, borderColor: colors.border },
        ]}
      >
        <TextInput
          ref={ref}
          style={[styles.input, { color: colors.text }]}
          value={rawText}
          onChangeText={handleChange}
          keyboardType="numeric"
          selectTextOnFocus
          caretHidden
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  container: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  input: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
  },
});

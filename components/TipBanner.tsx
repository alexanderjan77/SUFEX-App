import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useApp } from "@/context/AppContext";

interface TipBannerProps {
  tip: string;
}

export function TipBanner({ tip }: TipBannerProps) {
  const { showTips } = useApp();
  if (!showTips) return null;
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>💡</Text>
      <Text style={styles.text}>{tip}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(251,191,36,0.07)",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.18)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  icon: {
    fontSize: 14,
    lineHeight: 20,
  },
  text: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#C8A84B",
    lineHeight: 18,
  },
});

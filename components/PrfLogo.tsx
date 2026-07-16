import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

const logoImage = require("@/assets/images/logo_sufex_nobg.png");

interface PrfLogoProps {
  size?: number;
  showText?: boolean;
}

export function PrfLogo({ size = 120, showText = false }: PrfLogoProps) {
  return (
    <View style={[styles.wrapper, { width: size, height: size, borderRadius: size / 2, overflow: "hidden" }]}>
      <Image
        source={logoImage}
        style={{ width: size, height: size }}
        resizeMode="cover"
      />
      {showText && (
        <View style={styles.textContainer}>
          <Text style={[styles.titleText, { fontSize: size * 0.18 }]}>
            SUFEX
          </Text>
          <Text style={[styles.subtitleText, { fontSize: size * 0.08 }]}>
            Suprimento de Fundos
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
  },
  textContainer: {
    alignItems: "center",
    marginTop: 16,
  },
  titleText: {
    color: "#FBBF24",
    fontWeight: "900",
    fontFamily: "Inter_700Bold",
    letterSpacing: 4,
  },
  subtitleText: {
    color: "#B8CCE8",
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
});

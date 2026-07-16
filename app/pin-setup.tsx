import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useState } from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PrfLogo } from "@/components/PrfLogo";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const PIN_KEY = "@sufex:pin";
const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, "del"] as const;

async function savePin(pin: string) {
  if (Platform.OS === "web") {
    localStorage.setItem(PIN_KEY, pin);
  } else {
    await SecureStore.setItemAsync(PIN_KEY, pin);
  }
}

export default function PinSetupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { poi, savePOI } = useApp();

  const [step, setStep] = useState<"create" | "confirm">("create");
  const [firstPin, setFirstPin] = useState("");
  const [currentPin, setCurrentPin] = useState("");
  const [error, setError] = useState(false);
  const shakeAnim = new Animated.Value(0);

  const shake = () => {
    setError(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
    ]).start(() => {
      setTimeout(() => {
        setError(false);
        setCurrentPin("");
      }, 400);
    });
  };

  const handleDigit = useCallback(
    async (d: number | "del" | null) => {
      if (d === null) return;
      if (d === "del") {
        setCurrentPin((p) => p.slice(0, -1));
        return;
      }
      const next = currentPin + d.toString();
      setCurrentPin(next);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (next.length === 4) {
        if (step === "create") {
          setFirstPin(next);
          setCurrentPin("");
          setStep("confirm");
        } else {
          if (next === firstPin) {
            await savePin(next);
            await savePOI({ ...poi, pinConfigured: true });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.replace("/login");
          } else {
            shake();
          }
        }
      }
    },
    [currentPin, step, firstPin, poi]
  );

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.navyDeep,
          paddingTop: topPad + 20,
          paddingBottom: bottomPad + 20,
        },
      ]}
    >
      <View style={styles.logoSection}>
        <PrfLogo size={90} />
        <Text style={[styles.appTitle, { color: colors.gold }]}>SUFEX</Text>
        <Text style={[styles.setupTitle, { color: colors.text }]}>
          {step === "create" ? "Criar PIN de acesso" : "Confirmar PIN"}
        </Text>
        <Text style={[styles.setupSubtitle, { color: colors.textMuted }]}>
          {step === "create"
            ? "Escolha um PIN de 4 dígitos para proteger seu app"
            : "Digite novamente o PIN escolhido"}
        </Text>
      </View>

      <View style={styles.pinSection}>
        <Animated.View
          style={[styles.dotsRow, { transform: [{ translateX: shakeAnim }] }]}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    i < currentPin.length
                      ? error
                        ? colors.destructive
                        : colors.gold
                      : colors.border,
                  borderColor: error ? colors.destructive : colors.border,
                },
              ]}
            />
          ))}
        </Animated.View>

        {error && (
          <Text style={[styles.errorText, { color: colors.destructive }]}>
            PINs não coincidem. Tente novamente.
          </Text>
        )}
      </View>

      <View style={styles.numpad}>
        {DIGITS.map((d, i) => {
          if (d === null) return <View key={i} style={styles.numpadKey} />;
          if (d === "del") {
            return (
              <TouchableOpacity
                key={i}
                style={styles.numpadKey}
                onPress={() => handleDigit("del")}
                activeOpacity={0.6}
              >
                <Feather name="delete" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            );
          }
          return (
            <TouchableOpacity
              key={i}
              style={[
                styles.numpadKey,
                styles.numpadDigit,
                { backgroundColor: colors.surfaceLight, borderColor: colors.border },
              ]}
              onPress={() => handleDigit(d)}
              activeOpacity={0.6}
            >
              <Text style={[styles.numpadText, { color: colors.text }]}>{d}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {step === "confirm" && (
        <TouchableOpacity
          onPress={() => {
            setStep("create");
            setCurrentPin("");
            setFirstPin("");
          }}
          style={styles.backBtn}
        >
          <Text style={[styles.backLabel, { color: colors.textMuted }]}>
            Voltar e redefinir
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
  },
  logoSection: {
    alignItems: "center",
    gap: 8,
  },
  appTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: 6,
    marginTop: 10,
  },
  setupTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginTop: 8,
  },
  setupSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    maxWidth: 280,
    marginTop: 4,
  },
  pinSection: {
    alignItems: "center",
    gap: 12,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 16,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  errorText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  numpad: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    maxWidth: 300,
  },
  numpadKey: {
    width: 80,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  numpadDigit: {
    borderRadius: 14,
    borderWidth: 1,
  },
  numpadText: {
    fontSize: 22,
    fontFamily: "Inter_600SemiBold",
  },
  backBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  backLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
});

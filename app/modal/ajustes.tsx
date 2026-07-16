import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

export default function AjustesModal() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { poi, savePOI, showTips, setShowTips, setAuthenticated } = useApp();

  const [biometricEnabled, setBiometricEnabled] = useState(poi.biometricEnabled);
  const [tipsEnabled, setTipsEnabled] = useState(showTips);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleToggleBiometric = async (value: boolean) => {
    setBiometricEnabled(value);
    await savePOI({ ...poi, biometricEnabled: value });
  };

  const handleToggleTips = async (value: boolean) => {
    setTipsEnabled(value);
    await setShowTips(value);
  };

  const handleLogout = () => {
    Alert.alert(
      "Sair do aplicativo",
      "Você será desconectado e precisará informar o PIN para acessar novamente.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sair",
          style: "destructive",
          onPress: () => {
            setAuthenticated(false);
            router.replace("/login");
          },
        },
      ],
    );
  };

  const handleChangePin = () => {
    Alert.alert(
      "Alterar PIN",
      "Deseja redefinir o PIN de acesso ao aplicativo?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Redefinir PIN",
          style: "destructive",
          onPress: async () => {
            await savePOI({ ...poi, pinConfigured: false });
            router.replace("/pin-setup");
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.navyDeep }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 6, backgroundColor: colors.navyPrimary },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Feather name="x" size={24} color={colors.textMuted} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Ajustes</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>PREFERÊNCIAS</Text>

          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.toggleLabel, { color: colors.text }]}>💡 Dicas de Uso</Text>
              <Text style={[styles.toggleHint, { color: colors.textMuted }]}>
                Exibe orientações nos formulários de saque e despesa
              </Text>
            </View>
            <Switch
              value={tipsEnabled}
              onValueChange={handleToggleTips}
              trackColor={{ false: colors.border, true: `${colors.gold}60` }}
              thumbColor={tipsEnabled ? colors.gold : colors.textMuted}
            />
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>SEGURANÇA</Text>

          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.toggleLabel, { color: colors.text }]}>Login Biométrico</Text>
              <Text style={[styles.toggleHint, { color: colors.textMuted }]}>
                Impressão digital ou reconhecimento facial
              </Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={handleToggleBiometric}
              trackColor={{ false: colors.border, true: `${colors.gold}60` }}
              thumbColor={biometricEnabled ? colors.gold : colors.textMuted}
            />
          </View>

          <TouchableOpacity
            onPress={handleChangePin}
            style={[
              styles.changePin,
              { backgroundColor: colors.surfaceLight, borderColor: colors.border },
            ]}
          >
            <Feather name="lock" size={16} color={colors.gold} />
            <Text style={[styles.changePinText, { color: colors.gold }]}>Alterar PIN de Acesso</Text>
            <Feather name="chevron-right" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.infoBox,
            { backgroundColor: `${colors.gold}10`, borderColor: `${colors.gold}30` },
          ]}
        >
          <Feather name="shield" size={14} color={colors.gold} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Estes dados são armazenados localmente e protegidos pelo PIN. Certifique-se de manter o
            PIN em local seguro.
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleLogout}
          style={[styles.logoutBtn, { borderColor: "rgba(239,68,68,0.3)", backgroundColor: "rgba(239,68,68,0.06)" }]}
          activeOpacity={0.8}
        >
          <Feather name="log-out" size={16} color="#EF4444" />
          <Text style={styles.logoutText}>Sair do Aplicativo</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },

  content: { padding: 16, gap: 12 },
  card: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 14 },
  sectionLabel: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  toggleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  toggleLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  toggleHint: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },

  changePin: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  changePinText: { flex: 1, fontSize: 14, fontFamily: "Inter_600SemiBold" },

  infoBox: {
    flexDirection: "row",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    alignItems: "flex-start",
  },
  infoText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 18 },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
  },
  logoutText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#EF4444" },
});

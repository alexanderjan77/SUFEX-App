import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as LocalAuthentication from "expo-local-authentication";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PrfLogo } from "@/components/PrfLogo";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const USER_KEY = "sufex.username";
const PASS_KEY = "sufex.password";
const BIO_KEY  = "sufex.biometric";

async function getStored(key: string): Promise<string | null> {
  if (Platform.OS === "web") return localStorage.getItem(key);
  return SecureStore.getItemAsync(key);
}

async function setStored(key: string, value: string) {
  if (Platform.OS === "web") localStorage.setItem(key, value);
  else await SecureStore.setItemAsync(key, value);
}

type Mode = "login" | "cadastro";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setAuthenticated } = useApp();

  const [mode, setMode] = useState<Mode>("login");
  const [hasAccount, setHasAccount] = useState<boolean | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const passRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const topPad = Platform.OS === "web" ? 60 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    (async () => {
      const stored = await getStored(USER_KEY);
      const exists = !!stored;
      setHasAccount(exists);
      setMode(exists ? "login" : "cadastro");

      if (Platform.OS !== "web") {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        const bioEnabled = (await getStored(BIO_KEY)) === "true";
        const bioOk = compatible && enrolled && exists;
        setBiometricAvailable(bioOk);

        // Auto-login via biometria se o usuário habilitou anteriormente
        if (bioOk && bioEnabled) {
          try {
            const result = await LocalAuthentication.authenticateAsync({
              promptMessage: "Confirme sua identidade para acessar o SUFEX",
              cancelLabel: "Usar senha",
              fallbackLabel: "Usar senha",
            });
            if (result.success) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setAuthenticated(true);
              router.replace("/(tabs)");
            }
          } catch {
            // silently fall through to manual login
          }
        }
      }
    })();
  }, []);

  const shake = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 70, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 70, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 70, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 70, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 70, useNativeDriver: true }),
    ]).start();
  };

  const handleLogin = async () => {
    setError("");
    if (!username.trim() || !password) {
      setError("Preencha usuário e senha.");
      shake();
      return;
    }
    setLoading(true);
    try {
      const storedUser = await getStored(USER_KEY);
      const storedPass = await getStored(PASS_KEY);
      if (
        username.trim().toLowerCase() === storedUser?.toLowerCase() &&
        password === storedPass
      ) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setAuthenticated(true);
        router.replace("/(tabs)");
      } else {
        setError("Usuário ou senha incorretos.");
        shake();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCadastro = async () => {
    setError("");
    if (!username.trim()) { setError("Informe um nome de usuário."); shake(); return; }
    if (password.length < 4) { setError("A senha deve ter pelo menos 4 caracteres."); shake(); return; }
    if (password !== confirmPassword) { setError("As senhas não coincidem."); shake(); return; }
    setLoading(true);
    try {
      await setStored(USER_KEY, username.trim());
      await setStored(PASS_KEY, password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Oferecer biometria logo após o primeiro cadastro (apenas nativo)
      if (Platform.OS !== "web") {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        if (compatible && enrolled) {
          await new Promise<void>((resolve) => {
            Alert.alert(
              "Login Biométrico",
              "Deseja habilitar o acesso automático por impressão digital ou Face ID nas próximas sessões?",
              [
                {
                  text: "Não, obrigado",
                  style: "cancel",
                  onPress: () => resolve(),
                },
                {
                  text: "Habilitar",
                  onPress: async () => {
                    await setStored(BIO_KEY, "true");
                    resolve();
                  },
                },
              ],
            );
          });
        }
      }

      setAuthenticated(true);
      router.replace("/(tabs)");
    } finally {
      setLoading(false);
    }
  };

  const handleBiometric = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Confirme sua identidade para acessar o SUFEX",
        cancelLabel: "Cancelar",
        fallbackLabel: "Usar senha",
      });
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setAuthenticated(true);
        router.replace("/(tabs)");
      }
    } catch {
      setError("Biometria indisponível.");
    }
  };

  const switchMode = () => {
    setError("");
    setUsername("");
    setPassword("");
    setConfirmPassword("");
    setMode(m => m === "login" ? "cadastro" : "login");
  };

  if (hasAccount === null) {
    return (
      <View style={[styles.center, { backgroundColor: colors.navyDeep }]}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    );
  }

  const isLogin = mode === "login";

  return (
    <LinearGradient
      colors={["#0B1329", "#111D3D", "#0D1830"]}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={{ flex: 1 }}
    >
      {/* Top glow */}
      <View style={styles.glowTop} pointerEvents="none" />
      {/* Bottom-right accent glow */}
      <View style={styles.glowBottomRight} pointerEvents="none" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.container,
            { paddingTop: topPad + 32, paddingBottom: bottomPad + 32 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo + brand */}
          <View style={styles.header}>
            {/* Glowing logo circle */}
            <View style={styles.logoCircle}>
              <Image
                source={require("@/assets/images/logo_sufex_nobg.png")}
                style={{ width: 96, height: 96 }}
                resizeMode="cover"
              />
            </View>

            <View style={styles.brandText}>
              <Text style={styles.appTitle}>
                <Text style={{ color: "#FFFFFF" }}>Gestão de </Text>
                <Text style={{ color: colors.gold }}>SUFEX</Text>
              </Text>
              <Text style={[styles.appSubtitle, { color: "#6B85A8" }]}>
                Sistema de Gestão de Suprimento de Fundos{"\n"}Excepcional em Regime Especial de Execução
              </Text>
            </View>
          </View>

          {/* Form card */}
          <Animated.View
            style={[
              styles.card,
              { transform: [{ translateX: shakeAnim }] },
            ]}
          >
            <Text style={styles.cardTitle}>
              {isLogin ? "Acesse o Aplicativo" : "Criar Conta"}
            </Text>

            {/* Username */}
            <View style={[styles.inputRow, error ? styles.inputError : null]}>
              <Feather name="user" size={17} color="#6B85A8" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Usuário"
                placeholderTextColor="#4A6080"
                value={username}
                onChangeText={t => { setUsername(t); setError(""); }}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => passRef.current?.focus()}
              />
            </View>

            {/* Password */}
            <View style={[styles.inputRow, error ? styles.inputError : null]}>
              <Feather name="lock" size={17} color="#6B85A8" style={styles.inputIcon} />
              <TextInput
                ref={passRef}
                style={[styles.input, { color: colors.text }]}
                placeholder="Senha"
                placeholderTextColor="#4A6080"
                value={password}
                onChangeText={t => { setPassword(t); setError(""); }}
                secureTextEntry={!showPass}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType={isLogin ? "done" : "next"}
                onSubmitEditing={isLogin ? handleLogin : () => confirmRef.current?.focus()}
              />
              <TouchableOpacity onPress={() => setShowPass(v => !v)} hitSlop={12}>
                <Feather name={showPass ? "eye" : "eye-off"} size={17} color="#4A6080" />
              </TouchableOpacity>
            </View>

            {/* Confirm password (cadastro only) */}
            {!isLogin && (
              <View style={[styles.inputRow, error ? styles.inputError : null]}>
                <Feather name="lock" size={17} color="#6B85A8" style={styles.inputIcon} />
                <TextInput
                  ref={confirmRef}
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Confirmar Senha"
                  placeholderTextColor="#4A6080"
                  value={confirmPassword}
                  onChangeText={t => { setConfirmPassword(t); setError(""); }}
                  secureTextEntry={!showConfirm}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleCadastro}
                />
                <TouchableOpacity onPress={() => setShowConfirm(v => !v)} hitSlop={12}>
                  <Feather name={showConfirm ? "eye" : "eye-off"} size={17} color="#4A6080" />
                </TouchableOpacity>
              </View>
            )}

            {/* Error */}
            {!!error && (
              <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
            )}

            {/* CTA button */}
            <TouchableOpacity
              onPress={isLogin ? handleLogin : handleCadastro}
              activeOpacity={0.8}
              disabled={loading}
              style={{ marginTop: 4 }}
            >
              <LinearGradient
                colors={["#F59E0B", "#FBBF24", "#FCD34D"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.submitBtn, { opacity: loading ? 0.75 : 1 }]}
              >
                {loading
                  ? <ActivityIndicator color="#0B1329" />
                  : <Text style={styles.submitText}>
                      {isLogin ? "Entrar" : "Cadastrar-se"}
                    </Text>
                }
              </LinearGradient>
            </TouchableOpacity>

            {/* Biometric option (login mode only, when available) */}
            {isLogin && biometricAvailable && (
              <>
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>ou</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity
                  style={styles.biometricBtn}
                  onPress={handleBiometric}
                  activeOpacity={0.8}
                >
                  <Feather name="shield" size={17} color={colors.gold} />
                  <Text style={[styles.biometricText, { color: "#8BA3C7" }]}>
                    Entrar com biometria
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>

          {/* Switch mode */}
          <View style={styles.switchRow}>
            <Text style={[styles.switchHint, { color: "#4A6080" }]}>
              {isLogin ? "Não possui cadastro?" : "Já possui conta?"}
            </Text>
            <TouchableOpacity onPress={switchMode} hitSlop={10}>
              <Text style={[styles.switchLink, { color: colors.gold }]}>
                {isLogin ? "Cadastrar-se" : "Entrar"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  glowTop: {
    position: "absolute",
    top: -100,
    left: "50%",
    marginLeft: -160,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "rgba(59,130,246,0.07)",
  },
  glowBottomRight: {
    position: "absolute",
    bottom: 60,
    right: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(251,191,36,0.04)",
  },

  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 28,
  },

  header: {
    alignItems: "center",
    gap: 16,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#1B294B",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  brandText: {
    alignItems: "center",
    gap: 4,
  },
  appTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  appSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 18,
    letterSpacing: 0.3,
  },

  card: {
    width: "100%",
    backgroundColor: "rgba(27,41,75,0.85)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    padding: 22,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 32,
    elevation: 16,
  },
  cardTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    marginBottom: 2,
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "web" ? 14 : 12,
  },
  inputError: {
    borderColor: "rgba(239,68,68,0.6)",
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    padding: 0,
  },

  errorText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },

  submitBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#FBBF24",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  submitText: {
    color: "#0B1329",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 2,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  dividerText: {
    color: "#4A6080",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },

  biometricBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    paddingVertical: 13,
  },
  biometricText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },

  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  switchHint: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  switchLink: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
});

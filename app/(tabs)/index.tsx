import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, G, Text as SvgText } from "react-native-svg";

import { PrfLogo } from "@/components/PrfLogo";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { NATURE_LABELS, TransactionNature } from "@/types";
import { formatCurrency } from "@/utils/format";

// ── Donut chart constants ─────────────────────────────────────────────────────
const D_SIZE = 100;
const D_STROKE = 10;
const D_R = (D_SIZE - D_STROKE) / 2;
const D_CIRC = 2 * Math.PI * D_R;

// ── Date helpers ──────────────────────────────────────────────────────────────
function parseMaskedDate(s: string): Date | null {
  if (!s || s.replace(/\D/g, "").length < 6) return null;
  const parts = s.split("/");
  if (parts.length < 3) return null;
  const yearRaw = parseInt(parts[2], 10);
  const year = yearRaw < 100 ? 2000 + yearRaw : yearRaw;
  const d = new Date(year, parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
  if (isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

function DonutGauge({
  pct,
  accentColor,
}: {
  pct: number;
  accentColor: string;
}) {
  const clamped = Math.min(pct, 1);
  const dash = D_CIRC * clamped;
  const over = pct > 1;
  const pctLabel = `${Math.round(pct * 100)}%`;

  return (
    <Svg width={D_SIZE} height={D_SIZE}>
      <G rotation="-90" origin={`${D_SIZE / 2}, ${D_SIZE / 2}`}>
        <Circle
          cx={D_SIZE / 2}
          cy={D_SIZE / 2}
          r={D_R}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={D_STROKE}
          fill="none"
        />
        {clamped > 0 && (
          <Circle
            cx={D_SIZE / 2}
            cy={D_SIZE / 2}
            r={D_R}
            stroke={over ? "#EF4444" : accentColor}
            strokeWidth={D_STROKE}
            fill="none"
            strokeDasharray={`${dash} ${D_CIRC}`}
            strokeLinecap="round"
          />
        )}
      </G>
      <SvgText
        x={D_SIZE / 2}
        y={D_SIZE / 2 - 6}
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize="16"
        fontWeight="800"
      >
        {pctLabel}
      </SvgText>
      <SvgText
        x={D_SIZE / 2}
        y={D_SIZE / 2 + 10}
        textAnchor="middle"
        fill="#6B85A8"
        fontSize="9"
      >
        utilizado
      </SvgText>
    </Svg>
  );
}

// ── Nature cards config ───────────────────────────────────────────────────────
const NATURE_CARDS: Array<{
  nature: TransactionNature;
  badge: string;
  label: string;
  badgeColor: string;
  poiKey: "limitePJ" | "limitePF" | "limiteConsumo" | "limitePermanente";
}> = [
  { nature: "PESSOA_JURIDICA",     badge: "PJ", label: "Pessoa Jurídica",  badgeColor: "#22C55E", poiKey: "limitePJ" },
  { nature: "PESSOA_FISICA",       badge: "PF", label: "Pessoa Física",    badgeColor: "#3B82F6", poiKey: "limitePF" },
  { nature: "MATERIAL_CONSUMO",    badge: "MC", label: "Mat. de Consumo",  badgeColor: "#F97316", poiKey: "limiteConsumo" },
  { nature: "MATERIAL_PERMANENTE", badge: "MP", label: "Mat. Permanente",  badgeColor: "#A855F7", poiKey: "limitePermanente" },
];

// ── Main screen ───────────────────────────────────────────────────────────────
export default function ResumoScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    poi,
    totalExpenses,
    totalWithdrawals,
    expensesByNature,
    transactions,
    resetApp,
  } = useApp();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  // ── derived values ──
  const totalLimits =
    (poi.limitePJ ?? 0) +
    (poi.limitePF ?? 0) +
    (poi.limiteConsumo ?? 0) +
    (poi.limitePermanente ?? 0);
  const overallPct = totalLimits > 0 ? totalExpenses / totalLimits : 0;

  // ── Dias restantes e alertas de prazo ──
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const vigEndDate = parseMaskedDate(poi.vigenciaEnd ?? "");
  const diasRestantes = vigEndDate
    ? Math.ceil((vigEndDate.getTime() - hoje.getTime()) / 86_400_000)
    : null;
  const anoAtual = hoje.getFullYear();
  const dec15 = new Date(anoAtual, 11, 15);
  const dec20 = new Date(anoAtual, 11, 20);
  const diasParaDec15 = Math.ceil((dec15.getTime() - hoje.getTime()) / 86_400_000);
  const diasParaDec20 = Math.ceil((dec20.getTime() - hoje.getTime()) / 86_400_000);
  const alertaDec20 = diasParaDec20 >= 0 && diasParaDec20 <= 15;
  const alertaDec15 = !alertaDec20 && diasParaDec15 >= 0 && diasParaDec15 <= 30;
  const showDecAlert = alertaDec15 || alertaDec20;

  // ── Prazo de comprovação (5 dias após vigenciaEnd) ──
  const diasAposVig = diasRestantes !== null && diasRestantes < 0 ? -diasRestantes : 0;
  const prazoComprovacaoDate = vigEndDate
    ? new Date(vigEndDate.getTime() + 5 * 86_400_000)
    : null;
  const prazoComprovacaoStr = prazoComprovacaoDate
    ? prazoComprovacaoDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" })
    : null;
  const diasParaPrazo = prazoComprovacaoDate
    ? Math.max(0, Math.ceil((prazoComprovacaoDate.getTime() - hoje.getTime()) / 86_400_000))
    : null;
  const showPrazoComprovacao = diasAposVig > 0;
  const prazoExpirado = diasAposVig > 5;

  return (
    <View style={[styles.root, { backgroundColor: colors.navyDeep }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: bottomPad + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header (scrolls with content) ── */}
        <View style={[styles.headerWrapper, { paddingTop: topPad + 8 }]}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.push("/modal/ajustes")} hitSlop={8}>
              <Feather name="settings" size={22} color={colors.text} />
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <View style={[styles.logoCircle, { backgroundColor: colors.navyPrimary }]}>
                <Image
                  source={require("@/assets/images/logo_sufex_nobg.png")}
                  style={{ width: 52, height: 52 }}
                  resizeMode="cover"
                />
              </View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Gestão de SUFEX</Text>
            </View>

            <TouchableOpacity
              style={styles.iconBtn}
              hitSlop={8}
              onPress={() =>
                Alert.alert(
                  "Resetar aplicativo",
                  "Todos os dados serão apagados permanentemente, incluindo lançamentos e configurações do POI. Esta ação não pode ser desfeita.",
                  [
                    { text: "Cancelar", style: "cancel" },
                    {
                      text: "Apagar tudo",
                      style: "destructive",
                      onPress: resetApp,
                    },
                  ],
                )
              }
            >
              <Feather name="trash-2" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>

          {/* Dec deadline banner */}
          {showDecAlert && (
            <View style={styles.decBanner}>
              <Feather name="alert-triangle" size={11} color="#EF4444" />
              <Text style={styles.decBannerText}>
                {alertaDec20
                  ? `⚠ Prestação de contas até 20/12 — faltam ${diasParaDec20} dia${diasParaDec20 !== 1 ? "s" : ""}`
                  : `⚠ Prazo de aplicação: 15/12 — faltam ${diasParaDec15} dias`}
              </Text>
            </View>
          )}

          {/* ── Vigência countdown (toque para editar POI) ── */}
          {(() => {
            const hasVig = diasRestantes !== null;
            const accent = !hasVig
              ? colors.textMuted
              : diasRestantes > 30 ? "#22C55E"
              : diasRestantes > 10 ? "#F59E0B"
              : "#EF4444";
            return (
              <TouchableOpacity
                onPress={() => router.push("/modal/poi")}
                activeOpacity={0.75}
                style={[
                  styles.vigCard,
                  {
                    backgroundColor: !hasVig
                      ? "rgba(255,255,255,0.04)"
                      : diasRestantes > 30 ? "rgba(34,197,94,0.1)"
                      : diasRestantes > 10 ? "rgba(245,158,11,0.1)"
                      : "rgba(239,68,68,0.1)",
                    borderColor: !hasVig ? "rgba(255,255,255,0.12)" : accent,
                  },
                ]}
              >
                <View style={{ flex: 1, gap: 4 }}>
                  {/* Título */}
                  <Text style={[styles.vigCardTitle, { color: accent }]}>Dados da Solicitação</Text>

                  {hasVig ? (
                    <>
                      {/* Linha 1: 📄 número POI + 👤 suprido */}
                      <View style={styles.vigCardInfoRow}>
                        <Feather name="file-text" size={12} color={accent} />
                        <Text style={[styles.vigCardInfoText, { color: accent }]} numberOfLines={1}>
                          {poi.poiNumber || "—"}
                        </Text>
                        <Feather name="user" size={12} color={accent} style={{ marginLeft: 4 }} />
                        <Text style={[styles.vigCardInfoText, { color: accent }]} numberOfLines={1} ellipsizeMode="tail">
                          {poi.supridoName || "—"}
                        </Text>
                      </View>
                      {/* Linha 2: label + datas na mesma linha */}
                      <View style={styles.vigCardInfoRow}>
                        <Text style={[styles.vigCardLabel, { color: accent }]}>VIGÊNCIA</Text>
                        <Text style={[styles.vigCardPeriod, { color: accent }]}>
                          {poi.vigenciaStart || "—"} → {poi.vigenciaEnd || "—"}
                        </Text>
                      </View>
                    </>
                  ) : (
                    <Text style={[styles.vigCardPeriod, { color: accent }]}>
                      Toque para configurar
                    </Text>
                  )}
                </View>

                {(() => {
                  if (!hasVig) return <Feather name="chevron-right" size={16} color={colors.textMuted} />;
                  const urgent = diasRestantes !== null && diasRestantes <= 5;
                  const badgeBg = urgent ? "rgba(239,68,68,0.15)" : `${accent}22`;
                  const textColor = urgent ? "#EF4444" : accent;
                  return (
                    <View style={[styles.vigDaysBadge, { backgroundColor: badgeBg, borderWidth: 1, borderColor: urgent ? "#EF4444" : "transparent" }]}>
                      <Text style={[styles.vigDaysNum, { color: textColor }]}>{Math.max(0, diasRestantes!)}</Text>
                      <Text style={[styles.vigDaysLabel, { color: textColor }]}>restantes</Text>
                    </View>
                  );
                })()}
              </TouchableOpacity>
            );
          })()}
        </View>

        {/* ── Balão de boas-vindas — POI não configurado ── */}
        {!poi.poiNumber && (
          <TouchableOpacity
            onPress={() => router.push("/modal/poi")}
            activeOpacity={0.85}
            style={styles.poiBalloonWrapper}
          >
            {/* Seta apontando para o card POI acima */}
            <View style={styles.poiBalloonArrow} />
            <View style={styles.poiBalloon}>
              <Text style={styles.poiBalloonIcon}>💡</Text>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={styles.poiBalloonTitle}>Configure os dados da solicitação para começar</Text>
                <Text style={styles.poiBalloonBody}>
                  Preencha os dados da solicitação — número do POI, suprido, vigência e limites por natureza — para liberar saques e despesas.
                </Text>
                <Text style={styles.poiBalloonCta}>Toque aqui para preencher →</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* ── Banner prazo de comprovação (5 dias após fim da vigência) ── */}
        {showPrazoComprovacao && (
          <View style={[
            styles.prazoBanner,
            { borderColor: prazoExpirado ? "#EF4444" : "#F59E0B",
              backgroundColor: prazoExpirado ? "rgba(239,68,68,0.08)" : "rgba(245,158,11,0.08)" },
          ]}>
            <Feather
              name={prazoExpirado ? "alert-octagon" : "clock"}
              size={15}
              color={prazoExpirado ? "#EF4444" : "#F59E0B"}
            />
            <View style={{ flex: 1, gap: 2 }}>
              {prazoExpirado ? (
                <>
                  <Text style={[styles.prazoBannerTitle, { color: "#EF4444" }]}>
                    Prazo de prestação de contas expirado
                  </Text>
                  <Text style={[styles.prazoBannerBody, { color: "#FCA5A5" }]}>
                    O prazo de 5 dias para apresentar a documentação e o Demonstrativo de Receita e Despesa encerrou em {prazoComprovacaoStr}.
                  </Text>
                </>
              ) : (
                <>
                  <Text style={[styles.prazoBannerTitle, { color: "#F59E0B" }]}>
                    Prazo de comprovação — {diasParaPrazo} dia{diasParaPrazo !== 1 ? "s" : ""} restante{diasParaPrazo !== 1 ? "s" : ""}
                  </Text>
                  <Text style={[styles.prazoBannerBody, { color: "#FDE68A" }]}>
                    Apresente a documentação e o Demonstrativo de Receita e Despesa até {prazoComprovacaoStr} (5 dias após o fim da vigência).
                  </Text>
                </>
              )}
            </View>
          </View>
        )}

        {/* ── Visão Geral (Donut) ── */}
        <View style={[styles.overviewCard, { backgroundColor: "#1E2E50", borderColor: "rgba(255,255,255,0.07)" }]}>
          <View style={styles.overviewLeft}>
            <DonutGauge
              pct={overallPct}
              accentColor={overallPct > 0.85 ? "#EF4444" : "#FBBF24"}
            />
          </View>
          <View style={styles.overviewRight}>
            <Text style={[styles.overviewTitle, { color: colors.textMuted }]}>
              VISÃO GERAL
            </Text>
            <View style={styles.overviewStat}>
              <View style={[styles.overviewDot, { backgroundColor: "#EF4444" }]} />
              <View>
                <Text style={[styles.overviewLabel, { color: colors.textMuted }]}>Gasto</Text>
                <Text style={[styles.overviewValue, { color: colors.text }]}>
                  {formatCurrency(totalExpenses)}
                </Text>
              </View>
            </View>
            <View style={[styles.overviewDivider, { backgroundColor: "rgba(255,255,255,0.06)" }]} />
            <View style={styles.overviewStat}>
              <View style={[styles.overviewDot, { backgroundColor: colors.success }]} />
              <View>
                <Text style={[styles.overviewLabel, { color: colors.textMuted }]}>Total Sacado</Text>
                <Text style={[styles.overviewValue, { color: colors.text }]}>
                  {formatCurrency(totalWithdrawals)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Action buttons ── */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: "rgba(255,255,255,0.12)" }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/modal/saque");
            }}
            activeOpacity={0.75}
          >
            <LinearGradient
              colors={["#1E3260", "#1B294B"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionBtnInner}
            >
              <Feather name="plus-circle" size={15} color={colors.text} />
              <Text style={[styles.actionBtnText, { color: colors.text }]}>Novo Saque</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: "rgba(255,255,255,0.09)", backgroundColor: "rgba(255,255,255,0.03)" }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/modal/despesa");
            }}
            activeOpacity={0.75}
          >
            <View style={styles.actionBtnInner}>
              <Feather name="minus-circle" size={15} color={colors.textMuted} />
              <Text style={[styles.actionBtnText, { color: colors.textMuted }]}>Nova Despesa</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Despesas por Natureza ── */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Despesas por Natureza
        </Text>

        <View style={styles.naturesGrid}>
          {NATURE_CARDS.map((item) => {
            const used = expensesByNature[item.nature] ?? 0;
            const limit = poi[item.poiKey] ?? 0;
            const disp = Math.max(0, limit - used);
            const pct = limit > 0 ? Math.min(1, used / limit) : 0;

            return (
              <View
                key={item.nature}
                style={[
                  styles.natureCard,
                  {
                    backgroundColor: "#1E2E50",
                    borderColor: "rgba(255,255,255,0.07)",
                  },
                ]}
              >
                <View style={[styles.natureCardGlow, { backgroundColor: `${item.badgeColor}14` }]} />

                <View style={styles.natureCardTop}>
                  <View
                    style={[
                      styles.natureBadge,
                      { backgroundColor: item.badgeColor, shadowColor: item.badgeColor },
                    ]}
                  >
                    <Text style={styles.natureBadgeText}>{item.badge}</Text>
                  </View>
                  <Text style={[styles.natureLimitText, { color: colors.textMuted }]}>
                    {formatCurrency(limit)}
                  </Text>
                </View>

                <Text style={[styles.natureLabel, { color: colors.textMuted }]}>
                  {item.label.toUpperCase()}
                </Text>

                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${pct * 100}%` as `${number}%`,
                        backgroundColor: pct > 0.85 ? colors.destructive : item.badgeColor,
                      },
                    ]}
                  />
                </View>

                <View style={styles.natureStatRow}>
                  <Text style={[styles.natureStatUsed, { color: colors.destructive }]}>
                    {formatCurrency(used)}
                  </Text>
                  <Text
                    style={[
                      styles.natureStatDisp,
                      { color: disp > 0 ? colors.success : colors.destructive },
                    ]}
                  >
                    {formatCurrency(disp)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* ── Últimos Lançamentos ── */}
        {(() => {
          const ultimos = [...transactions]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);
          return (
            <View style={{ gap: 8 }}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Últimos Lançamentos
                </Text>
                <TouchableOpacity
                  onPress={() => router.push("/(tabs)/lancamentos")}
                  hitSlop={8}
                >
                  <Text style={[styles.seeAllText, { color: colors.gold }]}>Ver tudo</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.lancCard, { backgroundColor: "#1E2E50", borderColor: "rgba(255,255,255,0.07)" }]}>
                {ultimos.length === 0 ? (
                  <Text style={[styles.lancEmpty, { color: colors.textMuted }]}>
                    Nenhum lançamento registrado no momento.
                  </Text>
                ) : (
                  ultimos.map((tx, i) => {
                    const isExpense = tx.type === "EXPENSE";
                    const label = NATURE_LABELS[tx.nature] ?? tx.nature;
                    const accent = isExpense ? colors.destructive : colors.success;
                    const icon = isExpense ? "arrow-up-right" : "arrow-down-left";
                    const dateStr = tx.date
                      ? new Date(tx.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
                      : "—";
                    return (
                      <View key={tx.id}>
                        {i > 0 && (
                          <View style={[styles.lancDivider, { backgroundColor: "rgba(255,255,255,0.06)" }]} />
                        )}
                        <View style={styles.lancItem}>
                          <View style={[styles.lancIconWrap, { backgroundColor: `${accent}18` }]}>
                            <Feather name={icon} size={14} color={accent} />
                          </View>
                          <View style={{ flex: 1, gap: 2 }}>
                            <Text style={[styles.lancDesc, { color: colors.text }]} numberOfLines={1}>
                              {tx.description || label}
                            </Text>
                            <Text style={[styles.lancMeta, { color: colors.textMuted }]}>
                              {label} · {dateStr}
                            </Text>
                          </View>
                          <Text style={[styles.lancAmount, { color: accent }]}>
                            {isExpense ? "−" : "+"}{formatCurrency(tx.amount)}
                          </Text>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            </View>
          );
        })()}

      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 12 },

  // Header (scrolls with content)
  headerWrapper: {
    paddingBottom: 12,
    gap: 10,
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  headerCenter: { alignItems: "center", gap: 6, flex: 1 },
  logoCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  headerTitle: { fontSize: 14, fontFamily: "Inter_700Bold", letterSpacing: 0.2 },
  poiBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    alignSelf: "center",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  poiBtnText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  headerBorder: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  // Balance card
  balanceCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  balanceGlow: {
    position: "absolute",
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(251,191,36,0.07)",
  },
  balanceSmall: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  balanceAmountRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2,
  },
  balanceAmount: {
    fontSize: 36,
    fontFamily: "Inter_700Bold",
    lineHeight: 40,
  },
  balanceCents: {
    fontSize: 20,
    fontFamily: "Inter_400Regular",
    lineHeight: 32,
    opacity: 0.7,
  },
  balanceDivider: { height: 1 },
  balanceRow: { flexDirection: "row", alignItems: "center" },
  balanceStat: { flex: 1, gap: 3 },
  balanceStatRight: { paddingLeft: 12 },
  balanceStatDivider: { width: 1, height: 28, marginRight: 12 },
  balanceStatLabel: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  balanceStatValue: { fontSize: 15, fontFamily: "Inter_700Bold" },

  // Action buttons
  actionRow: { flexDirection: "row", gap: 12 },
  actionBtn: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  actionBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 14,
  },
  actionBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },

  // Overview / Donut card
  overviewCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  overviewLeft: { alignItems: "center" },
  overviewRight: { flex: 1, gap: 8 },
  overviewTitle: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  overviewStat: { flexDirection: "row", alignItems: "center", gap: 10 },
  overviewDot: { width: 8, height: 8, borderRadius: 4 },
  overviewLabel: { fontSize: 9, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.5 },
  overviewValue: { fontSize: 14, fontFamily: "Inter_700Bold" },
  overviewDivider: { height: 1 },

  // Nature section
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginTop: 4 },

  // Últimos Lançamentos
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  seeAllText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  lancCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  lancEmpty: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  lancItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  lancIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  lancDesc: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  lancMeta: { fontSize: 11, fontFamily: "Inter_400Regular" },
  lancAmount: { fontSize: 13, fontFamily: "Inter_700Bold" },
  lancDivider: { height: 1, marginHorizontal: 14 },
  naturesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  natureCard: {
    width: "47.5%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 6,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  natureCardGlow: {
    position: "absolute",
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  natureCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  natureBadge: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  natureBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#FFFFFF" },
  natureLimitText: { fontSize: 9, fontFamily: "Inter_500Medium" },
  natureLabel: {
    fontSize: 8,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  progressTrack: {
    height: 3,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 2 },
  natureStatRow: { flexDirection: "row", justifyContent: "space-between" },
  natureStatUsed: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  natureStatDisp: { fontSize: 11, fontFamily: "Inter_600SemiBold" },

  // Suprido
  supridoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  supridoText: { fontSize: 12, fontFamily: "Inter_400Regular" },

  // Dec deadline banner
  decBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(239,68,68,0.12)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.35)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  decBannerText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "#EF4444",
    flex: 1,
  },

  // POI balloon
  poiBalloonWrapper: {
    alignItems: "center",
    marginTop: 4,
  },
  poiBalloonArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderBottomWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "rgba(251,191,36,0.25)",
    alignSelf: "flex-start",
    marginLeft: 28,
  },
  poiBalloon: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "rgba(251,191,36,0.07)",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.25)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    width: "100%",
  },
  poiBalloonIcon: { fontSize: 20, lineHeight: 26 },
  poiBalloonTitle: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: "#FBBF24",
  },
  poiBalloonBody: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#C8A84B",
    lineHeight: 18,
  },
  poiBalloonCta: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#FBBF24",
    marginTop: 2,
  },

  // Prazo de comprovação banner
  prazoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  prazoBannerTitle: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
  prazoBannerBody: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
  },

  // Vigência countdown card
  vigCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  vigCardTitle: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.8,
    color: "#8BA3C7",
    textTransform: "uppercase",
  },
  vigCardLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
    color: "#6B85A8",
    textTransform: "uppercase",
  },
  vigCardInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  vigCardInfoText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    flexShrink: 1,
  },
  vigCardPeriod: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  vigDaysBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: "center",
    minWidth: 52,
  },
  vigDaysNum: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    lineHeight: 22,
  },
  vigDaysLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
});

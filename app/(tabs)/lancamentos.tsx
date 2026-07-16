import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path, Rect } from "react-native-svg";

import { TransactionCard } from "@/components/TransactionCard";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { FundTransaction, TransactionNature } from "@/types";
import { formatCurrency } from "@/utils/format";

type Filter = "ALL" | "WITHDRAWAL" | "EXPENSE";

const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: "ALL",        label: "Todos" },
  { key: "WITHDRAWAL", label: "Saques" },
  { key: "EXPENSE",    label: "Despesas" },
];

const NATURE_FILTERS: Array<{ key: TransactionNature; label: string }> = [
  { key: "PESSOA_JURIDICA",     label: "Pessoa Jurídica" },
  { key: "PESSOA_FISICA",       label: "Pessoa Física" },
  { key: "MATERIAL_CONSUMO",    label: "Mat. Consumo" },
  { key: "MATERIAL_PERMANENTE", label: "Mat. Permanente" },
  { key: "GRATIFICACAO_FONTE",  label: "Grat. Fonte" },
  { key: "DIFICIL_COMPROVACAO", label: "Difícil Comprov." },
];

// ── Status chip helpers ────────────────────────────────────────────────────────
type Chip = { label: string; color: string };

const NATURE_CHIP_MAP: Record<string, Chip> = {
  PESSOA_JURIDICA:     { label: "Pessoa Jurídica",    color: "#22C55E" },
  PESSOA_FISICA:       { label: "Pessoa Física",       color: "#3B82F6" },
  MATERIAL_CONSUMO:    { label: "Mat. Consumo",        color: "#F97316" },
  MATERIAL_PERMANENTE: { label: "Mat. Permanente",     color: "#A855F7" },
  GRATIFICACAO_FONTE:  { label: "Grat. de Fonte",      color: "#EC4899" },
  DIFICIL_COMPROVACAO: { label: "Difícil Comprov.",    color: "#F59E0B" },
};

function getChip(t: FundTransaction): Chip {
  if (t.type === "WITHDRAWAL") return { label: "Saque", color: "#60A5FA" };
  if (t.nature && NATURE_CHIP_MAP[t.nature]) return NATURE_CHIP_MAP[t.nature];
  return { label: "Despesa", color: "#6B7280" };
}

function StatusChip({ chip }: { chip: Chip }) {
  return (
    <View
      style={[
        styles.chip,
        { backgroundColor: `${chip.color}18`, borderColor: `${chip.color}35` },
      ]}
    >
      <View style={[styles.chipDot, { backgroundColor: chip.color }]} />
      <Text style={[styles.chipLabel, { color: chip.color }]}>{chip.label}</Text>
    </View>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────
function EmptyState({ isSearch }: { isSearch: boolean }) {
  const colors = useColors();
  return (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconBg, { backgroundColor: "rgba(251,191,36,0.08)", borderColor: "rgba(251,191,36,0.15)" }]}>
        <Svg width={56} height={56} viewBox="0 0 56 56">
          {/* Tray/inbox shape */}
          <Rect x="8" y="14" width="40" height="30" rx="6" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
          {isSearch ? (
            <>
              <Circle cx="26" cy="29" r="7" fill="none" stroke="#FBBF24" strokeWidth="1.5" />
              <Path d="M31 34 L36 39" stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round" />
            </>
          ) : (
            <>
              <Path d="M8 32 L18 22 L28 32 L38 22 L48 32" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <Circle cx="28" cy="37" r="6" fill="rgba(251,191,36,0.15)" />
              <Path d="M28 34 L28 40 M25 37 L31 37" stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round" />
            </>
          )}
        </Svg>
      </View>

      <Text style={[styles.emptyTitle, { color: "#FFFFFF" }]}>
        {isSearch ? "Sem resultados" : "Nenhum lançamento"}
      </Text>
      <Text style={[styles.emptySubtitle, { color: "#6B85A8" }]}>
        {isSearch
          ? "Tente outros termos de busca"
          : "Registre saques e despesas usando os botões abaixo"}
      </Text>

      {!isSearch && (
        <TouchableOpacity
          style={styles.emptyAction}
          onPress={() => router.push("/modal/despesa")}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={14} color="#0B1329" />
          <Text style={styles.emptyActionText}>Nova Despesa</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────────
export default function LancamentosScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { transactions, deleteTransaction } = useApp();

  const [filter, setFilter] = useState<Filter>("ALL");
  const [natureFilter, setNatureFilter] = useState<TransactionNature | null>(null);
  const [search, setSearch] = useState("");

  // Map withdrawal id → sequential number (chronological order, oldest first)
  const withdrawalNumberMap = useMemo(() => {
    const sorted = [...transactions]
      .filter((t) => t.type === "WITHDRAWAL")
      .sort((a, b) => a.timestamp - b.timestamp);
    const map: Record<string, number> = {};
    sorted.forEach((t, i) => { map[t.id] = i + 1; });
    return map;
  }, [transactions]);

  const handleDelete = (id: string) => {
    const target = transactions.find((t) => t.id === id);
    if (target?.type === "WITHDRAWAL") {
      const totalSacado = transactions
        .filter((t) => t.type === "WITHDRAWAL")
        .reduce((sum, t) => sum + t.amount, 0);
      const totalDespesas = transactions
        .filter((t) => t.type === "EXPENSE")
        .reduce((sum, t) => sum + t.amount, 0);
      const sacadoAposExclusao = totalSacado - target.amount;
      if (totalDespesas > sacadoAposExclusao) {
        Alert.alert(
          "Exclusão Bloqueada",
          `Remover este saque (${formatCurrency(target.amount)}) deixaria o total sacado (${formatCurrency(sacadoAposExclusao)}) menor que o total de despesas já lançadas (${formatCurrency(totalDespesas)}).\n\nExclua ou reduza despesas antes de remover este saque.`,
          [{ text: "Entendido", style: "default" }],
        );
        return;
      }
    }
    deleteTransaction(id);
  };

  const handleFilterChange = (f: Filter) => {
    setFilter(f);
    setNatureFilter(null);
  };

  const filtered = useMemo(() => {
    let list = transactions;
    if (filter !== "ALL") {
      list = list.filter((t) => t.type === filter);
    }
    if (filter === "EXPENSE" && natureFilter) {
      if (natureFilter === "PESSOA_FISICA" || natureFilter === "PESSOA_JURIDICA") {
        // PF e PJ: inclui transações diretas + aquelas que abatam nessa natureza
        list = list.filter(
          (t) => t.nature === natureFilter || t.abaterNature === natureFilter,
        );
      } else {
        // Grat. Fonte e Difícil Comprovação: filtrar pela natureza original
        list = list.filter((t) => t.nature === natureFilter);
      }
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (t) =>
          t.description?.toLowerCase().includes(q) ||
          t.beneficiary?.toLowerCase().includes(q) ||
          t.documentNumber?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [transactions, filter, natureFilter, search]);

  const totalAmount = useMemo(
    () => filtered.reduce((sum, t) => sum + t.amount, 0),
    [filtered],
  );

  const summary = useMemo(() => {
    if (natureFilter && NATURE_CHIP_MAP[natureFilter]) {
      const chip = NATURE_CHIP_MAP[natureFilter];
      return { label: chip.label, color: chip.color };
    }
    if (filter === "WITHDRAWAL") return { label: "Saques", color: "#60A5FA" };
    if (filter === "EXPENSE") return { label: "Despesas", color: colors.gold };
    return { label: "Todos os lançamentos", color: colors.gold };
  }, [filter, natureFilter, colors.gold]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: colors.navyDeep }]}>
      {/* ── Header ── */}
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 10, backgroundColor: colors.navyDeep },
        ]}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Histórico</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              {filtered.length} registro{filtered.length !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        {/* Search */}
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: "rgba(255,255,255,0.05)",
              borderColor: "rgba(255,255,255,0.1)",
            },
          ]}
        >
          <Feather name="search" size={16} color="#6B85A8" />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar por descrição ou beneficiário..."
            placeholderTextColor="#4A6080"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")} hitSlop={8}>
              <Feather name="x-circle" size={16} color="#4A6080" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter chips */}
        <View style={styles.filterRow}>
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => handleFilterChange(f.key)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: active ? colors.gold : "rgba(255,255,255,0.05)",
                    borderColor: active ? colors.gold : "rgba(255,255,255,0.1)",
                  },
                ]}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.filterLabel,
                    { color: active ? colors.navyDeep : "#6B85A8" },
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Nature submenu — visible only when Despesas is selected */}
        {filter === "EXPENSE" && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.natureRow}
            contentContainerStyle={styles.natureRowContent}
          >
            {NATURE_FILTERS.map((n) => {
              const active = natureFilter === n.key;
              return (
                <TouchableOpacity
                  key={n.key}
                  onPress={() => setNatureFilter(active ? null : n.key)}
                  style={[
                    styles.natureChip,
                    {
                      backgroundColor: active ? "rgba(251,191,36,0.15)" : "rgba(255,255,255,0.04)",
                      borderColor: active ? colors.gold : "rgba(255,255,255,0.1)",
                    },
                  ]}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.natureLabel, { color: active ? colors.gold : "#6B85A8" }]}>
                    {n.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Bottom separator */}
        <View style={[styles.headerSep, { backgroundColor: "rgba(255,255,255,0.06)" }]} />
      </View>

      {/* ── Total dos filtros aplicados ── */}
      {filter !== "ALL" && filtered.length > 0 && (
        <View style={styles.summaryWrapper}>
          <View
            style={[
              styles.summaryBar,
              {
                backgroundColor: `${summary.color}12`,
                borderColor: `${summary.color}30`,
              },
            ]}
          >
            <View style={styles.summaryLeft}>
              <View style={[styles.summaryDot, { backgroundColor: summary.color }]} />
              <Text style={[styles.summaryLabel, { color: "#8BA3C7" }]}>
                Total — {summary.label}
              </Text>
            </View>
            <Text style={[styles.summaryValue, { color: summary.color }]}>
              {formatCurrency(totalAmount)}
            </Text>
          </View>
        </View>
      )}

      {/* ── List ── */}
      <FlatList
        data={filtered}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => {
          const displayItem =
            item.type === "WITHDRAWAL" && withdrawalNumberMap[item.id] !== undefined
              ? { ...item, description: `Saque ${String(withdrawalNumberMap[item.id]).padStart(2, "0")}` }
              : item;
          return (
            <View style={styles.cardWrapper}>
              <View style={styles.chipRow}>
                <StatusChip chip={getChip(item)} />
              </View>
              <TransactionCard
                transaction={displayItem}
                onEdit={(t) =>
                  router.push({ pathname: "/modal/despesa", params: { id: t.id } })
                }
                onDelete={handleDelete}
              />
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 4 }} />}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: bottomPad + 100 },
          filtered.length === 0 && styles.listEmpty,
        ]}
        ListEmptyComponent={<EmptyState isSearch={search.length > 0} />}
        scrollEnabled
        showsVerticalScrollIndicator={false}
      />

      {/* ── FABs ── */}
      <View
        style={[
          styles.fabs,
          { bottom: (Platform.OS === "web" ? 34 : insets.bottom) + 88 },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.fabSmall,
            {
              backgroundColor: "rgba(27,41,75,0.95)",
              borderColor: "rgba(255,255,255,0.12)",
            },
          ]}
          onPress={() => router.push("/modal/saque")}
          activeOpacity={0.8}
        >
          <Feather name="plus-circle" size={16} color={colors.gold} />
          <Text style={[styles.fabLabel, { color: colors.gold }]}>Saque</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.fabPrimary, { backgroundColor: colors.gold }]}
          onPress={() => router.push("/modal/despesa")}
          activeOpacity={0.8}
        >
          <Feather name="minus-circle" size={17} color={colors.navyDeep} />
          <Text style={[styles.fabLabelDark, { color: colors.navyDeep }]}>
            Despesa
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },

  header: { paddingHorizontal: 16, paddingBottom: 0, gap: 12 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  title: { fontSize: 24, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  subtitle: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },

  filterRow: { flexDirection: "row", gap: 8 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

  natureRow: { marginHorizontal: -16 },
  natureRowContent: { paddingHorizontal: 16, gap: 8, flexDirection: "row" },
  natureChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  natureLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", whiteSpace: "nowrap" } as any,

  headerSep: { height: 1, marginTop: 4 },

  summaryWrapper: { paddingHorizontal: 16, paddingTop: 12 },
  summaryBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  summaryLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  summaryDot: { width: 7, height: 7, borderRadius: 3.5 },
  summaryLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  summaryValue: { fontSize: 15, fontFamily: "Inter_700Bold" },

  list: { paddingHorizontal: 16, paddingTop: 12 },
  listEmpty: { flexGrow: 1 },

  cardWrapper: { marginBottom: 4 },
  chipRow: { flexDirection: "row", paddingHorizontal: 4, marginBottom: 5 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  chipDot: { width: 6, height: 6, borderRadius: 3 },
  chipLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold" },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyIconBg: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold", textAlign: "center" },
  emptySubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  emptyAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FBBF24",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 8,
  },
  emptyActionText: { color: "#0B1329", fontSize: 14, fontFamily: "Inter_700Bold" },

  // FABs
  fabs: { position: "absolute", right: 16, flexDirection: "row", gap: 10 },
  fabSmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  fabPrimary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 24,
    shadowColor: "#FBBF24",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabLabel: { fontSize: 13, fontFamily: "Inter_700Bold" },
  fabLabelDark: { fontSize: 13, fontFamily: "Inter_700Bold" },
});

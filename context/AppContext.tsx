import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { DEFAULT_POI, FundTransaction, POISettings, TransactionNature } from "@/types";

interface AppContextType {
  transactions: FundTransaction[];
  poi: POISettings;
  isAuthenticated: boolean;
  isLoading: boolean;
  showTips: boolean;
  setAuthenticated: (v: boolean) => void;
  setShowTips: (v: boolean) => Promise<void>;
  addTransaction: (t: Omit<FundTransaction, "id" | "timestamp">) => Promise<void>;
  updateTransaction: (t: FundTransaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  savePOI: (poi: POISettings) => Promise<void>;
  resetApp: () => Promise<void>;
  totalWithdrawals: number;
  totalExpenses: number;
  availableBalance: number;
  expensesByNature: Record<TransactionNature, number>;
}

const AppContext = createContext<AppContextType | null>(null);

const TRANSACTIONS_KEY = "@sufex:transactions";
const POI_KEY = "@sufex:poi";
const TIPS_KEY = "@sufex:showTips";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<FundTransaction[]>([]);
  const [poi, setPoi] = useState<POISettings>(DEFAULT_POI);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showTips, setShowTipsState] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [txRaw, poiRaw, tipsRaw] = await Promise.all([
        AsyncStorage.getItem(TRANSACTIONS_KEY),
        AsyncStorage.getItem(POI_KEY),
        AsyncStorage.getItem(TIPS_KEY),
      ]);
      if (txRaw) setTransactions(JSON.parse(txRaw));
      if (poiRaw) setPoi(JSON.parse(poiRaw));
      if (tipsRaw !== null) setShowTipsState(JSON.parse(tipsRaw));
    } catch {}
    setIsLoading(false);
  };

  const saveTransactions = async (list: FundTransaction[]) => {
    await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(list));
  };

  const addTransaction = useCallback(async (t: Omit<FundTransaction, "id" | "timestamp">) => {
    const newTx: FundTransaction = {
      ...t,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
    };
    const updated = [newTx, ...transactions];
    setTransactions(updated);
    await saveTransactions(updated);
  }, [transactions]);

  const updateTransaction = useCallback(async (t: FundTransaction) => {
    const updated = transactions.map((x) => (x.id === t.id ? t : x));
    setTransactions(updated);
    await saveTransactions(updated);
  }, [transactions]);

  const deleteTransaction = useCallback(async (id: string) => {
    const updated = transactions.filter((x) => x.id !== id);
    setTransactions(updated);
    await saveTransactions(updated);
  }, [transactions]);

  const savePOI = useCallback(async (newPoi: POISettings) => {
    setPoi(newPoi);
    await AsyncStorage.setItem(POI_KEY, JSON.stringify(newPoi));
  }, []);

  const setAuthenticated = useCallback((v: boolean) => {
    setIsAuthenticated(v);
  }, []);

  const setShowTips = useCallback(async (v: boolean) => {
    setShowTipsState(v);
    await AsyncStorage.setItem(TIPS_KEY, JSON.stringify(v));
  }, []);

  const resetApp = useCallback(async () => {
    await AsyncStorage.multiRemove([TRANSACTIONS_KEY, POI_KEY]);
    setTransactions([]);
    setPoi(DEFAULT_POI);
  }, []);

  const totalWithdrawals = transactions
    .filter((t) => t.type === "WITHDRAWAL")
    .reduce((s, t) => s + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((s, t) => s + t.amount, 0);

  const availableBalance = (poi.valorSolicitado || 0) - totalWithdrawals;

  const expensesByNature = transactions
    .filter((t) => t.type === "EXPENSE" && t.nature)
    .reduce((acc, t) => {
      const key = t.nature as TransactionNature;
      // Always track under the original nature (needed for Grupo J teto check)
      acc[key] = (acc[key] || 0) + t.amount;
      // When an expense abates PF or PJ (Gratificação de Fonte / Difícil Comprovação),
      // also credit the target nature so its card reflects the correct consumed amount
      if (t.abaterNature) {
        acc[t.abaterNature] = (acc[t.abaterNature] || 0) + t.amount;
      }
      return acc;
    }, {} as Record<TransactionNature, number>);

  return (
    <AppContext.Provider
      value={{
        transactions,
        poi,
        isAuthenticated,
        isLoading,
        showTips,
        setAuthenticated,
        setShowTips,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        savePOI,
        resetApp,
        totalWithdrawals,
        totalExpenses,
        availableBalance,
        expensesByNature,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

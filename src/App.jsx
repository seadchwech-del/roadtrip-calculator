import React, { useState, useMemo, useEffect } from 'react';
import {
  Car,
  Fuel,
  Users,
  Coins,
  FileSpreadsheet,
  Printer,
  Share2,
  Check,
  Plus,
  Trash2,
  PieChart,
  ArrowRight,
  ArrowRightLeft,
  Cloud,
  Loader2,
  Calendar,
  Wallet,
  ShieldCheck
} from 'lucide-react';

const CATEGORIES = [
  { id: 'car', label: '租車保險', color: 'bg-blue-500', barColor: 'bg-blue-500' },
  { id: 'fuel', label: '行車加油', color: 'bg-amber-500', barColor: 'bg-amber-500' },
  { id: 'toll_park', label: '過路停車', color: 'bg-orange-400', barColor: 'bg-orange-400' },
  { id: 'stay', label: '住宿飯店', color: 'bg-emerald-500', barColor: 'bg-emerald-500' },
  { id: 'food', label: '餐飲美食', color: 'bg-rose-500', barColor: 'bg-rose-500' },
  { id: 'ticket', label: '景點體驗', color: 'bg-purple-500', barColor: 'bg-purple-500' },
  { id: 'misc', label: '其他雜支', color: 'bg-slate-400', barColor: 'bg-slate-400' }
];

const STORAGE_KEY = 'roadtrip_unified_split_v3';

// SEC-01 資安加固：CSV 公式注入過濾函式 (防範 CWE-1236 / DDE 執行攻擊)
const sanitizeCSVCell = (val) => {
  if (val === null || val === undefined) return '""';
  let str = String(val).trim();
  // 若開頭為 =, +, -, @, \t, \r，強制在前方加上單引號避免 Excel 視為公式執行
  if (/^[=+\-@\t\r]/.test(str)) {
    str = "'" + str;
  }
  return `"${str.replace(/"/g, '""')}"`;
};

export default function App() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [copied, setCopied] = useState(false);
  const [validationError, setValidationError] = useState('');

  // 1. 行程基本設定
  const [tripName, setTripName] = useState('沖繩自駕環島 4 天 3 夜');
  const [days, setDays] = useState(4);
  const [currency, setCurrency] = useState('JPY'); // 預設主要輸入幣別
  const [exchangeRate, setExchangeRate] = useState(0.215); // 1 JPY = 0.215 TWD

  // 2. 旅伴管理
  const [members, setMembers] = useState(['Alex', 'Bob', 'Carol', 'David']);
  const [newMemberName, setNewMemberName] = useState('');

  // 3. 車輛與行車油資專屬計算機
  const [fuelCalc, setFuelCalc] = useState({
    distanceKm: 280,
    fuelEfficiency: 16.5,
    fuelPrice: 175,
    currency: 'JPY',
    driver: 'Alex'
  });

  // 4. 費用流水帳
  const [expenses, setExpenses] = useState([
    {
      id: 'e1',
      title: 'OTS 租車費用含安心全險 CDW/NOC',
      payer: 'Alex',
      amount: 36000,
      currency: 'JPY',
      category: 'car',
      splitWith: ['Alex', 'Bob', 'Carol', 'David'],
      date: 'Day 1'
    },
    {
      id: 'e2',
      title: '第一晚居酒屋聚餐',
      payer: 'Bob',
      amount: 14500,
      currency: 'JPY',
      category: 'food',
      splitWith: ['Alex', 'Bob', 'Carol', 'David'],
      date: 'Day 1'
    },
    {
      id: 'e3',
      title: '那霸機場高速公路通行費 (ETC)',
      payer: 'Alex',
      amount: 1420,
      currency: 'JPY',
      category: 'toll_park',
      splitWith: ['Alex', 'Bob', 'Carol', 'David'],
      date: 'Day 2'
    },
    {
      id: 'e4',
      title: '行前共同旅遊保險',
      payer: 'Carol',
      amount: 2400,
      currency: 'TWD',
      category: 'misc',
      splitWith: ['Alex', 'Bob', 'Carol', 'David'],
      date: '行前'
    }
  ]);

  // 新增費用輸入暫存
  const [newExpense, setNewExpense] = useState({
    title: '',
    payer: 'Alex',
    amount: '',
    currency: 'JPY',
    category: 'food',
    splitWith: ['Alex', 'Bob', 'Carol', 'David'],
    date: 'Day 1'
  });

  // SEC-04 資安加固：LocalStorage 防禦性讀取與結構驗證
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (typeof data.tripName === 'string') {
          setTripName(data.tripName.slice(0, 100));
        }
        if (typeof data.days === 'number' && data.days >= 1 && data.days <= 100) {
          setDays(data.days);
        }
        if (typeof data.currency === 'string' && ['JPY', 'TWD'].includes(data.currency)) {
          setCurrency(data.currency);
        }
        if (typeof data.exchangeRate === 'number' && data.exchangeRate > 0.0001 && data.exchangeRate < 1000) {
          setExchangeRate(data.exchangeRate);
        }
        if (data.fuelCalc && typeof data.fuelCalc === 'object') {
          setFuelCalc({
            distanceKm: Math.min(Math.max(0, Number(data.fuelCalc.distanceKm) || 0), 100000),
            fuelEfficiency: Math.min(Math.max(0.1, Number(data.fuelCalc.fuelEfficiency) || 16.5), 200),
            fuelPrice: Math.min(Math.max(0, Number(data.fuelCalc.fuelPrice) || 0), 10000),
            currency: ['JPY', 'TWD'].includes(data.fuelCalc.currency) ? data.fuelCalc.currency : 'JPY',
            driver: typeof data.fuelCalc.driver === 'string' ? data.fuelCalc.driver.slice(0, 30) : 'Alex'
          });
        }
        if (Array.isArray(data.members) && data.members.every((m) => typeof m === 'string')) {
          const cleanMembers = data.members.map((m) => m.slice(0, 30)).filter(Boolean).slice(0, 20);
          if (cleanMembers.length > 0) {
            setMembers(cleanMembers);
            setNewExpense((prev) => ({
              ...prev,
              payer: cleanMembers[0],
              splitWith: cleanMembers
            }));
          }
        }
        if (Array.isArray(data.expenses)) {
          const cleanExpenses = data.expenses
            .filter(
              (exp) =>
                exp &&
                typeof exp.title === 'string' &&
                typeof exp.amount === 'number' &&
                exp.amount > 0 &&
                exp.amount <= 100000000
            )
            .map((exp) => ({
              ...exp,
              title: exp.title.slice(0, 80),
              payer: String(exp.payer || '').slice(0, 30),
              date: String(exp.date || '').slice(0, 20),
              currency: ['JPY', 'TWD'].includes(exp.currency) ? exp.currency : 'JPY',
              splitWith: Array.isArray(exp.splitWith) ? exp.splitWith.map((s) => String(s).slice(0, 30)) : []
            }))
            .slice(0, 500);
          setExpenses(cleanExpenses);
        }
      }
    } catch (e) {
      console.warn('LocalStorage 結構有誤或已遭篡改，重置為預設狀態:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // 自動防抖儲存至 LocalStorage
  useEffect(() => {
    if (!isLoaded) return;
    setIsSaving(true);
    const timer = setTimeout(() => {
      try {
        const stateToSave = {
          tripName,
          days,
          currency,
          exchangeRate,
          members,
          fuelCalc,
          expenses
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
        setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } catch (e) {
        console.error('LocalStorage 儲存失敗:', e);
      } finally {
        setIsSaving(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [isLoaded, tripName, days, currency, exchangeRate, members, fuelCalc, expenses]);

  // SEC-02 資安加固：匯率輸入邊界控制
  const handleExchangeRateChange = (val) => {
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0.0001 && num < 1000) {
      setExchangeRate(Number(num.toFixed(4)));
    }
  };

  // 1. 車輛油資即時試算 (加入零與無效值防呆)
  const fuelResult = useMemo(() => {
    const km = Math.max(0, Math.min(100000, Number(fuelCalc.distanceKm) || 0));
    const eff = Number(fuelCalc.fuelEfficiency) > 0.1 ? Number(fuelCalc.fuelEfficiency) : 1;
    const price = Math.max(0, Math.min(10000, Number(fuelCalc.fuelPrice) || 0));
    const liters = km / eff;
    const totalCost = Math.round(liters * price);
    return {
      liters: liters.toFixed(1),
      totalCost
    };
  }, [fuelCalc]);

  // 2. 多人收支平衡與最佳化轉帳演算法 (全部統一新台幣 TWD 結算)
  const stats = useMemo(() => {
    const rate = Number(exchangeRate) > 0.0001 && Number(exchangeRate) < 1000 ? Number(exchangeRate) : 0.215;

    const toTwd = (amount, cur) => {
      const num = Number(amount) || 0;
      return cur === 'JPY' ? Math.round(num * rate) : Math.round(num);
    };

    let totalTwd = 0;
    const categoryTotals = {};
    CATEGORIES.forEach((c) => {
      categoryTotals[c.id] = 0;
    });

    const memberMap = {};
    members.forEach((m) => {
      memberMap[m] = { paidTwd: 0, owedTwd: 0, netTwd: 0 };
    });

    expenses.forEach((item) => {
      const twd = toTwd(item.amount, item.currency);
      totalTwd += twd;

      // 分類加總
      if (categoryTotals[item.category] !== undefined) {
        categoryTotals[item.category] += twd;
      } else {
        categoryTotals['misc'] += twd;
      }

      // 墊付者加記
      if (memberMap[item.payer]) {
        memberMap[item.payer].paidTwd += twd;
      }

      // 分攤對象分帳
      const targets = item.splitWith && item.splitWith.length > 0 ? item.splitWith : members;
      const share = targets.length > 0 ? twd / targets.length : 0;
      targets.forEach((tm) => {
        if (memberMap[tm]) {
          memberMap[tm].owedTwd += share;
        }
      });
    });

    // 計算收支淨值
    members.forEach((m) => {
      memberMap[m].netTwd = Math.round(memberMap[m].paidTwd - memberMap[m].owedTwd);
    });

    // 最佳化轉帳平帳演算法 (Greedy Debt Simplification)
    const debtors = [];
    const creditors = [];
    members.forEach((m) => {
      const net = memberMap[m].netTwd;
      if (net < -1) debtors.push({ name: m, amount: -net });
      else if (net > 1) creditors.push({ name: m, amount: net });
    });

    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const settlements = [];
    let i = 0;
    let j = 0;
    while (i < debtors.length && j < creditors.length) {
      const debt = debtors[i].amount;
      const credit = creditors[j].amount;
      const settleAmount = Math.min(debt, credit);
      if (settleAmount > 0) {
        settlements.push({
          from: debtors[i].name,
          to: creditors[j].name,
          amountTwd: Math.round(settleAmount),
          amountJpy: Math.round(settleAmount / rate)
        });
      }
      debtors[i].amount -= settleAmount;
      creditors[j].amount -= settleAmount;
      if (debtors[i].amount <= 1) i++;
      if (creditors[j].amount <= 1) j++;
    }

    // 分類圖表條資料
    const categoryBreakdown = CATEGORIES.map((cat) => ({
      ...cat,
      amountTwd: categoryTotals[cat.id] || 0,
      percentage: totalTwd > 0 ? (((categoryTotals[cat.id] || 0) / totalTwd) * 100).toFixed(1) : 0
    })).filter((c) => c.amountTwd > 0);

    const perPersonTwd = members.length > 0 ? Math.round(totalTwd / members.length) : 0;
    const perPersonDailyTwd = days > 0 ? Math.round(perPersonTwd / days) : perPersonTwd;

    return {
      toTwd,
      totalTwd,
      perPersonTwd,
      perPersonDailyTwd,
      memberMap,
      settlements,
      categoryBreakdown
    };
  }, [expenses, members, exchangeRate, days]);

  // 一鍵將「總油資」加入記帳流水帳
  const handleAddFuelToExpenses = () => {
    if (fuelResult.totalCost <= 0) return;
    const newFuelItem = {
      id: Date.now().toString(),
      title: `自駕行車油資 (${fuelCalc.distanceKm} km / ${fuelResult.liters} L)`,
      payer: fuelCalc.driver,
      amount: fuelResult.totalCost,
      currency: fuelCalc.currency,
      category: 'fuel',
      splitWith: members,
      date: '全趟油資'
    };
    setExpenses([newFuelItem, ...expenses]);
  };

  // SEC-02 資安加固：旅伴輸入防呆（字數限制 30 字、重複檢查、最多 20 人）
  const handleAddMember = (e) => {
    e.preventDefault();
    const name = newMemberName.trim().slice(0, 30);
    if (!name) return;
    if (members.length >= 20) {
      alert('旅伴人數上限為 20 人');
      return;
    }
    if (members.includes(name)) {
      alert('該旅伴名稱已存在');
      return;
    }
    const updated = [...members, name];
    setMembers(updated);
    setNewMemberName('');
    setNewExpense((prev) => ({ ...prev, splitWith: updated }));
  };

  // 刪除旅伴
  const handleDeleteMember = (name) => {
    if (members.length <= 1) {
      alert('至少需保留一名旅伴');
      return;
    }
    const updated = members.filter((m) => m !== name);
    setMembers(updated);
    if (fuelCalc.driver === name) {
      setFuelCalc({ ...fuelCalc, driver: updated[0] || '' });
    }
    setExpenses(
      expenses.map((exp) => ({
        ...exp,
        payer: exp.payer === name ? updated[0] || '未知' : exp.payer,
        splitWith: exp.splitWith.filter((m) => m !== name)
      }))
    );
  };

  // SEC-02 資安加固：一般支出送出時的數值與邊界強制驗證
  const handleAddExpense = (e) => {
    e.preventDefault();
    setValidationError('');

    const cleanTitle = newExpense.title.trim().slice(0, 80);
    if (!cleanTitle) {
      setValidationError('請輸入費用項目名稱');
      return;
    }

    const amt = Number(newExpense.amount);
    if (isNaN(amt) || amt <= 0 || amt > 100000000) {
      setValidationError('消費金額必須介於 1 至 100,000,000 之間');
      return;
    }

    if (!newExpense.splitWith || newExpense.splitWith.length === 0) {
      setValidationError('請至少選擇一位分攤費用的對象');
      return;
    }

    if (expenses.length >= 500) {
      alert('費用筆數已達上限 (500 筆)');
      return;
    }

    setExpenses([
      {
        ...newExpense,
        title: cleanTitle,
        date: (newExpense.date || '記帳').trim().slice(0, 20),
        id: Date.now().toString(),
        amount: Math.round(amt)
      },
      ...expenses
    ]);

    setNewExpense({
      ...newExpense,
      title: '',
      amount: '',
      splitWith: members
    });
  };

  const handleDeleteExpense = (id) => {
    setExpenses(expenses.filter((item) => item.id !== id));
  };

  const toggleSplitMember = (member) => {
    const curr = newExpense.splitWith;
    if (curr.includes(member)) {
      if (curr.length === 1) return;
      setNewExpense({ ...newExpense, splitWith: curr.filter((m) => m !== member) });
    } else {
      setNewExpense({ ...newExpense, splitWith: [...curr, member] });
    }
  };

  // SEC-01 資安加固：CSV 匯出使用全面消毒邏輯
  const handleExportCSV = () => {
    const headers = [
      '項目編號',
      '日期/行程',
      '費用類別',
      '支出項目說明',
      '墊付人',
      '原幣別',
      '原幣金額',
      '統一換算台幣 (TWD)',
      '分攤人數',
      '分攤對象清單'
    ];

    const rows = expenses.map((exp, idx) => {
      const twd = stats.toTwd(exp.amount, exp.currency);
      const catObj = CATEGORIES.find((c) => c.id === exp.category);
      return [
        idx + 1,
        sanitizeCSVCell(exp.date || ''),
        sanitizeCSVCell(catObj ? catObj.label : '其他'),
        sanitizeCSVCell(exp.title),
        sanitizeCSVCell(exp.payer),
        sanitizeCSVCell(exp.currency),
        Number(exp.amount) || 0,
        twd,
        exp.splitWith.length,
        sanitizeCSVCell(exp.splitWith.join('、'))
      ];
    });

    rows.push([]);
    rows.push([sanitizeCSVCell('--- 最終最佳結清轉帳方案 (新台幣 TWD) ---')]);
    stats.settlements.forEach((s) => {
      rows.push([
        sanitizeCSVCell(`${s.from} 應轉帳給 ${s.to}`),
        sanitizeCSVCell(`NT$ ${s.amountTwd.toLocaleString()}`),
        sanitizeCSVCell(`(約 ¥ ${s.amountJpy.toLocaleString()})`)
      ]);
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const safeTripFileName = tripName.replace(/[\\/:*?"<>|]/g, '_').slice(0, 30);
    link.setAttribute('download', `${safeTripFileName}_自駕旅費結算報表.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const handleCopySummary = () => {
    let text = `🚗【${tripName}】自駕旅費結算摘要\n`;
    text += `👥 同行旅伴：${members.join('、')} (${days} 天 / 共 ${members.length} 人)\n`;
    text += `💱 匯率基準：1 JPY ≈ ${exchangeRate} TWD\n`;
    text += `💰 總花費：NT$ ${stats.totalTwd.toLocaleString()} (每人平均 NT$ ${stats.perPersonTwd.toLocaleString()})\n\n`;
    text += `💳【最終平帳轉帳清單】\n`;
    if (stats.settlements.length === 0) {
      text += `✨ 目前所有帳務已完全平帳，大家互不相欠！\n`;
    } else {
      stats.settlements.forEach((s, idx) => {
        text += `${idx + 1}. ${s.from} ➡️ 轉給 ${s.to}：NT$ ${s.amountTwd.toLocaleString()} (約 ¥ ${s.amountJpy.toLocaleString()})\n`;
      });
    }

    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
    document.body.removeChild(textArea);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased font-sans">
      {/* 列印樣式設定 */}
      <style>{`
        @media print {
          header, .no-print {
            display: none !important;
          }
          body {
            background: white !important;
            color: black !important;
          }
          .print-full {
            width: 100% !important;
            box-shadow: none !important;
            border: 1px solid #e2e8f0 !important;
          }
        }
      `}</style>

      {/* 頂部導覽列 */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-base sm:text-lg text-slate-900 leading-tight">自駕旅行拆帳神器</h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-700 rounded-md">
                  <ShieldCheck className="w-3 h-3" /> 資安加固版
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Road Trip Splitwise & Gas Calculator</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* 存檔狀態 */}
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                  <span className="font-medium text-slate-700">儲存中...</span>
                </>
              ) : (
                <>
                  <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-medium text-slate-700">
                    {lastSavedTime ? `已存檔 (${lastSavedTime})` : '自動存檔就緒'}
                  </span>
                </>
              )}
            </div>

            {/* 匯出按鈕組 */}
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 transition-colors"
              title="匯出經過公式注入過濾的 Excel CSV 報表"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span className="hidden md:inline">匯出 Excel</span>
            </button>

            <button
              onClick={handlePrintPDF}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 transition-colors"
              title="列印或儲存為 PDF"
            >
              <Printer className="w-4 h-4 text-blue-600" />
              <span className="hidden md:inline">列印 PDF</span>
            </button>

            <button
              onClick={handleCopySummary}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              <span>{copied ? '已複製' : '分享結算'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 行程名稱與雙幣別匯率設定列 */}
        <div className="no-print mb-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 rounded-2xl text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <input
                type="text"
                maxLength={80}
                value={tripName}
                onChange={(e) => setTripName(e.target.value.slice(0, 80))}
                className="bg-transparent font-bold text-lg sm:text-xl text-white border-b border-white/20 focus:border-amber-400 focus:outline-none px-1 py-0.5 w-full max-w-md"
                placeholder="行程名稱 (例：沖繩自駕 4 天 3 夜)"
              />
            </div>
            <div className="flex items-center gap-3 text-xs text-indigo-200">
              <span>旅遊天數：</span>
              <div className="inline-flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-md">
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={days}
                  onChange={(e) => setDays(Math.min(90, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-10 bg-transparent text-white font-bold text-center focus:outline-none"
                />
                <span className="text-slate-300">天</span>
              </div>
              <span className="text-slate-500">|</span>
              <span>統一以新台幣 (TWD) 自動清算</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-start md:justify-end">
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/15 text-xs">
              <Coins className="w-3.5 h-3.5 text-amber-300" />
              <span className="text-slate-200 font-medium">匯率基準：1 JPY =</span>
              <input
                type="number"
                step="0.001"
                min="0.001"
                max="1000"
                value={exchangeRate}
                onChange={(e) => handleExchangeRateChange(e.target.value)}
                className="w-20 px-1.5 py-0.5 bg-white/20 text-white rounded font-mono font-bold text-center focus:outline-none focus:ring-1 focus:ring-amber-300"
              />
              <span className="text-slate-200 font-medium">TWD</span>
            </div>
          </div>
        </div>

        {/* 旅伴管理列 */}
        <section className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm mb-6 print-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <h2 className="font-semibold text-slate-800 text-sm sm:text-base">同行旅伴管理 ({members.length}/20 人)</h2>
            </div>
            <span className="text-xs text-slate-400">點擊標籤旁的 × 可移除旅伴</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {members.map((m) => (
              <span
                key={m}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100"
              >
                <span>{m}</span>
                {members.length > 1 && (
                  <button
                    onClick={() => handleDeleteMember(m)}
                    className="no-print text-indigo-400 hover:text-rose-600 p-0.5 transition-colors text-sm leading-none"
                    title="刪除旅伴"
                  >
                    ×
                  </button>
                )}
              </span>
            ))}

            {/* 新增成員輸入框 */}
            <form onSubmit={handleAddMember} className="no-print flex items-center gap-1.5 ml-1">
              <input
                type="text"
                maxLength={30}
                placeholder="新增旅伴姓名"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                className="px-3 py-1 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-32"
              />
              <button
                type="submit"
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-0.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>加入</span>
              </button>
            </form>
          </div>
        </section>

        {/* 主版面：左側輸入表單 + 右側即時彙整 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ======================= 左側：車輛油資計算器 + 支出流水帳 ======================= */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. 車輛與油資專區 */}
            <section className="no-print bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Fuel className="w-4 h-4 text-amber-500" />
                  <h2 className="font-semibold text-slate-800 text-sm sm:text-base">車輛行車與油資專區</h2>
                </div>
                <span className="text-xs text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-md">
                  油耗自動換算
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">預估/實際里程</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100000"
                      value={fuelCalc.distanceKm}
                      onChange={(e) =>
                        setFuelCalc({
                          ...fuelCalc,
                          distanceKm: Math.min(100000, Math.max(0, Number(e.target.value) || 0))
                        })
                      }
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <span className="absolute right-2.5 top-1.5 text-xs text-slate-400">km</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">平均油耗表現</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="100"
                      value={fuelCalc.fuelEfficiency}
                      onChange={(e) =>
                        setFuelCalc({
                          ...fuelCalc,
                          fuelEfficiency: Math.min(100, Math.max(0.1, Number(e.target.value) || 0.1))
                        })
                      }
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <span className="absolute right-2.5 top-1.5 text-xs text-slate-400">km/L</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">每公升油價</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="1000"
                      value={fuelCalc.fuelPrice}
                      onChange={(e) =>
                        setFuelCalc({
                          ...fuelCalc,
                          fuelPrice: Math.min(1000, Math.max(0, Number(e.target.value) || 0))
                        })
                      }
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <span className="absolute right-2.5 top-1.5 text-xs text-slate-400">
                      {fuelCalc.currency === 'JPY' ? '円/L' : '元/L'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">計價幣別</label>
                  <select
                    value={fuelCalc.currency}
                    onChange={(e) => setFuelCalc({ ...fuelCalc, currency: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="JPY">🇯🇵 日圓 (JPY ¥)</option>
                    <option value="TWD">🇹🇼 台幣 (TWD NT$)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">駕駛者 (預設誰先墊付)</label>
                  <select
                    value={fuelCalc.driver}
                    onChange={(e) => setFuelCalc({ ...fuelCalc, driver: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-medium"
                  >
                    {members.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 油資試算結果與一鍵加入按鈕 */}
              <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs text-amber-800">
                    預估消耗 <strong>{fuelResult.liters}</strong> 公升油料
                  </div>
                  <div className="text-base font-black text-amber-950 flex items-baseline gap-1.5">
                    <span>總油資約：</span>
                    <span className="font-mono">
                      {fuelCalc.currency === 'JPY' ? '¥' : 'NT$'} {fuelResult.totalCost.toLocaleString()}
                    </span>
                    <span className="text-xs font-normal text-amber-700">
                      (約 NT$ {stats.toTwd(fuelResult.totalCost, fuelCalc.currency).toLocaleString()})
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddFuelToExpenses}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>將油資加入記帳 (由 {fuelCalc.driver} 墊付)</span>
                </button>
              </div>
            </section>

            {/* 2. 新增費用支出表單 */}
            <section className="no-print bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
                <Wallet className="w-4 h-4 text-indigo-600" />
                <h2 className="font-semibold text-slate-800 text-sm sm:text-base">新增費用支出</h2>
              </div>

              {validationError && (
                <div className="p-2.5 mb-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-600 font-medium">
                  ⚠️ {validationError}
                </div>
              )}

              <form onSubmit={handleAddExpense} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 mb-1">費用說明 / 項目名稱</label>
                    <input
                      type="text"
                      required
                      maxLength={80}
                      placeholder="例：居酒屋晚餐、名護租車費、水族館門票"
                      value={newExpense.title}
                      onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">消費時點 / 天數</label>
                    <input
                      type="text"
                      maxLength={20}
                      placeholder="例：Day 1、Day 2、行前"
                      value={newExpense.date}
                      onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">費用類別</label>
                    <select
                      value={newExpense.category}
                      onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">付款幣別</label>
                    <select
                      value={newExpense.currency}
                      onChange={(e) => setNewExpense({ ...newExpense, currency: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-bold text-slate-700"
                    >
                      <option value="JPY">🇯🇵 日圓 (JPY ¥)</option>
                      <option value="TWD">🇹🇼 台幣 (TWD NT$)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">實際花費金額</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-slate-400 font-bold">
                        {newExpense.currency === 'JPY' ? '¥' : 'NT$'}
                      </span>
                      <input
                        type="number"
                        required
                        min="1"
                        max="100000000"
                        placeholder="金額"
                        value={newExpense.amount}
                        onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                        className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">由誰先墊付？</label>
                  <select
                    value={newExpense.payer}
                    onChange={(e) => setNewExpense({ ...newExpense, payer: e.target.value })}
                    className="w-full sm:w-1/2 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-bold text-indigo-700"
                  >
                    {members.map((m) => (
                      <option key={m} value={m}>
                        {m} 墊付
                      </option>
                    ))}
                  </select>
                </div>

                {/* 分攤對象選擇 */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-500">
                      分攤對象 ({newExpense.splitWith.length} 人均分)
                    </label>
                    <button
                      type="button"
                      onClick={() => setNewExpense({ ...newExpense, splitWith: members })}
                      className="text-[11px] text-indigo-600 hover:underline"
                    >
                      全部人均攤
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {members.map((m) => {
                      const isSelected = newExpense.splitWith.includes(m);
                      return (
                        <button
                          type="button"
                          key={m}
                          onClick={() => toggleSplitMember(m)}
                          className={`px-3 py-1 rounded-xl text-xs font-medium transition-all border ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '} {m}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>記錄此筆費用</span>
                </button>
              </form>
            </section>

            {/* 3. 支出紀錄明細流水帳 */}
            <section className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm print-full">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <h2 className="font-semibold text-slate-800 text-sm sm:text-base">
                    費用支出流水帳 ({expenses.length} 筆)
                  </h2>
                </div>
                <span className="text-xs text-slate-400">所有外幣自動換算為新台幣</span>
              </div>

              {expenses.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  目前尚未記錄任何支出，請利用上方表單或油資專區登記費用！
                </div>
              ) : (
                <div className="space-y-2.5">
                  {expenses.map((exp) => {
                    const twdVal = stats.toTwd(exp.amount, exp.currency);
                    const catObj = CATEGORIES.find((c) => c.id === exp.category) || CATEGORIES[6];
                    const isAll = exp.splitWith.length === members.length;

                    return (
                      <div
                        key={exp.id}
                        className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white transition-all text-xs flex items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-200 text-slate-700">
                              {exp.date || '記帳'}
                            </span>
                            <span className={`px-2 py-0.5 rounded font-bold text-[10px] text-white ${catObj.color}`}>
                              {catObj.label}
                            </span>
                            <span className="font-bold text-slate-900 text-sm">{exp.title}</span>
                          </div>
                          <div className="text-slate-500 text-[11px] flex flex-wrap items-center gap-2">
                            <span>
                              由 <strong className="text-indigo-600">{exp.payer}</strong> 墊付
                            </span>
                            <span>•</span>
                            <span>分攤：{isAll ? '所有人均攤' : exp.splitWith.join('、')}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-right shrink-0">
                          <div>
                            <div className="font-mono font-bold text-sm text-slate-900">
                              {exp.currency === 'JPY' ? '¥' : 'NT$'} {exp.amount.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-emerald-600 font-mono">
                              ≈ NT$ {twdVal.toLocaleString()}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteExpense(exp.id)}
                            className="no-print text-slate-300 hover:text-rose-500 p-1 rounded-lg transition-colors"
                            title="刪除此筆記帳"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* ======================= 右側：即時儀表板與結算 (Sticky) ======================= */}
          <div className="lg:col-span-5 lg:sticky lg:top-20 space-y-6">
            {/* 總開銷與人均大看板 */}
            <div className="bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl shadow-indigo-950/20 relative overflow-hidden print-full">
              <div className="relative z-10">
                <div className="flex items-center justify-between text-indigo-200 text-xs mb-1">
                  <span>全趟旅程總支出 (已統一換算)</span>
                  <span className="bg-white/10 px-2.5 py-0.5 rounded-full text-indigo-200 font-medium text-[11px]">
                    {days} 天 • 全體 {members.length} 人
                  </span>
                </div>

                <div className="flex items-baseline gap-1.5 mb-3">
                  <span className="text-sm text-indigo-300 font-mono font-bold">NT$</span>
                  <span className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                    {stats.totalTwd.toLocaleString()}
                  </span>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 flex items-center justify-between mb-4">
                  <div>
                    <div className="text-[11px] text-indigo-200 font-medium flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-indigo-300" /> 每人平均總開銷
                    </div>
                    <div className="text-2xl font-bold text-white mt-0.5">
                      NT$ {stats.perPersonTwd.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right border-l border-white/10 pl-4">
                    <div className="text-[10px] text-slate-400">平均每日/每人</div>
                    <div className="text-sm font-semibold text-emerald-300 mt-0.5">
                      NT$ {stats.perPersonDailyTwd.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* 轉帳結清指示 (核心亮點) */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <div className="text-xs font-semibold text-indigo-200 flex items-center gap-1.5">
                    <ArrowRightLeft className="w-3.5 h-3.5 text-amber-300" />
                    <span>最終結清轉帳建議 (最少筆數)：</span>
                  </div>

                  {stats.settlements.length === 0 ? (
                    <div className="bg-white/10 p-3 rounded-xl text-center text-xs text-emerald-300 font-medium">
                      🎉 目前所有旅伴費用已完全打平，無需額外轉帳！
                    </div>
                  ) : (
                    stats.settlements.map((s, idx) => (
                      <div
                        key={idx}
                        className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-rose-300">{s.from}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className="font-bold text-emerald-300">{s.to}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black text-amber-300 font-mono">
                            NT$ {s.amountTwd.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-slate-300 font-mono">
                            (約 ¥ {s.amountJpy.toLocaleString()})
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* 各類費用佔比與分佈 */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm print-full">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-semibold text-slate-800 text-sm">各類別費用佔比 (TWD)</h3>
                </div>
              </div>

              <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex mb-4">
                {stats.categoryBreakdown.map((cat, idx) => (
                  <div
                    key={idx}
                    style={{ width: `${cat.percentage}%` }}
                    className={`${cat.barColor} h-full transition-all duration-300`}
                  />
                ))}
              </div>

              <div className="space-y-2">
                {stats.categoryBreakdown.map((cat, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${cat.color}`} />
                      <span className="text-slate-600 font-medium">{cat.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 text-[10px]">{cat.percentage}%</span>
                      <span className="font-semibold text-slate-800 font-mono">
                        NT$ {cat.amountTwd.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 旅伴收支結餘表 */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm print-full">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-semibold text-slate-800 text-sm">旅伴收支結餘清單</h3>
                </div>
              </div>

              <div className="space-y-2.5">
                {members.map((m) => {
                  const stat = stats.memberMap[m] || { paidTwd: 0, owedTwd: 0, netTwd: 0 };
                  const isPlus = stat.netTwd > 0;
                  const isMinus = stat.netTwd < 0;

                  return (
                    <div key={m} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-900 text-sm">{m}</span>
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded-md text-xs ${
                            isPlus
                              ? 'bg-emerald-100 text-emerald-700'
                              : isMinus
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {isPlus
                            ? `應收 NT$ ${stat.netTwd.toLocaleString()}`
                            : isMinus
                            ? `應付 NT$ ${Math.abs(stat.netTwd).toLocaleString()}`
                            : '已結清'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 pt-1 border-t border-slate-200/50">
                        <div>已墊付：NT$ {stat.paidTwd.toLocaleString()}</div>
                        <div className="text-right">應分攤：NT$ {Math.round(stat.owedTwd).toLocaleString()}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

import React, { useState, useMemo, useEffect } from 'react';
import {
  Car,
  Fuel,
  Users,
  Calendar,
  DollarSign,
  MapPin,
  Plus,
  Trash2,
  PieChart,
  Navigation,
  Clock,
  Sparkles,
  Receipt,
  Hotel,
  Utensils,
  Ticket,
  Share2,
  Check,
  Coins,
  ArrowRightLeft,
  Cloud,
  Loader2,
  FileSpreadsheet,
  Printer,
  CreditCard,
  UserCheck,
  ArrowRight,
  Split,
  ChevronDown
} from 'lucide-react';

// 預設自駕行程範本
const PRESETS = [
  {
    name: '【日本】沖繩悠閒環島 4 天 3 夜',
    destination: '日本沖繩 (那霸 - 名護 - 古宇利島)',
    days: 4,
    passengers: 4,
    currency: 'JPY',
    isRental: true,
    rentalCost: 36000,
    distanceKm: 280,
    fuelEfficiency: 16.5,
    fuelPrice: 175,
    tollCost: 2600,
    parkingCost: 3500,
    accommodation: 64000,
    food: 42000,
    ticket: 14000,
    misc: 8000,
    members: ['Alex', 'Bob', 'Carol', 'David'],
    itinerary: [
      { id: '1', day: 1, time: '11:30', spot: '那霸機場 OTS 取車', note: '確認安心險 CDW/NOC', category: 'drive' },
      { id: '2', day: 1, time: '14:00', spot: '瀨長島 Umikaji Terrace', note: '吃鬆餅看海景飛機起降', category: 'food' },
      { id: '3', day: 2, time: '10:30', spot: '美麗海水族館', note: '黑潮之海鯨鯊餵食秀', category: 'spot' },
      { id: '4', day: 2, time: '15:30', spot: '古宇利大橋 & 心形岩', note: '跨海兜風與拍照', category: 'spot' },
      { id: '5', day: 3, time: '12:00', spot: '美國村 (American Village)', note: '海濱漫步與特色漢堡', category: 'spot' },
      { id: '6', day: 4, time: '14:00', spot: '那霸市區加油還車', note: '保留滿油發票給租車公司檢查', category: 'drive' }
    ]
  },
  {
    name: '【日本】北海道道央富良野 5 天 4 夜',
    destination: '日本北海道 (新千歲 - 札幌 - 富良野 - 美瑛)',
    days: 5,
    passengers: 4,
    currency: 'JPY',
    isRental: true,
    rentalCost: 52000,
    distanceKm: 560,
    fuelEfficiency: 14.0,
    fuelPrice: 175,
    tollCost: 7800,
    parkingCost: 2500,
    accommodation: 98000,
    food: 68000,
    ticket: 12000,
    misc: 10000,
    members: ['Alex', 'Bob', 'Carol', 'David'],
    itinerary: [
      { id: '1', day: 1, time: '13:00', spot: '新千歲機場租車出發', note: '確認租借 HEP 高速周遊券', category: 'drive' },
      { id: '2', day: 2, time: '10:00', spot: '富田農場 & 四季彩之丘', note: '薰衣草花田與哈密瓜冰淇淋', category: 'spot' },
      { id: '3', day: 3, time: '11:00', spot: '美瑛青池 & 白鬚瀑布', note: '欣賞清澈池水', category: 'spot' },
      { id: '4', day: 4, time: '16:00', spot: '小樽運河散策', note: '硝子館與海鮮丼', category: 'food' }
    ]
  },
  {
    name: '花東縱谷海線 3 天 2 夜',
    destination: '花蓮 - 台東',
    days: 3,
    passengers: 3,
    currency: 'TWD',
    isRental: true,
    rentalCost: 5400,
    distanceKm: 420,
    fuelEfficiency: 13.5,
    fuelPrice: 31.2,
    tollCost: 180,
    parkingCost: 350,
    accommodation: 8800,
    food: 6500,
    ticket: 1600,
    misc: 1200,
    members: ['Alex', 'Bob', 'Carol'],
    itinerary: [
      { id: '1', day: 1, time: '09:00', spot: '台北出發', note: '經雪隧、蘇花改', category: 'drive' },
      { id: '2', day: 1, time: '12:30', spot: '花蓮新城午餐', note: '佳興檸檬汁與小吃', category: 'food' },
      { id: '3', day: 1, time: '15:30', spot: '七星潭海岸', note: '礫灘散步', category: 'spot' },
      { id: '4', day: 2, time: '10:00', spot: '伯朗大道', note: '租電動自行車環稻田', category: 'spot' }
    ]
  }
];

const STORAGE_KEY = 'roadtrip_planner_data_v2';

export default function App() {
  const [activeTab, setActiveTab] = useState('budget'); // 'budget' | 'split'
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [copied, setCopied] = useState(false);

  // 幣別與匯率 (主要計價幣別，預設 JPY，匯率 1 JPY = 0.215 TWD)
  const [currency, setCurrency] = useState('JPY');
  const [exchangeRate, setExchangeRate] = useState(0.215);

  // 基本行程資訊
  const [tripName, setTripName] = useState('【日本】沖繩悠閒環島 4 天 3 夜');
  const [destination, setDestination] = useState('日本沖繩 (那霸 - 名護 - 古宇利島)');
  const [days, setDays] = useState(4);
  const [passengers, setPassengers] = useState(4);

  // 車輛與行車
  const [isRental, setIsRental] = useState(true);
  const [rentalCost, setRentalCost] = useState(36000);
  const [distanceKm, setDistanceKm] = useState(280);
  const [fuelEfficiency, setFuelEfficiency] = useState(16.5);
  const [fuelPrice, setFuelPrice] = useState(175);
  const [tollCost, setTollCost] = useState(2600);
  const [parkingCost, setParkingCost] = useState(3500);

  // 其他花費設定
  const [accommodation, setAccommodation] = useState(64000);
  const [food, setFood] = useState(42000);
  const [ticket, setTicket] = useState(14000);
  const [misc, setMisc] = useState(8000);

  // 行程規劃清單
  const [itinerary, setItinerary] = useState(PRESETS[0].itinerary);
  const [newSpot, setNewSpot] = useState({ day: 1, time: '10:00', spot: '', note: '', category: 'spot' });

  // 旅伴名單與多人記帳模組
  const [members, setMembers] = useState(['Alex', 'Bob', 'Carol', 'David']);
  const [newMemberName, setNewMemberName] = useState('');

  // 實際支出記帳列表
  const [expenses, setExpenses] = useState([
    {
      id: 'e1',
      title: 'OTS 租車費用與保險',
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
      title: '行前網卡與共同保險',
      payer: 'Carol',
      amount: 1800,
      currency: 'TWD',
      category: 'misc',
      splitWith: ['Alex', 'Bob', 'Carol', 'David'],
      date: '行前'
    }
  ]);

  // 新增記帳表單暫存
  const [newExpense, setNewExpense] = useState({
    title: '',
    payer: 'Alex',
    amount: '',
    currency: 'JPY',
    category: 'food',
    splitWith: ['Alex', 'Bob', 'Carol', 'David'],
    date: 'Day 1'
  });

  // 1. 初始化讀取 LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.tripName !== undefined) setTripName(data.tripName);
        if (data.destination !== undefined) setDestination(data.destination);
        if (data.days !== undefined) setDays(data.days);
        if (data.passengers !== undefined) setPassengers(data.passengers);
        if (data.currency !== undefined) setCurrency(data.currency);
        if (data.exchangeRate !== undefined) setExchangeRate(data.exchangeRate);
        if (data.isRental !== undefined) setIsRental(data.isRental);
        if (data.rentalCost !== undefined) setRentalCost(data.rentalCost);
        if (data.distanceKm !== undefined) setDistanceKm(data.distanceKm);
        if (data.fuelEfficiency !== undefined) setFuelEfficiency(data.fuelEfficiency);
        if (data.fuelPrice !== undefined) setFuelPrice(data.fuelPrice);
        if (data.tollCost !== undefined) setTollCost(data.tollCost);
        if (data.parkingCost !== undefined) setParkingCost(data.parkingCost);
        if (data.accommodation !== undefined) setAccommodation(data.accommodation);
        if (data.food !== undefined) setFood(data.food);
        if (data.ticket !== undefined) setTicket(data.ticket);
        if (data.misc !== undefined) setMisc(data.misc);
        if (data.itinerary !== undefined) setItinerary(data.itinerary);
        if (data.members !== undefined && data.members.length > 0) {
          setMembers(data.members);
          setNewExpense((prev) => ({ ...prev, payer: data.members[0], splitWith: data.members }));
        }
        if (data.expenses !== undefined) setExpenses(data.expenses);
      }
    } catch (e) {
      console.error('Failed to load local storage:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // 2. 異動時自動存檔至 LocalStorage (防抖 500ms)
  useEffect(() => {
    if (!isLoaded) return;
    setIsSaving(true);
    const timer = setTimeout(() => {
      try {
        const stateToSave = {
          tripName,
          destination,
          days,
          passengers,
          currency,
          exchangeRate,
          isRental,
          rentalCost,
          distanceKm,
          fuelEfficiency,
          fuelPrice,
          tollCost,
          parkingCost,
          accommodation,
          food,
          ticket,
          misc,
          itinerary,
          members,
          expenses
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
        setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } catch (e) {
        console.error('Failed to save to local storage:', e);
      } finally {
        setIsSaving(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [
    isLoaded, tripName, destination, days, passengers, currency, exchangeRate,
    isRental, rentalCost, distanceKm, fuelEfficiency, fuelPrice, tollCost,
    parkingCost, accommodation, food, ticket, misc, itinerary, members, expenses
  ]);

  const loadPreset = (preset) => {
    setTripName(preset.name);
    setDestination(preset.destination);
    setDays(preset.days);
    setPassengers(preset.passengers);
    if (preset.currency) setCurrency(preset.currency);
    setIsRental(preset.isRental);
    setRentalCost(preset.rentalCost);
    setDistanceKm(preset.distanceKm);
    setFuelEfficiency(preset.fuelEfficiency);
    setFuelPrice(preset.fuelPrice);
    setTollCost(preset.tollCost);
    setParkingCost(preset.parkingCost);
    setAccommodation(preset.accommodation);
    setFood(preset.food);
    setTicket(preset.ticket);
    setMisc(preset.misc);
    setItinerary(preset.itinerary);
    if (preset.members) {
      setMembers(preset.members);
      setNewExpense((prev) => ({ ...prev, payer: preset.members[0], splitWith: preset.members }));
    }
  };

  const currSymbol = currency === 'JPY' ? '¥' : 'NT$';

  // 預算與行車核心計算
  const calculations = useMemo(() => {
    const safeKm = Number(distanceKm) || 0;
    const safeEfficiency = Number(fuelEfficiency) > 0 ? Number(fuelEfficiency) : 1;
    const safeFuelPrice = Number(fuelPrice) || 0;
    const safeRate = Number(exchangeRate) > 0 ? Number(exchangeRate) : 0.215;

    // 將任何金額依當前主要幣別與匯率進行雙向換算
    const convert = (amount, fromCurr = currency) => {
      if (fromCurr === 'JPY') {
        return Math.round(amount * safeRate);
      }
      return Math.round(amount / safeRate);
    };

    const fuelLiters = safeKm / safeEfficiency;
    const totalFuelCost = Math.round(fuelLiters * safeFuelPrice);
    const effectiveRental = isRental ? (Number(rentalCost) || 0) : 0;
    const drivingTotal = effectiveRental + totalFuelCost + (Number(tollCost) || 0) + (Number(parkingCost) || 0);
    const otherTotal = (Number(accommodation) || 0) + (Number(food) || 0) + (Number(ticket) || 0) + (Number(misc) || 0);
    const grandTotal = drivingTotal + otherTotal;
    const safePassengers = Math.max(1, Number(passengers) || 1);
    const perPersonCost = Math.round(grandTotal / safePassengers);

    const convertedGrandTotal = convert(grandTotal);
    const convertedPerPersonCost = convert(perPersonCost);
    const convertedDrivingTotal = convert(drivingTotal);
    const convertedOtherTotal = convert(otherTotal);

    const costPerKm = safeKm > 0 ? (grandTotal / safeKm).toFixed(1) : '0';
    const perPersonPerDay = days > 0 ? Math.round(perPersonCost / days) : perPersonCost;
    const convertedPerPersonPerDay = days > 0 ? Math.round(convertedPerPersonCost / days) : convertedPerPersonCost;

    const categories = [
      { name: '車輛租賃', amount: effectiveRental, color: 'bg-blue-500' },
      { name: '行車油資', amount: totalFuelCost, color: 'bg-amber-500' },
      { name: '過路與停車', amount: (Number(tollCost) || 0) + (Number(parkingCost) || 0), color: 'bg-orange-400' },
      { name: '住宿費用', amount: Number(accommodation) || 0, color: 'bg-emerald-500' },
      { name: '餐飲美食', amount: Number(food) || 0, color: 'bg-rose-500' },
      { name: '門票活動', amount: Number(ticket) || 0, color: 'bg-purple-500' },
      { name: '其他雜支', amount: Number(misc) || 0, color: 'bg-slate-400' }
    ].filter((item) => item.amount > 0);

    return {
      fuelLiters: fuelLiters.toFixed(1),
      totalFuelCost,
      drivingTotal,
      convertedDrivingTotal,
      otherTotal,
      convertedOtherTotal,
      grandTotal,
      convertedGrandTotal,
      perPersonCost,
      convertedPerPersonCost,
      costPerKm,
      perPersonPerDay,
      convertedPerPersonPerDay,
      categories,
      convert
    };
  }, [
    distanceKm, fuelEfficiency, fuelPrice, isRental, rentalCost,
    tollCost, parkingCost, accommodation, food, ticket, misc, passengers, days, currency, exchangeRate
  ]);

  // 多人記帳結算演算法 (全部統一以 TWD 結算)
  const splitCalculations = useMemo(() => {
    const safeRate = Number(exchangeRate) > 0 ? Number(exchangeRate) : 0.215;

    // 將任何金額換算為 TWD
    const toTwd = (amt, curr) => {
      const num = Number(amt) || 0;
      return curr === 'JPY' ? Math.round(num * safeRate) : Math.round(num);
    };

    // 1. 每位旅伴的墊付額與應分攤額 (TWD)
    const memberStats = {};
    members.forEach((m) => {
      memberStats[m] = {
        paidTwd: 0,
        owedTwd: 0,
        netTwd: 0
      };
    });

    let totalExpenseTwd = 0;

    expenses.forEach((item) => {
      const twdVal = toTwd(item.amount, item.currency);
      totalExpenseTwd += twdVal;

      // 墊付者加錢
      if (memberStats[item.payer]) {
        memberStats[item.payer].paidTwd += twdVal;
      }

      // 分攤對象分錢
      const targets = item.splitWith && item.splitWith.length > 0 ? item.splitWith : members;
      const share = twdVal / targets.length;

      targets.forEach((tm) => {
        if (memberStats[tm]) {
          memberStats[tm].owedTwd += share;
        }
      });
    });

    // 淨結餘 (Net Balance) = 墊付總額 - 應負擔總額
    // 正值代表別人要給他錢 (應收)；負值代表他要付給別人 (應付)
    members.forEach((m) => {
      memberStats[m].netTwd = Math.round(memberStats[m].paidTwd - memberStats[m].owedTwd);
    });

    // 2. 最佳化轉帳結清配對 (Minimizing Transactions Greedy Algorithm)
    const debtors = []; // 應付者
    const creditors = []; // 應收者

    members.forEach((m) => {
      const net = memberStats[m].netTwd;
      if (net < -1) {
        debtors.push({ name: m, amount: -net });
      } else if (net > 1) {
        creditors.push({ name: m, amount: net });
      }
    });

    // 依金額由大到小排序
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
          // 若為日本旅遊，亦換算顯示日幣
          amountJpy: Math.round(settleAmount / safeRate)
        });
      }

      debtors[i].amount -= settleAmount;
      creditors[j].amount -= settleAmount;

      if (debtors[i].amount <= 1) i++;
      if (creditors[j].amount <= 1) j++;
    }

    return {
      toTwd,
      memberStats,
      totalExpenseTwd,
      settlements
    };
  }, [members, expenses, exchangeRate]);

  // 新增景點
  const handleAddSpot = (e) => {
    e.preventDefault();
    if (!newSpot.spot.trim()) return;
    setItinerary([
      ...itinerary,
      {
        ...newSpot,
        id: Date.now().toString(),
        day: Number(newSpot.day)
      }
    ]);
    setNewSpot({ ...newSpot, spot: '', note: '' });
  };

  const handleDeleteSpot = (id) => {
    setItinerary(itinerary.filter((item) => item.id !== id));
  };

  // 新增旅伴
  const handleAddMember = (e) => {
    e.preventDefault();
    const trimmed = newMemberName.trim();
    if (!trimmed || members.includes(trimmed)) return;
    const updated = [...members, trimmed];
    setMembers(updated);
    setNewMemberName('');
    // 自動將新增的旅伴加入分攤預設勾選
    setNewExpense((prev) => ({ ...prev, splitWith: updated }));
  };

  const handleDeleteMember = (name) => {
    if (members.length <= 1) return;
    const updated = members.filter((m) => m !== name);
    setMembers(updated);
    // 同步清除記帳中的相關項目
    setExpenses(
      expenses.map((exp) => ({
        ...exp,
        payer: exp.payer === name ? (updated[0] || 'Unknown') : exp.payer,
        splitWith: exp.splitWith.filter((m) => m !== name)
      }))
    );
  };

  // 新增記帳
  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!newExpense.title.trim() || !newExpense.amount || Number(newExpense.amount) <= 0) return;
    if (!newExpense.splitWith || newExpense.splitWith.length === 0) return;

    setExpenses([
      ...expenses,
      {
        ...newExpense,
        id: Date.now().toString(),
        amount: Number(newExpense.amount)
      }
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

  // 切換單筆分攤人員勾選
  const toggleSplitMember = (member) => {
    const current = newExpense.splitWith;
    if (current.includes(member)) {
      if (current.length === 1) return; // 至少要有一人分攤
      setNewExpense({ ...newExpense, splitWith: current.filter((m) => m !== member) });
    } else {
      setNewExpense({ ...newExpense, splitWith: [...current, member] });
    }
  };

  // 1. 匯出 Excel CSV (包含 UTF-8 BOM，Excel 不會亂碼)
  const handleExportCSV = () => {
    const headers = ['編號', '日期/行程', '費用項目', '墊付人', '原幣別', '原幣金額', '換算台幣(TWD)', '分攤人數', '分攤對象'];
    const rows = expenses.map((exp, idx) => {
      const twd = splitCalculations.toTwd(exp.amount, exp.currency);
      return [
        idx + 1,
        exp.date || '',
        `"${exp.title.replace(/"/g, '""')}"`,
        exp.payer,
        exp.currency,
        exp.amount,
        twd,
        exp.splitWith.length,
        `"${exp.splitWith.join(', ')}"`
      ];
    });

    // 加入彙整資訊列
    rows.push([]);
    rows.push(['--- 最終結清轉帳建議 (統一 TWD) ---']);
    splitCalculations.settlements.forEach((s) => {
      rows.push([`${s.from} 應轉帳給 ${s.to}`, `NT$ ${s.amountTwd}`, `(約 ¥ ${s.amountJpy})`]);
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${tripName}_開銷與分帳報表.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. 友善列印為 PDF
  const handlePrintPDF = () => {
    window.print();
  };

  // 3. 複製分享文字
  const handleCopySummary = () => {
    const isJpy = currency === 'JPY';
    const mainSym = isJpy ? '¥' : 'NT$';
    const altSym = isJpy ? 'NT$' : '¥';

    let text = `🚗【${tripName}】自駕開銷與分帳彙整\n`;
    text += `📍 目的地：${destination} (${days} 天 / 旅伴：${members.join('、')})\n`;
    text += `💱 匯率依據：1 JPY ≈ ${exchangeRate} TWD\n`;
    text += `💰 預算總計：${mainSym} ${calculations.grandTotal.toLocaleString()} (約 ${altSym} ${calculations.convertedGrandTotal.toLocaleString()})\n`;
    text += `👥 每人預算均攤：${mainSym} ${calculations.perPersonCost.toLocaleString()} (約 ${altSym} ${calculations.convertedPerPersonCost.toLocaleString()})\n\n`;

    text += `💳【實際記帳與最終平帳結果 (統一新台幣結算)】\n`;
    text += `記帳總額：NT$ ${splitCalculations.totalExpenseTwd.toLocaleString()}\n`;
    if (splitCalculations.settlements.length === 0) {
      text += `✨ 目前所有旅伴費用已完全打平，無需額外轉帳！\n`;
    } else {
      text += `轉帳結清步驟：\n`;
      splitCalculations.settlements.forEach((s, idx) => {
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
    } catch (err) {
      console.error('複製失敗', err);
    }
    document.body.removeChild(textArea);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased">
      {/* 專用列印樣式：隱藏無關按鈕、表格滿版清晰 */}
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
            max-width: 100% !important;
            box-shadow: none !important;
            border: 1px solid #ddd !important;
          }
        }
      `}</style>

      {/* 頂部導覽列 */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 via-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-base sm:text-lg text-slate-900 leading-tight">自駕旅行開銷與拆帳神器</h1>
              <p className="text-[11px] text-slate-500">Road Trip Cost & Splitwise Calculator</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
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

            {/* 匯出報表按鈕組 */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 transition-colors"
                title="下載 Excel CSV 支出清單"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span className="hidden md:inline">匯出 Excel</span>
              </button>

              <button
                onClick={handlePrintPDF}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 transition-colors"
                title="列印或儲存為精美 PDF"
              >
                <Printer className="w-4 h-4 text-blue-600" />
                <span className="hidden md:inline">列印 PDF</span>
              </button>

              <button
                onClick={handleCopySummary}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                <span>{copied ? '已複製' : '分享摘要'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 幣別切換與即時匯率設定條 */}
        <div className="no-print mb-4 bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 p-3.5 sm:p-4 rounded-2xl text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <Coins className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <div className="text-xs font-semibold text-indigo-200">雙幣別計價與即時換算標準</div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>主要幣別：{currency === 'JPY' ? '日圓 (JPY ¥)' : '新台幣 (TWD NT$)'}</span>
                <span className="text-slate-400 font-normal text-xs">|</span>
                <span className="text-xs text-emerald-300 font-normal">
                  1 JPY ≈ {exchangeRate} TWD (記帳分帳統一換算台幣)
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-start sm:justify-end">
            <div className="inline-flex bg-white/10 p-1 rounded-xl border border-white/15">
              <button
                type="button"
                onClick={() => setCurrency('JPY')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  currency === 'JPY' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-300 hover:text-white'
                }`}
              >
                🇯🇵 日圓 JPY (¥)
              </button>
              <button
                type="button"
                onClick={() => setCurrency('TWD')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  currency === 'TWD' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
                }`}
              >
                🇹🇼 台幣 TWD (NT$)
              </button>
            </div>

            <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-xl border border-white/15 text-xs">
              <span className="text-slate-300">1 JPY =</span>
              <input
                type="number"
                step="0.001"
                min="0.01"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 0.215)}
                className="w-16 px-1.5 py-0.5 bg-white/20 text-white rounded font-mono font-bold text-center focus:outline-none focus:ring-1 focus:ring-amber-300"
              />
              <span className="text-slate-300">TWD</span>
            </div>
          </div>
        </div>

        {/* 分頁標籤切換列 */}
        <div className="no-print flex items-center justify-between border-b border-slate-200 mb-6">
          <div className="flex gap-2 sm:gap-4">
            <button
              onClick={() => setActiveTab('budget')}
              className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'budget'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Navigation className="w-4 h-4" />
              <span>自駕預算與行程規劃</span>
            </button>

            <button
              onClick={() => setActiveTab('split')}
              className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'split'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Split className="w-4 h-4" />
              <span>多人拆帳與記帳 (Splitwise)</span>
              <span className="ml-1 px-2 py-0.5 text-[10px] bg-rose-100 text-rose-700 rounded-full font-extrabold">
                {expenses.length} 筆
              </span>
            </button>
          </div>

          <div className="text-xs text-slate-400 hidden sm:block">
            旅伴名單：{members.join(', ')}
          </div>
        </div>

        {/* ======================= 分頁一：自駕預算與行程規劃 ======================= */}
        {activeTab === 'budget' && (
          <div className="space-y-6">
            {/* 範本快捷載入列 */}
            <div className="no-print bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span>自駕路線範本：</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => loadPreset(p)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all border ${
                      p.currency === 'JPY'
                        ? 'bg-rose-50/70 hover:bg-rose-100/80 text-rose-700 border-rose-200'
                        : 'bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 border-slate-200'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* 左側：輸入表單區塊 */}
              <div className="lg:col-span-7 space-y-6">
                {/* 基本資訊 */}
                <section className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
                  <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
                    <Navigation className="w-4 h-4 text-blue-600" />
                    <h2 className="font-semibold text-slate-800 text-base">基本行程資訊</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        行程名稱
                      </label>
                      <input
                        type="text"
                        value={tripName}
                        onChange={(e) => setTripName(e.target.value)}
                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        主要目的地
                      </label>
                      <input
                        type="text"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                          旅遊天數
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            value={days}
                            onChange={(e) => setDays(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none"
                          />
                          <span className="absolute right-3 top-2.5 text-xs text-slate-400">天</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                          預算分攤人數
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            value={passengers}
                            onChange={(e) => setPassengers(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none"
                          />
                          <span className="absolute right-3 top-2.5 text-xs text-slate-400">人</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 車輛、油耗與行車支出 */}
                <section className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Fuel className="w-4 h-4 text-amber-500" />
                      <h2 className="font-semibold text-slate-800 text-base">車輛、油耗與行車支出</h2>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200/70 px-2.5 py-1 rounded-lg transition-colors">
                      <input
                        type="checkbox"
                        checked={isRental}
                        onChange={(e) => setIsRental(e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>包含租車費用</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {isRental && (
                      <div className="sm:col-span-2 bg-blue-50/60 p-3.5 rounded-xl border border-blue-100">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-blue-900">總租車費用 (含免責補償 CDW / NOC)</label>
                          <span className="text-xs text-blue-700">約 {currSymbol} {days > 0 ? Math.round(rentalCost / days).toLocaleString() : 0} /天</span>
                        </div>
                        <div className="relative">
                          <span className="absolute left-3.5 top-2 text-sm text-slate-400 font-semibold">{currSymbol}</span>
                          <input
                            type="number"
                            min="0"
                            value={rentalCost}
                            onChange={(e) => setRentalCost(Number(e.target.value))}
                            className="w-full pl-11 pr-3.5 py-2 text-sm rounded-lg border border-blue-200 bg-white font-medium focus:outline-none"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">預估總里程</label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          value={distanceKm}
                          onChange={(e) => setDistanceKm(Number(e.target.value))}
                          className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none"
                        />
                        <span className="absolute right-3 top-2.5 text-xs text-slate-400">km</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">平均油耗表現</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          min="1"
                          value={fuelEfficiency}
                          onChange={(e) => setFuelEfficiency(Number(e.target.value))}
                          className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none"
                        />
                        <span className="absolute right-3 top-2.5 text-xs text-slate-400">km / L</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        每公升油價 {currency === 'JPY' ? '(日本約 175 円)' : '(95無鉛約 31 元)'}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={fuelPrice}
                          onChange={(e) => setFuelPrice(Number(e.target.value))}
                          className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none"
                        />
                        <span className="absolute right-3 top-2.5 text-xs text-slate-400">{currSymbol} / L</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                          {currency === 'JPY' ? 'ETC 高速費' : 'eTag 通行費'}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            value={tollCost}
                            onChange={(e) => setTollCost(Number(e.target.value))}
                            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none"
                          />
                          <span className="absolute right-2.5 top-2.5 text-xs text-slate-400">{currSymbol}</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">停車費預算</label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            value={parkingCost}
                            onChange={(e) => setParkingCost(Number(e.target.value))}
                            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none"
                          />
                          <span className="absolute right-2.5 top-2.5 text-xs text-slate-400">{currSymbol}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl flex items-center justify-between text-xs text-amber-800">
                    <div className="flex items-center gap-2">
                      <Fuel className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>預估消耗 <strong>{calculations.fuelLiters}</strong> 公升油料</span>
                    </div>
                    <span className="font-bold text-amber-900">
                      油資：{currSymbol} {calculations.totalFuelCost.toLocaleString()}
                    </span>
                  </div>
                </section>

                {/* 住宿生活費用 */}
                <section className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
                  <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
                    <Receipt className="w-4 h-4 text-emerald-600" />
                    <h2 className="font-semibold text-slate-800 text-base">住宿、餐飲與遊樂開銷</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1">
                        <Hotel className="w-3.5 h-3.5 text-emerald-600" /> 住宿總費用
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-2 text-xs text-slate-400 font-semibold">{currSymbol}</span>
                        <input
                          type="number"
                          min="0"
                          value={accommodation}
                          onChange={(e) => setAccommodation(Number(e.target.value))}
                          className="w-full pl-10 pr-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1">
                        <Utensils className="w-3.5 h-3.5 text-rose-500" /> 餐飲美食預算
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-2 text-xs text-slate-400 font-semibold">{currSymbol}</span>
                        <input
                          type="number"
                          min="0"
                          value={food}
                          onChange={(e) => setFood(Number(e.target.value))}
                          className="w-full pl-10 pr-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1">
                        <Ticket className="w-3.5 h-3.5 text-purple-500" /> 景點門票與體驗
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-2 text-xs text-slate-400 font-semibold">{currSymbol}</span>
                        <input
                          type="number"
                          min="0"
                          value={ticket}
                          onChange={(e) => setTicket(Number(e.target.value))}
                          className="w-full pl-10 pr-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1">
                        <DollarSign className="w-3.5 h-3.5 text-slate-500" /> 其他雜費與備用金
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-2 text-xs text-slate-400 font-semibold">{currSymbol}</span>
                        <input
                          type="number"
                          min="0"
                          value={misc}
                          onChange={(e) => setMisc(Number(e.target.value))}
                          className="w-full pl-10 pr-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* 行程停靠點 */}
                <section className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-indigo-600" />
                      <h2 className="font-semibold text-slate-800 text-base">行程與停靠站規劃 ({itinerary.length})</h2>
                    </div>
                  </div>

                  <form onSubmit={handleAddSpot} className="no-print mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200/70 space-y-2">
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-3 sm:col-span-2">
                        <select
                          value={newSpot.day}
                          onChange={(e) => setNewSpot({ ...newSpot, day: Number(e.target.value) })}
                          className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                        >
                          {Array.from({ length: days }, (_, i) => i + 1).map((d) => (
                            <option key={d} value={d}>第 {d} 天</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-3 sm:col-span-2">
                        <input
                          type="time"
                          value={newSpot.time}
                          onChange={(e) => setNewSpot({ ...newSpot, time: e.target.value })}
                          className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                        />
                      </div>
                      <div className="col-span-6 sm:col-span-5">
                        <input
                          type="text"
                          placeholder="景點 / 休息站 / 餐廳"
                          value={newSpot.spot}
                          onChange={(e) => setNewSpot({ ...newSpot, spot: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                        />
                      </div>
                      <div className="col-span-12 sm:col-span-3 flex gap-1.5">
                        <select
                          value={newSpot.category}
                          onChange={(e) => setNewSpot({ ...newSpot, category: e.target.value })}
                          className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                        >
                          <option value="spot">景點</option>
                          <option value="food">用餐</option>
                          <option value="drive">行車</option>
                        </select>
                        <button
                          type="submit"
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </form>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {itinerary.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-indigo-100 text-indigo-700">
                            Day {item.day}
                          </span>
                          <span className="text-slate-400 font-mono text-[11px]">{item.time}</span>
                          <span className="font-semibold text-slate-800">{item.spot}</span>
                          {item.note && <span className="text-slate-400 hidden sm:inline">({item.note})</span>}
                        </div>
                        <button
                          onClick={() => handleDeleteSpot(item.id)}
                          className="no-print text-slate-300 hover:text-rose-500 p-1 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* 右側：即時彙整面板 (Sticky) */}
              <div className="lg:col-span-5 lg:sticky lg:top-20 space-y-6">
                <div className="bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                      <span>總預估開銷 (全體 {passengers} 人)</span>
                      <span className="bg-white/10 px-2.5 py-0.5 rounded-full text-indigo-200 font-medium">
                        {days} 天 {passengers} 人
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-sm text-indigo-300 font-bold">{currSymbol}</span>
                      <span className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                        {calculations.grandTotal.toLocaleString()}
                      </span>
                    </div>

                    <div className="text-xs text-emerald-400 font-semibold mb-4 flex items-center gap-1">
                      <ArrowRightLeft className="w-3 h-3 inline" />
                      <span>約 {currency === 'JPY' ? 'NT$' : '¥'} {calculations.convertedGrandTotal.toLocaleString()}</span>
                      <span className="text-slate-400 text-[10px] font-normal">(匯率 1 JPY = {exchangeRate} TWD)</span>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 flex items-center justify-between">
                      <div>
                        <div className="text-[11px] text-indigo-200 font-medium flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-indigo-300" /> 每人平均分攤
                        </div>
                        <div className="text-2xl font-bold text-white mt-0.5">
                          {currSymbol} {calculations.perPersonCost.toLocaleString()}
                        </div>
                        <div className="text-xs text-emerald-300 font-medium mt-0.5">
                          ≈ {currency === 'JPY' ? 'NT$' : '¥'} {calculations.convertedPerPersonCost.toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right border-l border-white/10 pl-4">
                        <div className="text-[10px] text-slate-400">平均每日/每人</div>
                        <div className="text-sm font-semibold text-white mt-0.5">
                          {currSymbol} {calculations.perPersonPerDay.toLocaleString()}
                        </div>
                        <div className="text-xs text-emerald-400 font-medium mt-0.5">
                          ≈ {currency === 'JPY' ? 'NT$' : '¥'} {calculations.convertedPerPersonPerDay.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/10 text-center">
                      <div>
                        <div className="text-[10px] text-slate-400">總行駛里程</div>
                        <div className="text-xs font-bold text-white mt-0.5">{distanceKm} km</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">每公里成本</div>
                        <div className="text-xs font-bold text-white mt-0.5">{currSymbol} {calculations.costPerKm}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">預估耗油量</div>
                        <div className="text-xs font-bold text-white mt-0.5">{calculations.fuelLiters} L</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 各類費用分佈 */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-indigo-600" />
                      <h3 className="font-semibold text-slate-800 text-sm">各類費用分佈</h3>
                    </div>
                  </div>

                  <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex mb-4">
                    {calculations.categories.map((cat, idx) => {
                      const percentage = calculations.grandTotal > 0 ? (cat.amount / calculations.grandTotal) * 100 : 0;
                      return (
                        <div
                          key={idx}
                          style={{ width: `${percentage}%` }}
                          className={`${cat.color} h-full transition-all duration-300`}
                        />
                      );
                    })}
                  </div>

                  <div className="space-y-2.5">
                    {calculations.categories.map((cat, idx) => {
                      const pct = calculations.grandTotal > 0 ? ((cat.amount / calculations.grandTotal) * 100).toFixed(1) : 0;
                      const altAmount = calculations.convert(cat.amount);
                      return (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${cat.color}`} />
                            <span className="text-slate-600 font-medium">{cat.name}</span>
                          </div>
                          <div className="flex items-center gap-2.5 text-right">
                            <span className="text-slate-400 text-[10px]">{pct}%</span>
                            <div>
                              <div className="font-semibold text-slate-800 font-mono">
                                {currSymbol} {cat.amount.toLocaleString()}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                ≈ {currency === 'JPY' ? 'NT$' : '¥'} {altAmount.toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================= 分頁二：多人拆帳與記帳模組 (Splitwise) ======================= */}
        {activeTab === 'split' && (
          <div className="space-y-6">
            {/* 1. 旅伴成員管理 */}
            <section className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <h2 className="font-semibold text-slate-800 text-base">同行旅伴管理 ({members.length} 人)</h2>
                </div>
                <span className="text-xs text-slate-400">用於分帳紀錄與最後結算</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-4">
                {members.map((m) => (
                  <span
                    key={m}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100"
                  >
                    <span>{m}</span>
                    {members.length > 1 && (
                      <button
                        onClick={() => handleDeleteMember(m)}
                        className="text-indigo-400 hover:text-rose-600 p-0.5 transition-colors"
                        title="移除旅伴"
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))}
              </div>

              <form onSubmit={handleAddMember} className="no-print flex gap-2 max-w-sm">
                <input
                  type="text"
                  placeholder="輸入旅伴暱稱 (例：Carol)"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>加入成員</span>
                </button>
              </form>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* 左側：新增支出表單 + 支出明細清單 */}
              <div className="lg:col-span-7 space-y-6">
                {/* 新增開銷紀錄 */}
                <section className="no-print bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
                  <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
                    <CreditCard className="w-4 h-4 text-rose-500" />
                    <h2 className="font-semibold text-slate-800 text-base">新增費用支出</h2>
                  </div>

                  <form onSubmit={handleAddExpense} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-500 mb-1">費用說明 / 項目</label>
                        <input
                          type="text"
                          required
                          placeholder="例：居酒屋晚餐、租車自付額、門票"
                          value={newExpense.title}
                          onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                          className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">消費時點 / 天數</label>
                        <input
                          type="text"
                          placeholder="例：Day 1、行前"
                          value={newExpense.date}
                          onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                          className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">付款人 (誰先墊付)</label>
                        <select
                          value={newExpense.payer}
                          onChange={(e) => setNewExpense({ ...newExpense, payer: e.target.value })}
                          className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white font-medium focus:outline-none"
                        >
                          {members.map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2 sm:col-span-2">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">付款幣別</label>
                          <select
                            value={newExpense.currency}
                            onChange={(e) => setNewExpense({ ...newExpense, currency: e.target.value })}
                            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white font-bold text-slate-700 focus:outline-none"
                          >
                            <option value="JPY">🇯🇵 日圓 (JPY ¥)</option>
                            <option value="TWD">🇹🇼 台幣 (TWD NT$)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">實際消費金額</label>
                          <div className="relative">
                            <span className="absolute left-3 top-2 text-xs text-slate-400 font-bold">
                              {newExpense.currency === 'JPY' ? '¥' : 'NT$'}
                            </span>
                            <input
                              type="number"
                              required
                              min="1"
                              placeholder="金額"
                              value={newExpense.amount}
                              onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                              className="w-full pl-8 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 分攤對象選擇器 */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-slate-500">
                          由誰分攤這筆費用？ ({newExpense.splitWith.length} 人均攤)
                        </label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setNewExpense({ ...newExpense, splitWith: members })}
                            className="text-[11px] text-indigo-600 hover:underline"
                          >
                            全選
                          </button>
                        </div>
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
                      className="w-full py-2.5 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>記錄此筆支出</span>
                    </button>
                  </form>
                </section>

                {/* 支出明細列表 */}
                <section className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm print-full">
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-indigo-600" />
                      <h2 className="font-semibold text-slate-800 text-base">支出紀錄明細 ({expenses.length} 筆)</h2>
                    </div>
                    <span className="text-xs text-slate-400">各幣別紀錄自動換算台幣</span>
                  </div>

                  {expenses.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      目前尚未新增記帳，請使用上方表單登記第一筆花費！
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {expenses.map((exp) => {
                        const twdAmount = splitCalculations.toTwd(exp.amount, exp.currency);
                        const isAll = exp.splitWith.length === members.length;
                        return (
                          <div
                            key={exp.id}
                            className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-white transition-all text-xs flex items-center justify-between gap-3"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-200 text-slate-700">
                                  {exp.date || '記帳'}
                                </span>
                                <span className="font-bold text-slate-900 text-sm">{exp.title}</span>
                              </div>
                              <div className="text-slate-500 text-[11px] flex flex-wrap items-center gap-2">
                                <span>由 <strong className="text-indigo-600">{exp.payer}</strong> 墊付</span>
                                <span>•</span>
                                <span>分攤：{isAll ? '所有人均攤' : exp.splitWith.join(', ')}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 text-right shrink-0">
                              <div>
                                <div className="font-mono font-bold text-sm text-slate-900">
                                  {exp.currency === 'JPY' ? '¥' : 'NT$'} {exp.amount.toLocaleString()}
                                </div>
                                <div className="text-[10px] text-emerald-600 font-mono">
                                  ≈ NT$ {twdAmount.toLocaleString()}
                                </div>
                              </div>
                              <button
                                onClick={() => handleDeleteExpense(exp.id)}
                                className="no-print text-slate-300 hover:text-rose-500 p-1.5 rounded-lg transition-colors"
                                title="刪除此筆記帳"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </div>

              {/* 右側：最終最佳化平帳結清指示 (Sticky) */}
              <div className="lg:col-span-5 lg:sticky lg:top-20 space-y-6">
                {/* 最終最佳轉帳方案 (核心亮點) */}
                <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden print-full">
                  <div className="relative z-10">
                    <div className="flex items-center justify-between text-indigo-200 text-xs mb-1">
                      <span>最終最佳結清平帳 (統一新台幣)</span>
                      <span className="bg-white/10 px-2 py-0.5 rounded-full text-[10px] text-indigo-300">
                        Splitwise 演算法
                      </span>
                    </div>

                    <div className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-1">
                      NT$ {splitCalculations.totalExpenseTwd.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-400 mb-5">
                      全體記帳總支出 (已依匯率 {exchangeRate} 自動換算)
                    </div>

                    {/* 轉帳結清指示 */}
                    <div className="space-y-2.5">
                      <div className="text-xs font-semibold text-indigo-200 flex items-center gap-1.5">
                        <ArrowRightLeft className="w-3.5 h-3.5 text-amber-300" />
                        <span>建議轉帳步驟 (最少筆數結清)：</span>
                      </div>

                      {splitCalculations.settlements.length === 0 ? (
                        <div className="bg-white/10 p-3.5 rounded-2xl text-center text-xs text-emerald-300 font-medium border border-white/10">
                          🎉 太棒了！目前所有旅伴支出已完全平衡，不需任何轉帳！
                        </div>
                      ) : (
                        splitCalculations.settlements.map((s, idx) => (
                          <div
                            key={idx}
                            className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-rose-500/80 text-white flex items-center justify-center text-[10px] font-bold">
                                {s.from[0]}
                              </span>
                              <span className="font-bold text-rose-200">{s.from}</span>
                              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                              <span className="w-5 h-5 rounded-full bg-emerald-500/80 text-white flex items-center justify-center text-[10px] font-bold">
                                {s.to[0]}
                              </span>
                              <span className="font-bold text-emerald-200">{s.to}</span>
                            </div>

                            <div className="text-right">
                              <div className="text-sm font-black text-amber-300 font-mono">
                                NT$ {s.amountTwd.toLocaleString()}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                (約 ¥ {s.amountJpy.toLocaleString()})
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* 各旅伴墊付與收支結餘表 */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm print-full">
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-indigo-600" />
                      <h3 className="font-semibold text-slate-800 text-sm">旅伴收支結餘總覽 (TWD)</h3>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {members.map((m) => {
                      const stat = splitCalculations.memberStats[m] || { paidTwd: 0, owedTwd: 0, netTwd: 0 };
                      const isPlus = stat.netTwd > 0;
                      const isMinus = stat.netTwd < 0;

                      return (
                        <div key={m} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                          <div className="flex items-center justify-between mb-1.5">
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
                              {isPlus ? `應收 NT$ ${stat.netTwd.toLocaleString()}` : isMinus ? `應付 NT$ ${Math.abs(stat.netTwd).toLocaleString()}` : '已打平'}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                            <div>已墊付：<strong className="text-slate-700 font-mono">NT$ {stat.paidTwd.toLocaleString()}</strong></div>
                            <div className="text-right">應負擔：<strong className="text-slate-700 font-mono">NT$ {Math.round(stat.owedTwd).toLocaleString()}</strong></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

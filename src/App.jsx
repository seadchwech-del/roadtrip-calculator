import React, { useState, useMemo, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';
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
  RotateCcw,
  Receipt,
  Hotel,
  Utensils,
  Ticket,
  ChevronRight,
  ShieldAlert,
  Share2,
  Check,
  Coins,
  ArrowRightLeft,
  Globe,
  Cloud,
  Loader2
} from 'lucide-react';

const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// 預設自駕行程範本
const PRESETS = [
  {
    name: '【日本】沖繩悠閒環島 4 天 3 夜',
    destination: '日本沖繩 (那霸 - 名護 - 古宇利島)',
    days: 4,
    passengers: 4,
    currency: 'JPY',
    isRental: true,
    rentalCost: 36000, // 日幣
    distanceKm: 280,
    fuelEfficiency: 16.5,
    fuelPrice: 175, // 日本 Regular 汽油約 175 円/L
    tollCost: 2600, // 沖繩自動車道通行費
    parkingCost: 3500,
    accommodation: 64000,
    food: 42000,
    ticket: 14000, // 美麗海水族館等
    misc: 8000,
    itinerary: [
      { id: '1', day: 1, time: '11:30', spot: '那霸機場 OTS / Toyota 取車', note: '檢查 ETC 卡與保險安心險', category: 'drive' },
      { id: '2', day: 1, time: '14:00', spot: '瀨長島 Umikaji Terrace', note: '吃鬆餅看飛機起降', category: 'food' },
      { id: '3', day: 2, time: '10:30', spot: '美麗海水族館 & 備瀨一線天', note: '黑潮之海餵食秀', category: 'spot' },
      { id: '4', day: 2, time: '15:30', spot: '古宇利大橋 & 心形岩', note: '跨海大橋兜風', category: 'spot' },
      { id: '5', day: 3, time: '12:00', spot: '美國村 (American Village)', note: '購物商場與海濱步道', category: 'spot' },
      { id: '6', day: 4, time: '14:00', spot: '那霸市區加油還車 (滿油還車)', note: '出示加油發票檢查', category: 'drive' }
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
    tollCost: 7800, // 道央道高速費 (可配 HEP)
    parkingCost: 2500,
    accommodation: 98000,
    food: 68000,
    ticket: 12000,
    misc: 10000,
    itinerary: [
      { id: '1', day: 1, time: '13:00', spot: '新千歲機場租車出發', note: '確認租借 HEP 高速公路周遊券', category: 'drive' },
      { id: '2', day: 2, time: '10:00', spot: '富田農場 & 四季彩之丘', note: '薰衣草花田與哈密瓜冰淇淋', category: 'spot' },
      { id: '3', day: 3, time: '11:00', spot: '美瑛青池 & 白鬚瀑布', note: '欣賞蒂芬妮藍清澈池水', category: 'spot' },
      { id: '4', day: 4, time: '16:00', spot: '小樽運河散策', note: '硝子館、音樂盒館與海鮮丼', category: 'food' }
    ]
  },
  {
    name: '花東縱谷海線 3 天 2 夜',
    destination: '花蓮 - 台東',
    days: 3,
    passengers: 4,
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
    itinerary: [
      { id: '1', day: 1, time: '09:00', spot: '台北出發', note: '經雪隧、蘇花改', category: 'drive' },
      { id: '2', day: 1, time: '12:30', spot: '花蓮新城午餐', note: '佳興冰果室、檸檬汁', category: 'food' },
      { id: '3', day: 1, time: '15:30', spot: '七星潭海岸', note: '看海疊石頭', category: 'spot' },
      { id: '4', day: 2, time: '10:00', spot: '伯朗大道', note: '租電動自行車環稻田', category: 'spot' },
      { id: '5', day: 2, time: '18:30', spot: '台東鐵花村', note: '文創市集與晚餐', category: 'food' },
    ]
  },
  {
    name: '中台灣阿里山公路 2 天 1 夜',
    destination: '嘉義 - 阿里山',
    days: 2,
    passengers: 2,
    currency: 'TWD',
    isRental: false,
    rentalCost: 0,
    distanceKm: 280,
    fuelEfficiency: 11.2,
    fuelPrice: 31.2,
    tollCost: 120,
    parkingCost: 200,
    accommodation: 3600,
    food: 2800,
    ticket: 600,
    misc: 500,
    itinerary: [
      { id: '1', day: 1, time: '08:30', spot: '嘉義火車站會合', note: '補給飲用水與零食', category: 'drive' },
      { id: '2', day: 1, time: '11:00', spot: '奮起湖老街', note: '鐵路便當與草仔粿', category: 'food' },
      { id: '3', day: 1, time: '14:30', spot: '阿里山國家森林遊樂區', note: '巨木群棧道散步', category: 'spot' },
      { id: '4', day: 2, time: '05:00', spot: '祝山觀日平台', note: '日出雲海', category: 'spot' }
    ]
  }
];

export default function App() {
  const [user, setUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState(null);

  // 幣別與匯率設定 (1 JPY = ? TWD，可自訂調整)
  const [currency, setCurrency] = useState('JPY'); // 'JPY' | 'TWD'
  const [exchangeRate, setExchangeRate] = useState(0.215); // 預設 1 日圓 = 0.215 台幣

  // 基本資訊
  const [tripName, setTripName] = useState('【日本】沖繩悠閒環島 4 天 3 夜');
  const [destination, setDestination] = useState('日本沖繩 (那霸 - 名護 - 古宇利島)');
  const [days, setDays] = useState(4);
  const [passengers, setPassengers] = useState(4);

  // 車輛與行車設定 (油耗以 km/L 計算)
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
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // 貨幣符號與標記
  const currSymbol = currency === 'JPY' ? '¥' : 'NT$';
  const currUnit = currency === 'JPY' ? '円' : '元';

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth init error:", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'tripPlan', 'current');
    const unsubscribe = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
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
        }
        setIsLoaded(true);
      },
      (error) => {
        console.error("Load trip data error:", error);
        setIsLoaded(true);
      }
    );

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user || !isLoaded) return;

    const timer = setTimeout(async () => {
      setIsSaving(true);
      try {
        const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'tripPlan', 'current');
        await setDoc(
          userDocRef,
          {
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
            updatedAt: new Date().toISOString()
          },
          { merge: true }
        );
        setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } catch (err) {
        console.error("Save trip data error:", err);
      } finally {
        setIsSaving(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [
    user, isLoaded, tripName, destination, days, passengers, currency, exchangeRate,
    isRental, rentalCost, distanceKm, fuelEfficiency, fuelPrice, tollCost, parkingCost,
    accommodation, food, ticket, misc, itinerary
  ]);

  // 載入範本
  const loadPreset = (preset) => {
    setTripName(preset.name);
    setDestination(preset.destination);
    setDays(preset.days);
    setPassengers(preset.passengers);
    if (preset.currency) {
      setCurrency(preset.currency);
    }
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
  };

  // 核心計算 (支援 JPY <-> TWD 雙幣別即時換算)
  const calculations = useMemo(() => {
    const safeKm = Number(distanceKm) || 0;
    const safeEfficiency = Number(fuelEfficiency) > 0 ? Number(fuelEfficiency) : 1;
    const safeFuelPrice = Number(fuelPrice) || 0;
    const safeRate = Number(exchangeRate) > 0 ? Number(exchangeRate) : 0.215;

    // 換算函式：轉換至對應的另一個幣別
    const convert = (amount) => {
      if (currency === 'JPY') {
        // JPY -> TWD
        return Math.round(amount * safeRate);
      } else {
        // TWD -> JPY
        return Math.round(amount / safeRate);
      }
    };

    // 油量公升數與油資
    const fuelLiters = safeKm / safeEfficiency;
    const totalFuelCost = Math.round(fuelLiters * safeFuelPrice);

    // 車輛相關總成本
    const effectiveRental = isRental ? (Number(rentalCost) || 0) : 0;
    const drivingTotal = effectiveRental + totalFuelCost + (Number(tollCost) || 0) + (Number(parkingCost) || 0);

    // 其他花費總計
    const otherTotal = (Number(accommodation) || 0) + (Number(food) || 0) + (Number(ticket) || 0) + (Number(misc) || 0);

    // 總開銷與人均 (主幣別)
    const grandTotal = drivingTotal + otherTotal;
    const safePassengers = Math.max(1, Number(passengers) || 1);
    const perPersonCost = Math.round(grandTotal / safePassengers);

    // 雙幣別換算總額與人均
    const convertedGrandTotal = convert(grandTotal);
    const convertedPerPersonCost = convert(perPersonCost);
    const convertedDrivingTotal = convert(drivingTotal);
    const convertedOtherTotal = convert(otherTotal);

    // 每公里成本與每人每日平均
    const costPerKm = safeKm > 0 ? (grandTotal / safeKm).toFixed(1) : '0';
    const convertedCostPerKm = safeKm > 0 ? (convertedGrandTotal / safeKm).toFixed(1) : '0';
    const perPersonPerDay = days > 0 ? Math.round(perPersonCost / days) : perPersonCost;
    const convertedPerPersonPerDay = days > 0 ? Math.round(convertedPerPersonCost / days) : convertedPerPersonCost;

    // 開銷類別百分比清單
    const categories = [
      { name: '車輛租賃', amount: effectiveRental, color: 'bg-blue-500', text: 'text-blue-600' },
      { name: '行車油資', amount: totalFuelCost, color: 'bg-amber-500', text: 'text-amber-600' },
      { name: '過路與停車', amount: (Number(tollCost) || 0) + (Number(parkingCost) || 0), color: 'bg-orange-400', text: 'text-orange-600' },
      { name: '住宿費用', amount: Number(accommodation) || 0, color: 'bg-emerald-500', text: 'text-emerald-600' },
      { name: '餐飲美食', amount: Number(food) || 0, color: 'bg-rose-500', text: 'text-rose-600' },
      { name: '門票活動', amount: Number(ticket) || 0, color: 'bg-purple-500', text: 'text-purple-600' },
      { name: '其他雜支', amount: Number(misc) || 0, color: 'bg-slate-400', text: 'text-slate-600' },
    ].filter(item => item.amount > 0);

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
      convertedCostPerKm,
      perPersonPerDay,
      convertedPerPersonPerDay,
      categories,
      convert
    };
  }, [
    distanceKm, fuelEfficiency, fuelPrice, isRental, rentalCost,
    tollCost, parkingCost, accommodation, food, ticket, misc, passengers, days, currency, exchangeRate
  ]);

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

  // 刪除景點
  const handleDeleteSpot = (id) => {
    setItinerary(itinerary.filter(item => item.id !== id));
  };

  // 複製行程摘要至剪貼簿 (同時輸出日幣與台幣金額)
  const handleCopySummary = () => {
    const isJpy = currency === 'JPY';
    const mainSym = isJpy ? '¥' : 'NT$';
    const altSym = isJpy ? 'NT$' : '¥';

    const text = `🚗【${tripName}】自駕開銷試算
📍 目的地：${destination} (${days} 天 ${passengers} 人)
💱 計價幣別：${currency} (匯率 1 JPY = ${exchangeRate} TWD)
💰 總開銷預估：${mainSym} ${calculations.grandTotal.toLocaleString()} (約 ${altSym} ${calculations.convertedGrandTotal.toLocaleString()})
👥 每人均攤：${mainSym} ${calculations.perPersonCost.toLocaleString()} (約 ${altSym} ${calculations.convertedPerPersonCost.toLocaleString()})
📅 每人每日平均：約 ${mainSym} ${calculations.perPersonPerDay.toLocaleString()} (約 ${altSym} ${calculations.convertedPerPersonPerDay.toLocaleString()})
⛽ 預估行駛：${distanceKm} km (耗油約 ${calculations.fuelLiters} L，油資 ${mainSym} ${calculations.totalFuelCost.toLocaleString()})
🚙 交通租車通行費：${mainSym} ${calculations.drivingTotal.toLocaleString()} (約 ${altSym} ${calculations.convertedDrivingTotal.toLocaleString()})
🏨 住宿餐飲生活：${mainSym} ${calculations.otherTotal.toLocaleString()} (約 ${altSym} ${calculations.convertedOtherTotal.toLocaleString()})`;

    const textArea = document.createElement("textarea");
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
      {/* 頂部導覽列 */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 via-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
            {/* 自動儲存狀態標籤 */}
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
                    {lastSavedTime ? `已自動儲存 (${lastSavedTime})` : '自動儲存已就緒'}
                  </span>
                </>
              )}
            </div>

            <button
              onClick={handleCopySummary}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg border border-slate-300 hover:bg-slate-100 transition-colors text-slate-700"
              title="複製行程開銷摘要"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
              <span>{copied ? '已複製摘要' : '分享行程'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {}
        {/* 幣別切換與匯率自訂控制列 */}
        <div className="mb-4 bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 p-3.5 sm:p-4 rounded-2xl text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <Coins className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <div className="text-xs font-semibold text-indigo-200">計價幣別與即時匯率</div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>主要幣別：{currency === 'JPY' ? '日圓 (JPY ¥)' : '新台幣 (TWD NT$)'}</span>
                <span className="text-slate-400 font-normal text-xs">|</span>
                <span className="text-xs text-emerald-300 font-normal">
                  1 JPY ≈ {exchangeRate} TWD ({currency === 'JPY' ? `1 TWD ≈ ${(1 / exchangeRate).toFixed(1)} JPY` : ''})
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-start sm:justify-end">
            {/* 幣別切換按鈕 */}
            <div className="inline-flex bg-white/10 p-1 rounded-xl border border-white/15">
              <button
                type="button"
                onClick={() => setCurrency('JPY')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  currency === 'JPY'
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                🇯🇵 日圓 JPY (¥)
              </button>
              <button
                type="button"
                onClick={() => setCurrency('TWD')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  currency === 'TWD'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                🇹🇼 台幣 TWD (NT$)
              </button>
            </div>

            {/* 匯率輸入框 */}
            <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-xl border border-white/15 text-xs">
              <span className="text-slate-300">1 JPY =</span>
              <input
                type="number"
                step="0.001"
                min="0.01"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 0.215)}
                className="w-16 px-1.5 py-0.5 bg-white/20 text-white rounded font-mono font-bold text-center focus:outline-none focus:ring-1 focus:ring-amber-300"
                title="自訂匯率 (台幣/日圓)"
              />
              <span className="text-slate-300">TWD</span>
            </div>
          </div>
        </div>

        {/* 範本快捷載入列 */}
        <div className="mb-6 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>自駕路線範本（含台日推薦）：</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => loadPreset(p)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all border ${
                  p.currency === 'JPY'
                    ? 'bg-rose-50/70 hover:bg-rose-100/80 text-rose-700 border-rose-200'
                    : 'bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 border-slate-200 hover:border-indigo-200'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* 主畫面網格：左側輸入表單 + 右側即時彙整 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ================= 左側：輸入表單區塊 (7 欄寬) ================= */}
          <div className="lg:col-span-7 space-y-6">

            {/* 1. 行程基本設定 */}
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
                    placeholder="例：日本沖繩海島 4 天 3 夜自駕"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    主要目的地 / 區域
                  </label>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="例：日本沖繩 (那霸/名護)"
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
                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-slate-400">天</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      分攤人數
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        value={passengers}
                        onChange={(e) => setPassengers(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-slate-400">人</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {}
            {/* 2. 車輛與行車成本 (核心亮點) */}
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
                {/* 租車費用輸入 (若有勾選) */}
                {isRental && (
                  <div className="sm:col-span-2 bg-blue-50/60 p-3.5 rounded-xl border border-blue-100">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-blue-900">
                        總租車費用 (含免責補償 CDW / NOC / 安心險)
                      </label>
                      <span className="text-xs text-blue-700 font-medium">
                        約 {currSymbol} {days > 0 ? Math.round(rentalCost / days).toLocaleString() : 0} /天
                        {currency === 'JPY' && (
                          <span className="text-blue-500 ml-1">
                            (約 NT$ {days > 0 ? Math.round((rentalCost * exchangeRate) / days).toLocaleString() : 0})
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2 text-sm text-slate-400 font-semibold">{currSymbol}</span>
                      <input
                        type="number"
                        min="0"
                        value={rentalCost}
                        onChange={(e) => setRentalCost(Number(e.target.value))}
                        className="w-full pl-11 pr-3.5 py-2 text-sm rounded-lg border border-blue-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                      />
                    </div>
                  </div>
                )}

                {/* 預估里程 */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">預估總里程</label>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={distanceKm}
                      onChange={(e) => setDistanceKm(Number(e.target.value))}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="例：300"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-400">公里 (km)</span>
                  </div>
                </div>

                {/* 車輛平均油耗 */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    平均油耗表現
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      value={fuelEfficiency}
                      onChange={(e) => setFuelEfficiency(Number(e.target.value))}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="例：15.0"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-400">km / L</span>
                  </div>
                </div>

                {/* 每公升油價 */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    每公升油價 {currency === 'JPY' ? '(日本 Regular 約 170~178 円)' : '(95無鉛)'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={fuelPrice}
                      onChange={(e) => setFuelPrice(Number(e.target.value))}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder={currency === 'JPY' ? '175' : '31.2'}
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-400">{currSymbol} / L</span>
                  </div>
                </div>

                {/* 高速公路收費與停車費 */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      {currency === 'JPY' ? 'ETC 高速費 / 周遊券' : 'eTag 通行費'}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={tollCost}
                        onChange={(e) => setTollCost(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                      <span className="absolute right-2.5 top-2.5 text-xs text-slate-400">{currUnit}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      停車費預算
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={parkingCost}
                        onChange={(e) => setParkingCost(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                      <span className="absolute right-2.5 top-2.5 text-xs text-slate-400">{currUnit}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 即時油耗預估摘要小貼士 */}
              <div className="mt-4 p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl flex items-center justify-between text-xs text-amber-800">
                <div className="flex items-center gap-2">
                  <Fuel className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>預估消耗 <strong>{calculations.fuelLiters}</strong> 公升油料</span>
                </div>
                <span className="font-bold text-amber-900">
                  油資試算：{currSymbol} {calculations.totalFuelCost.toLocaleString()}
                  {currency === 'JPY' && (
                    <span className="font-normal text-amber-700 ml-1">
                      (約 NT$ {Math.round(calculations.totalFuelCost * exchangeRate).toLocaleString()})
                    </span>
                  )}
                </span>
              </div>
            </section>

            {}
            {/* 3. 住宿、餐飲與其他生活支出 */}
            <section className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
                <Receipt className="w-4 h-4 text-emerald-600" />
                <h2 className="font-semibold text-slate-800 text-base">住宿、餐飲與遊樂開銷</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                      <Hotel className="w-3.5 h-3.5 text-emerald-600" /> 住宿總費用
                    </label>
                    {currency === 'JPY' && (
                      <span className="text-[11px] text-slate-400">
                        約 NT$ {Math.round(accommodation * exchangeRate).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2 text-xs text-slate-400 font-semibold">{currSymbol}</span>
                    <input
                      type="number"
                      min="0"
                      value={accommodation}
                      onChange={(e) => setAccommodation(Number(e.target.value))}
                      className="w-full pl-10 pr-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                      <Utensils className="w-3.5 h-3.5 text-rose-500" /> 餐飲美食預算
                    </label>
                    {currency === 'JPY' && (
                      <span className="text-[11px] text-slate-400">
                        約 NT$ {Math.round(food * exchangeRate).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2 text-xs text-slate-400 font-semibold">{currSymbol}</span>
                    <input
                      type="number"
                      min="0"
                      value={food}
                      onChange={(e) => setFood(Number(e.target.value))}
                      className="w-full pl-10 pr-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                      <Ticket className="w-3.5 h-3.5 text-purple-500" /> 景點門票與體驗活動
                    </label>
                    {currency === 'JPY' && (
                      <span className="text-[11px] text-slate-400">
                        約 NT$ {Math.round(ticket * exchangeRate).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2 text-xs text-slate-400 font-semibold">{currSymbol}</span>
                    <input
                      type="number"
                      min="0"
                      value={ticket}
                      onChange={(e) => setTicket(Number(e.target.value))}
                      className="w-full pl-10 pr-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                      <DollarSign className="w-3.5 h-3.5 text-slate-500" /> 其他雜費與備用金
                    </label>
                    {currency === 'JPY' && (
                      <span className="text-[11px] text-slate-400">
                        約 NT$ {Math.round(misc * exchangeRate).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2 text-xs text-slate-400 font-semibold">{currSymbol}</span>
                    <input
                      type="number"
                      min="0"
                      value={misc}
                      onChange={(e) => setMisc(Number(e.target.value))}
                      className="w-full pl-10 pr-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all"
                    />
                  </div>
                </div>
              </div>
            </section>

            {}
            {/* 4. 沿途停靠站與景點清單 */}
            <section className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-indigo-600" />
                  <h2 className="font-semibold text-slate-800 text-base">行程與停靠站規劃 ({itinerary.length})</h2>
                </div>
                <span className="text-xs text-slate-400">依天數紀錄重點站點</span>
              </div>

              {/* 新增站點表單 */}
              <form onSubmit={handleAddSpot} className="mb-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 space-y-3">
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-3 sm:col-span-2">
                    <select
                      value={newSpot.day}
                      onChange={(e) => setNewSpot({ ...newSpot, day: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium"
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
                      placeholder="景點 / 道之驛(休息站) / 餐廳"
                      value={newSpot.spot}
                      onChange={(e) => setNewSpot({ ...newSpot, spot: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="col-span-12 sm:col-span-3 flex gap-1.5">
                    <select
                      value={newSpot.category}
                      onChange={(e) => setNewSpot({ ...newSpot, category: e.target.value })}
                      className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                    >
                      <option value="spot">景點觀光</option>
                      <option value="food">用餐休息</option>
                      <option value="drive">長途行車</option>
                    </select>
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </form>

              {/* 站點清單 */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {itinerary.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    目前尚未新增停靠點，點擊上方表單加入第一站吧！
                  </div>
                ) : (
                  itinerary.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 hover:shadow-xs transition-all text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-indigo-100 text-indigo-700">
                          Day {item.day}
                        </span>
                        <span className="text-slate-400 font-mono text-[11px]">{item.time}</span>
                        <span className="font-semibold text-slate-800">{item.spot}</span>
                        {item.note && (
                          <span className="text-slate-400 hidden sm:inline">- {item.note}</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteSpot(item.id)}
                        className="text-slate-300 hover:text-rose-500 p-1 rounded transition-colors"
                        title="刪除此站點"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {}
          {/* ================= 右側：即時彙整面板 (5 欄寬，Sticky) ================= */}
          <div className="lg:col-span-5 lg:sticky lg:top-20 space-y-6">
            
            {/* 總開銷與人均核心卡片 (雙幣別呈現) */}
            <div className="bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl shadow-indigo-950/20 relative overflow-hidden">
              {/* 背景微光裝飾 */}
              <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -left-10 -top-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>總預估開銷 (全體 {passengers} 人)</span>
                  <span className="bg-white/10 px-2.5 py-0.5 rounded-full text-indigo-200 font-medium">
                    {days} 天 {passengers} 人同行
                  </span>
                </div>

                {/* 主幣別總金額 */}
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-sm text-indigo-300 font-bold">{currSymbol}</span>
                  <span className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                    {calculations.grandTotal.toLocaleString()}
                  </span>
                </div>

                {/* 換算次幣別標註 */}
                <div className="text-xs text-emerald-400 font-semibold mb-4 flex items-center gap-1">
                  <ArrowRightLeft className="w-3 h-3 inline" />
                  <span>約 {currency === 'JPY' ? 'NT$' : '¥'} {calculations.convertedGrandTotal.toLocaleString()} {currency === 'JPY' ? '台幣' : '日圓'}</span>
                  <span className="text-slate-400 text-[10px] font-normal">(匯率 1 JPY = {exchangeRate} TWD)</span>
                </div>

                {/* 每人分攤亮點卡片 */}
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

                {/* 關鍵指標行 */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/10 text-center">
                  <div>
                    <div className="text-[10px] text-slate-400">總行駛里程</div>
                    <div className="text-xs sm:text-sm font-bold text-white mt-0.5">{distanceKm} km</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">每公里成本</div>
                    <div className="text-xs sm:text-sm font-bold text-white mt-0.5">{currSymbol} {calculations.costPerKm}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">預估耗油量</div>
                    <div className="text-xs sm:text-sm font-bold text-white mt-0.5">{calculations.fuelLiters} L</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 開銷佔比分析面板 */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-semibold text-slate-800 text-sm">各類費用分佈與佔比</h3>
                </div>
                <span className="text-[11px] text-slate-400">即時雙幣計算</span>
              </div>

              {/* 橫向堆疊色彩條 */}
              <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex mb-4">
                {calculations.categories.map((cat, idx) => {
                  const percentage = calculations.grandTotal > 0 
                    ? (cat.amount / calculations.grandTotal) * 100 
                    : 0;
                  return (
                    <div
                      key={idx}
                      style={{ width: `${percentage}%` }}
                      className={`${cat.color} h-full transition-all duration-300`}
                      title={`${cat.name}: ${currSymbol} ${cat.amount.toLocaleString()} (${percentage.toFixed(1)}%)`}
                    />
                  );
                })}
              </div>

              {/* 詳細細項清單 */}
              <div className="space-y-2.5">
                {calculations.categories.map((cat, idx) => {
                  const pct = calculations.grandTotal > 0 
                    ? ((cat.amount / calculations.grandTotal) * 100).toFixed(1) 
                    : 0;
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

              {/* 車輛 vs 生活開銷二分比對 */}
              <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-500 font-medium block mb-0.5">行車交通相關</span>
                  <span className="text-sm font-bold text-slate-800">
                    {currSymbol} {calculations.drivingTotal.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-emerald-600 block mt-0.5">
                    ≈ {currency === 'JPY' ? 'NT$' : '¥'} {calculations.convertedDrivingTotal.toLocaleString()}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-500 font-medium block mb-0.5">住宿生活相關</span>
                  <span className="text-sm font-bold text-slate-800">
                    {currSymbol} {calculations.otherTotal.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-emerald-600 block mt-0.5">
                    ≈ {currency === 'JPY' ? 'NT$' : '¥'} {calculations.convertedOtherTotal.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {}
            {/* 日本自駕實用小貼士卡片 */}
            <div className="bg-rose-50/80 border border-rose-200/70 rounded-2xl p-4 text-xs text-rose-950 flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block text-rose-900">🇯🇵 日本自駕注意事項與省錢指南</span>
                <ul className="list-disc list-inside space-y-1 text-rose-800/90 text-[11px] leading-relaxed">
                  <li><strong>右駕靠左行駛</strong>：右轉為大轉彎、左轉為小轉彎，雨刷與方向燈位置相反。</li>
                  <li><strong>安心險不可省</strong>：強烈建議加購免責賠償 (CDW) 與營業損失賠償 (NOC)。</li>
                  <li><strong>ETC & 高速公路周遊券</strong>：長途跨區推薦租借 ETC 卡並搭配 HEP/KEP 等周遊券省下過路費。</li>
                  <li><strong>加油種類</strong>：一般租賃轎車多加 <strong>レギュラー (Regular / 紅色油槍)</strong>，還車前務必滿油還車並保留加油發票。</li>
                </ul>
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}

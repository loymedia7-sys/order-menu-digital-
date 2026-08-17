import React, { useState, useEffect, useRef } from 'react';
import { 
  ChefHat, 
  Volume2, 
  Printer, 
  Flame, 
  Clock, 
  CheckCircle2, 
  Play, 
  RefreshCw, 
  AlertTriangle,
  FileText,
  Sparkles,
  Check,
  Send,
  X
} from 'lucide-react';
import { Order, RestaurantConfig, OrderStatus } from '../../types';
import { executeKitchenAlertSequence, playKitchenBell, playKhmerWebSpeech } from '../../lib/audioAlert';
import { getKhmerNumberWord, getKhmerDigits, getKhmerOrderAnnouncement } from '../../lib/khmerNumerals';
import { generateEscPosPrintJob, dispatchRawBtPrint } from '../../lib/escpos';
import { markOrderAnnounced, markOrderPrinted, updateOrderStatus, generateKhmerOrderTTS } from '../../services/api';

interface KitchenTabletProps {
  orders: Order[];
  onRefreshOrders: () => void;
  config: RestaurantConfig;
  lang: 'km' | 'en';
  onOpenReceiptModal: (order: Order) => void;
  onStatusChange?: (orderId: string, status: OrderStatus) => Promise<void> | void;
}

export const KitchenTablet: React.FC<KitchenTabletProps> = ({
  orders,
  onRefreshOrders,
  config,
  lang,
  onOpenReceiptModal,
  onStatusChange,
}) => {
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [lastAnnouncedOrder, setLastAnnouncedOrder] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'preparing' | 'ready'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [isTestingAudio, setIsTestingAudio] = useState(false);
  const [testTableNumber, setTestTableNumber] = useState<number>(1);
  const [showTableTester, setShowTableTester] = useState(false);
  const [autoPrintEnabled, setAutoPrintEnabled] = useState(config.printerAutoPrint ?? true);

  // Sound & Speech Queue Processing for Live Orders
  const processingRef = useRef(false);

  // Auto-unlock Web Audio on first interaction anywhere on screen
  useEffect(() => {
    const unlockHandler = () => {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          ctx.resume().catch(() => {});
        }
        setAudioUnlocked(true);
      } catch (e) {}
    };

    window.addEventListener('click', unlockHandler, { once: true });
    window.addEventListener('touchstart', unlockHandler, { once: true });

    return () => {
      window.removeEventListener('click', unlockHandler);
      window.removeEventListener('touchstart', unlockHandler);
    };
  }, []);

  useEffect(() => {
    // Check if there are any unannounced new orders
    const unannounced = orders.filter((o) => !o.announced && o.status === 'new');
    if (unannounced.length > 0 && !processingRef.current) {
      handleProcessOrderAlert(unannounced[0]);
    }
  }, [orders]);

  const handleProcessOrderAlert = async (order: Order) => {
    if (processingRef.current) return;
    processingRef.current = true;
    setIsProcessingQueue(true);

    try {
      // 1. Fetch natural Khmer TTS audio for this specific table number from Gemini TTS API
      const announcement = getKhmerOrderAnnouncement(order.tableNumber);
      let audioBase64: string | undefined;
      let khmerText = announcement.naturalSentence;

      try {
        const ttsRes = await generateKhmerOrderTTS(order.tableNumber, order.items.length, order.total, config.ttsVoice);
        if (ttsRes.audioBase64) {
          audioBase64 = ttsRes.audioBase64;
        }
        if (ttsRes.text) {
          khmerText = ttsRes.text;
        }
      } catch (err) {
        console.warn('Gemini TTS fetch fallback to Web Speech:', err);
      }

      // 2. Play Kitchen Bell + Gemini Khmer TTS (with authentic Cambodian Khmer pronunciation)
      await executeKitchenAlertSequence(order.tableNumber, audioBase64, khmerText);

      // 3. Mark announced in backend safely
      try {
        await markOrderAnnounced(order.id, true);
        setLastAnnouncedOrder(order.id);
      } catch (err) {
        console.warn('Mark announced non-fatal notice:', err);
      }

      // 4. If auto-print is enabled, trigger print job safely on Android or mark printed
      if (autoPrintEnabled) {
        try {
          const escPos = generateEscPosPrintJob(order, config);
          dispatchRawBtPrint(escPos.rawBtUrl);
        } catch (e) {
          console.warn('Auto-print dispatch notice:', e);
        }
        try {
          await markOrderPrinted(order.id, true);
        } catch (e) {}
      }

      onRefreshOrders();
    } catch (err) {
      console.warn('Non-fatal kitchen order alert handling notice:', err);
    } finally {
      processingRef.current = false;
      setIsProcessingQueue(false);
    }
  };

  const handleManualReplay = async (order: Order) => {
    const announcement = getKhmerOrderAnnouncement(order.tableNumber);
    try {
      const ttsRes = await generateKhmerOrderTTS(order.tableNumber, order.items.length, order.total, config.ttsVoice);
      await executeKitchenAlertSequence(order.tableNumber, ttsRes.audioBase64, ttsRes.text || announcement.naturalSentence);
    } catch (e) {
      await executeKitchenAlertSequence(order.tableNumber, undefined, announcement.naturalSentence);
    }
  };

  const handleManualPrint = (order: Order) => {
    onOpenReceiptModal(order);
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      if (onStatusChange) {
        await onStatusChange(orderId, newStatus);
      }
      await updateOrderStatus(orderId, newStatus);
      onRefreshOrders();
    } catch (err) {
      console.error('Status update error:', err);
    }
  };

  const handleTestKitchenBell = async () => {
    setIsTestingAudio(true);
    await playKitchenBell();
    setIsTestingAudio(false);
    setAudioUnlocked(true);
  };

  const handleTestKhmerTTS = async (tableNum?: number) => {
    const targetTable = tableNum !== undefined ? tableNum : testTableNumber;
    setIsTestingAudio(true);
    setAudioUnlocked(true);
    const announcement = getKhmerOrderAnnouncement(targetTable);
    try {
      const res = await generateKhmerOrderTTS(targetTable, 3, 12.50, config.ttsVoice);
      await executeKitchenAlertSequence(targetTable, res.audioBase64, res.text || announcement.naturalSentence);
    } catch (e) {
      await playKhmerWebSpeech(announcement.naturalSentence, targetTable);
    } finally {
      setIsTestingAudio(false);
    }
  };

  // Filter orders
  const activeOrders = orders.filter((o) => {
    if (statusFilter === 'active') {
      return o.status === 'new' || o.status === 'preparing' || o.status === 'ready';
    }
    if (statusFilter === 'new') return o.status === 'new';
    if (statusFilter === 'preparing') return o.status === 'preparing';
    if (statusFilter === 'ready') return o.status === 'ready';
    if (statusFilter === 'completed') return o.status === 'completed' || o.status === 'served';
    return true;
  });

  const newOrdersCount = orders.filter((o) => o.status === 'new').length;
  const preparingOrdersCount = orders.filter((o) => o.status === 'preparing').length;
  const readyOrdersCount = orders.filter((o) => o.status === 'ready').length;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-4 pb-20">
      {/* Kitchen Tablet Command Center Header */}
      <div className="bg-stone-900 text-white rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {config.logoUrl ? (
            <img
              src={config.logoUrl}
              alt={config.name_en || 'Store Logo'}
              className="w-12 h-12 rounded-xl object-cover border border-stone-700 bg-stone-800 shadow-md shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold shadow-md shrink-0">
              <ChefHat className="w-7 h-7" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold font-khmer">
                {lang === 'km' 
                  ? (config.name_km ? `${config.name_km} - អេក្រង់ចុងភៅ` : 'អេក្រង់ចុងភៅ & ម៉ាស៊ីនព្រីន PP587') 
                  : (config.name_en ? `${config.name_en} - Kitchen Live` : 'Kitchen Live Screen & PP587 POS')}
              </h1>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                LIVE STREAM
              </span>
            </div>
            <p className="text-xs text-stone-400 font-battambang">
              {lang === 'km' 
                ? 'សំឡេងរោទិ៍ Bell • សំឡេងខ្មែរ Gemini TTS គ្រប់តុទាំងអស់ (តុ១-១០០+) • ព្រីនវិក្កយបត្រ RawBT' 
                : 'Kitchen Bell Alert • Gemini Khmer TTS Voice for ALL Tables (1-100+) • RawBT ESC/POS Auto-Print'}
            </p>
          </div>
        </div>

        {/* Action & Diagnostics Tools */}
        <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto">
          {/* Test Kitchen Bell */}
          <button
            id="test-bell-btn"
            onClick={handleTestKitchenBell}
            disabled={isTestingAudio}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-stone-800 hover:bg-stone-700 text-amber-300 px-3 py-2 rounded-xl text-xs font-bold border border-stone-700 transition"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>{lang === 'km' ? 'តេស្តកណ្ដឹង' : 'Test Bell'}</span>
          </button>

          {/* Test Khmer TTS for selected / any table */}
          <button
            id="test-khmer-tts-btn"
            onClick={() => handleTestKhmerTTS(testTableNumber)}
            disabled={isTestingAudio}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-md transition font-khmer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {isTestingAudio
                ? (lang === 'km' ? 'កំពុងនិយាយ...' : 'Speaking...')
                : (lang === 'km' ? `តេស្តសំឡេងខ្មែរ (តុ ${testTableNumber})` : `Test Voice (Table ${testTableNumber})`)}
            </span>
          </button>

          {/* Toggle Table Picker Bar */}
          <button
            type="button"
            onClick={() => setShowTableTester(!showTableTester)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1 ${
              showTableTester
                ? 'bg-amber-500 text-stone-950 border-amber-400'
                : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
            }`}
          >
            <span>{lang === 'km' ? 'ជ្រើសរើសតុ' : 'Choose Table'}</span>
            <span className="font-mono text-[10px] bg-stone-900/40 px-1.5 py-0.5 rounded">T-{testTableNumber}</span>
          </button>

          {/* Auto-print toggle */}
          <button
            id="toggle-auto-print-btn"
            onClick={() => setAutoPrintEnabled(!autoPrintEnabled)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition ${
              autoPrintEnabled
                ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                : 'bg-stone-800 text-stone-400 border-stone-700'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{autoPrintEnabled ? 'Auto-Print: ON' : 'Auto-Print: OFF'}</span>
          </button>
        </div>
      </div>

      {/* Interactive All-Table Voice Testing Station */}
      {showTableTester && (
        <div className="bg-stone-800 text-white p-4 rounded-2xl border border-stone-700 shadow-md space-y-3 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-700/80 pb-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-xs sm:text-sm font-khmer text-amber-300">
                {lang === 'km' ? 'ផ្ទាំងសាកល្បងសំឡេងខ្មែរគ្រប់តុទាំងអស់ (Test Any Table Voice Alert)' : 'All-Tables Voice Testing Bar'}
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs text-stone-400">
              <span>Voice: <strong className="text-amber-300">{config.ttsVoice || 'Kore'}</strong></span>
              <span>•</span>
              <span className="font-khmer">{getKhmerOrderAnnouncement(testTableNumber).naturalSentence}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-stone-400 mr-1 font-khmer">
              {lang === 'km' ? 'ចុចស្តាប់ភ្លាមៗ:' : 'Quick Tap:'}
            </span>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 20].map((tNum) => {
              const isSelected = testTableNumber === tNum;
              const ann = getKhmerOrderAnnouncement(tNum);
              return (
                <button
                  key={tNum}
                  type="button"
                  onClick={() => {
                    setTestTableNumber(tNum);
                    handleTestKhmerTTS(tNum);
                  }}
                  disabled={isTestingAudio}
                  title={ann.naturalSentence}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                    isSelected
                      ? 'bg-amber-500 text-stone-950 shadow-md scale-105'
                      : 'bg-stone-700/80 text-stone-200 hover:bg-stone-600 hover:text-white'
                  }`}
                >
                  <span>តុ {tNum}</span>
                  <span className="text-[10px] opacity-75 font-khmer">({ann.khmerWord})</span>
                </button>
              );
            })}

            {/* Custom table number input */}
            <div className="flex items-center gap-1 ml-auto">
              <span className="text-[11px] text-stone-400 font-khmer">{lang === 'km' ? 'តុផ្សេងទៀត:' : 'Other:'}</span>
              <input
                type="number"
                min="1"
                max="100"
                value={testTableNumber}
                onChange={(e) => setTestTableNumber(Math.max(1, Number(e.target.value) || 1))}
                className="w-16 px-2 py-1 bg-stone-900 border border-stone-700 rounded-lg text-center text-xs font-bold text-amber-300 font-mono"
              />
              <button
                type="button"
                onClick={() => handleTestKhmerTTS(testTableNumber)}
                disabled={isTestingAudio}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold font-khmer shadow-xs"
              >
                {lang === 'km' ? 'ស្តាប់' : 'Play'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Order Incoming Alert Banner */}
      {newOrdersCount > 0 && (
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white p-4 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-3 animate-pulse border-2 border-white/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-red-600 flex items-center justify-center font-extrabold shadow-md">
              <Flame className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base font-khmer">
                  {lang === 'km' ? `មានការកម្មង់ថ្មី ${newOrdersCount} តុ!` : `${newOrdersCount} New Table Order(s) Incoming!`}
                </span>
                <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  Instant Sync
                </span>
              </div>
              <p className="text-xs text-rose-100 font-battambang">
                {lang === 'km' 
                  ? 'សំឡេងកណ្ដឹង Bell & សំឡេងប្រកាសខ្មែរបានចាក់ជូនចុងភៅរួចរាល់' 
                  : 'Kitchen Bell chime and natural Khmer TTS announcement active'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const latestNew = orders.find(o => o.status === 'new');
                if (latestNew) handleManualReplay(latestNew);
              }}
              className="bg-white hover:bg-stone-100 text-stone-900 px-3.5 py-2 rounded-xl text-xs font-extrabold shadow-md flex items-center gap-1.5 transition active:scale-95 font-khmer"
            >
              <Volume2 className="w-4 h-4 text-red-600" />
              <span>{lang === 'km' ? 'ស្តាប់ប្រកាសម្តងទៀត' : 'Replay Announcement'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Audio Status Warning Banner if sound might be blocked */}
      {!audioUnlocked && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Volume2 className="w-5 h-5 text-amber-500 shrink-0" />
            <p className="text-xs text-amber-900 font-medium">
              {lang === 'km' 
                ? 'សូមចុចត្រង់នេះ ឬប៉ះអេក្រង់ម្តង ដើម្បីបើកសំឡេងប្រកាស Khmer TTS ស្វ័យប្រវត្តិ' 
                : 'Tap anywhere or click to enable automatic Kitchen Khmer Voice Announcements'}
            </p>
          </div>
          <button
            onClick={() => handleTestKhmerTTS(testTableNumber)}
            className="bg-amber-500 hover:bg-amber-600 text-stone-950 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 shadow-xs font-khmer"
          >
            {lang === 'km' ? 'បើកសំឡេងឥឡូវនេះ' : 'Enable Voice'}
          </button>
        </div>
      )}

      {/* Queue Status Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setStatusFilter('all')}
          className={`p-3 rounded-xl border text-left transition ${
            statusFilter === 'all'
              ? 'bg-stone-900 text-white border-stone-900'
              : 'bg-white text-stone-800 border-stone-200 hover:bg-stone-50'
          }`}
        >
          <span className="text-[11px] text-stone-400 font-semibold block uppercase">
            {lang === 'km' ? 'ការកម្មង់ទាំងអស់' : 'Total Orders'}
          </span>
          <span className="text-xl font-extrabold">{orders.length}</span>
        </button>

        <button
          onClick={() => setStatusFilter('new')}
          className={`p-3 rounded-xl border text-left transition ${
            statusFilter === 'new'
              ? 'bg-red-600 text-white border-red-600'
              : 'bg-red-50 text-red-950 border-red-200 hover:bg-red-100'
          }`}
        >
          <span className="text-[11px] font-semibold block uppercase opacity-80 flex items-center gap-1">
            <Flame className="w-3 h-3" />
            <span>{lang === 'km' ? 'ត្រូវការធ្វើបន្ទាន់' : 'New / Pending'}</span>
          </span>
          <span className="text-xl font-extrabold flex items-center justify-between">
            <span>{newOrdersCount}</span>
            {newOrdersCount > 0 && <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('preparing')}
          className={`p-3 rounded-xl border text-left transition ${
            statusFilter === 'preparing'
              ? 'bg-amber-600 text-white border-amber-600'
              : 'bg-amber-50 text-amber-950 border-amber-200 hover:bg-amber-100'
          }`}
        >
          <span className="text-[11px] font-semibold block uppercase opacity-80 flex items-center gap-1">
            <ChefHat className="w-3 h-3" />
            <span>{lang === 'km' ? 'កំពុងចម្អិន' : 'Cooking'}</span>
          </span>
          <span className="text-xl font-extrabold">{preparingOrdersCount}</span>
        </button>

        <button
          onClick={() => setStatusFilter('ready')}
          className={`p-3 rounded-xl border text-left transition ${
            statusFilter === 'ready'
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-emerald-50 text-emerald-950 border-emerald-200 hover:bg-emerald-100'
          }`}
        >
          <span className="text-[11px] font-semibold block uppercase opacity-80 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>{lang === 'km' ? 'រួចរាល់លើកជូន' : 'Ready to Serve'}</span>
          </span>
          <span className="text-xl font-extrabold">{readyOrdersCount}</span>
        </button>
      </div>

      {/* Orders Grid / Kitchen Ticket Cards */}
      {activeOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-3 shadow-2xs">
          <ChefHat className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="font-bold text-lg text-stone-700 font-khmer">
            {lang === 'km' ? 'មិនទាន់មានការកម្មង់ដែលត្រូវធ្វើនៅឡើយទេ' : 'No active kitchen tickets in this view'}
          </h3>
          <p className="text-xs text-stone-400 max-w-sm mx-auto">
            {lang === 'km' 
              ? 'ពេលភ្ញៀវស្កេន QR កូដលើតុរួចកម្មង់ ការកម្មង់នឹងលោតមកទីនេះភ្លាមៗជាមួយសំឡេងរោទិ៍ និងសំឡេងខ្មែរ!' 
              : 'When customers scan table QRs and submit orders, tickets will pop up live with sound alerts & speech!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {activeOrders.map((order) => {
            const isNew = order.status === 'new';
            const isPreparing = order.status === 'preparing';
            const isReady = order.status === 'ready';

            return (
              <div
                key={order.id}
                className={`bg-white rounded-2xl border shadow-sm flex flex-col justify-between overflow-hidden transition-all duration-300 ${
                  isNew
                    ? 'border-red-500 ring-2 ring-red-500/30'
                    : isPreparing
                    ? 'border-amber-400'
                    : isReady
                    ? 'border-emerald-500 bg-emerald-50/20'
                    : 'border-stone-200'
                }`}
              >
                {/* Header Ticket Bar */}
                <div className={`p-4 text-white flex items-center justify-between ${
                  isNew
                    ? 'bg-gradient-to-r from-red-600 to-red-700'
                    : isPreparing
                    ? 'bg-gradient-to-r from-amber-600 to-amber-700'
                    : isReady
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-700'
                    : 'bg-stone-800'
                }`}>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-80 flex items-center gap-1">
                      {isNew && <Flame className="w-3 h-3 text-amber-300" />}
                      {isPreparing && <ChefHat className="w-3 h-3 text-amber-200" />}
                      {isReady && <CheckCircle2 className="w-3 h-3 text-emerald-200" />}
                      <span>
                        {isNew ? (lang === 'km' ? 'ការកម្មង់ថ្មី' : 'NEW ORDER') : isPreparing ? (lang === 'km' ? 'កំពុងធ្វើ' : 'COOKING') : isReady ? (lang === 'km' ? 'រួចរាល់' : 'READY') : 'COMPLETED'}
                      </span>
                    </span>
                    <h3 className="text-2xl font-black tracking-tight font-kulen">
                      TABLE #{order.tableNumber}
                    </h3>
                    <span className="text-xs font-semibold opacity-90 font-kulen">
                      ( តុលេខ {order.tableNumber} )
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono font-bold bg-black/25 px-2 py-1 rounded-md block">
                      #{order.orderNumber}
                    </span>
                    <span className="text-[10px] opacity-80 mt-1 block">
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Body Items List */}
                <div className="p-4 flex-1 space-y-3 divide-y divide-stone-100">
                  {/* Guest note if any */}
                  {order.customerNote && (
                    <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-xs text-amber-900 font-semibold flex items-start gap-1.5 font-battambang">
                      <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <span>{order.customerNote}</span>
                    </div>
                  )}

                  <div className="space-y-2.5 pt-2 first:pt-0">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-start justify-between gap-2 text-xs">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-md bg-stone-900 text-white font-extrabold flex items-center justify-center text-xs">
                              {item.quantity}x
                            </span>
                            <span className="font-bold text-stone-900 text-sm font-kulen tracking-wide">
                              {item.name_km}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-500 ml-8 font-medium font-battambang">
                            {item.name_en}
                          </p>

                          {/* Customizations tags */}
                          {(item.selectedSpicy || item.selectedSweetness || item.notes) && (
                            <div className="ml-8 mt-1 flex flex-wrap gap-1 font-battambang">
                              {item.selectedSpicy && (
                                <span className="bg-red-100 text-red-800 text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                                  {item.selectedSpicy}
                                </span>
                              )}
                              {item.selectedSweetness && (
                                <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                                  {item.selectedSweetness}
                                </span>
                              )}
                              {item.notes && (
                                <span className="bg-stone-100 text-stone-700 text-[10px] font-medium px-1.5 py-0.5 rounded-sm">
                                  {item.notes}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <span className="font-bold text-stone-800 font-mono">
                          ${item.itemTotal.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Total summary */}
                  <div className="pt-2 flex items-center justify-between text-xs font-bold text-stone-700 font-battambang">
                    <span>{lang === 'km' ? 'សរុបវិក្កយបត្រ' : 'Order Total'}:</span>
                    <span className="text-amber-700 font-extrabold text-sm">
                      ${order.total.toFixed(2)} ({order.total_khr.toLocaleString()} ៛)
                    </span>
                  </div>
                </div>

                {/* Footer Controls / Status Buttons */}
                <div className="p-3 bg-stone-50 border-t border-stone-200 flex flex-col gap-2">
                  {/* Status Progression */}
                  <div className="grid grid-cols-2 gap-2">
                    {isNew && (
                      <button
                        onClick={() => handleStatusChange(order.id, 'preparing')}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-3 rounded-xl text-xs shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5 font-khmer"
                      >
                        <ChefHat className="w-3.5 h-3.5" />
                        <span>{lang === 'km' ? 'ចាប់ផ្តើមធ្វើ' : 'Start Cooking'}</span>
                      </button>
                    )}

                    {isPreparing && (
                      <button
                        onClick={() => handleStatusChange(order.id, 'ready')}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-xl text-xs shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5 font-khmer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{lang === 'km' ? 'រួចរាល់' : 'Mark Ready'}</span>
                      </button>
                    )}

                    {isReady && (
                      <button
                        onClick={() => handleStatusChange(order.id, 'served')}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-xl text-xs shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5 font-khmer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{lang === 'km' ? 'បានលើកជូន' : 'Mark Served'}</span>
                      </button>
                    )}

                    {/* Cancel Order Action (Only for New or Preparing orders) */}
                    {(isNew || isPreparing) && (
                      <button
                        onClick={() => {
                          const confirmMsg = lang === 'km' 
                            ? `តើចុងភៅពិតជាចង់បោះបង់ការកម្មង់តុលេខ #${order.tableNumber} មែនទេ?` 
                            : `Cancel order for Table #${order.tableNumber}?`;
                          if (window.confirm(confirmMsg)) {
                            handleStatusChange(order.id, 'cancelled');
                          }
                        }}
                        className="w-full bg-stone-100 hover:bg-red-50 text-red-600 hover:text-red-700 font-bold py-2 px-3 rounded-xl text-xs border border-red-200 shadow-2xs transition active:scale-95 flex items-center justify-center gap-1.5 font-khmer"
                      >
                        <X className="w-3.5 h-3.5 text-red-500" />
                        <span>{lang === 'km' ? 'បោះបង់ការកម្មង់' : 'Cancel Order'}</span>
                      </button>
                    )}

                    {/* Print Receipt / RawBT */}
                    <button
                      onClick={() => handleManualPrint(order)}
                      className="flex items-center justify-center gap-1.5 bg-white hover:bg-stone-100 text-stone-800 font-bold py-2 px-3 rounded-xl text-xs border border-stone-300 shadow-2xs transition font-khmer"
                    >
                      <Printer className="w-3.5 h-3.5 text-stone-600" />
                      <span>{lang === 'km' ? 'ព្រីន PP587' : 'Print PP587'}</span>
                    </button>
                  </div>

                  {/* Replay voice button */}
                  <button
                    onClick={() => handleManualReplay(order)}
                    className="w-full flex items-center justify-center gap-1.5 bg-stone-200/80 hover:bg-stone-300 text-stone-800 font-semibold py-1.5 rounded-lg text-[11px] transition font-khmer"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-amber-700" />
                    <span>
                      {lang === 'km' ? 'ស្តាប់សំឡេងខ្មែរម្តងទៀត' : 'Replay Khmer Voice Alert'}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

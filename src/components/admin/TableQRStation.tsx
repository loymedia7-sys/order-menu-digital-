import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { QrCode, Printer, Download, UtensilsCrossed, Sparkles, RefreshCw } from 'lucide-react';
import { RestaurantConfig } from '../../types';

interface TableQRStationProps {
  config: RestaurantConfig;
  lang: 'km' | 'en';
  tenantId?: string;
}

interface TableQRItem {
  tableNumber: number;
  url: string;
  qrDataUrl: string;
}

export const TableQRStation: React.FC<TableQRStationProps> = ({
  config,
  lang,
  tenantId,
}) => {
  const [qrList, setQrList] = useState<TableQRItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState(true);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://menu.tableqr.kh';

  useEffect(() => {
    generateAllQRCodes();
  }, [config.tablesCount, config.id, config.logoUrl, config.name_km, config.name_en, tenantId, baseUrl]);

  const generateSingleQRWithLogo = async (tableUrl: string, logoUrl?: string): Promise<string> => {
    // Generate QR on an off-screen canvas with high error correction (H = 30% recovery)
    const canvas = document.createElement('canvas');
    canvas.width = 360;
    canvas.height = 360;

    await QRCode.toCanvas(canvas, tableUrl, {
      width: 360,
      margin: 2,
      color: {
        dark: '#1c1917', // stone-900
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    });

    // If a logo is provided, embed it neatly in the center
    if (logoUrl) {
      try {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          await new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve(); // continue without center logo if load fails
            img.src = logoUrl;
          });

          if (img.complete && img.naturalWidth > 0) {
            const logoSize = 80;
            const center = (360 - logoSize) / 2;
            const padding = 6;
            const badgeSize = logoSize + padding * 2;
            const badgeCenter = (360 - badgeSize) / 2;
            const radius = 16;

            // Draw white background container with shadow for high contrast readability
            ctx.save();
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.18)';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            if (typeof (ctx as any).roundRect === 'function') {
              (ctx as any).roundRect(badgeCenter, badgeCenter, badgeSize, badgeSize, radius + 4);
            } else {
              ctx.rect(badgeCenter, badgeCenter, badgeSize, badgeSize);
            }
            ctx.fill();

            // Clip to rounded rectangle for the store logo
            ctx.beginPath();
            if (typeof (ctx as any).roundRect === 'function') {
              (ctx as any).roundRect(center, center, logoSize, logoSize, radius);
            } else {
              ctx.rect(center, center, logoSize, logoSize);
            }
            ctx.clip();
            ctx.drawImage(img, center, center, logoSize, logoSize);
            ctx.restore();
          }
        }
      } catch (err) {
        console.warn('QR logo embed notice:', err);
      }
    }

    return canvas.toDataURL('image/png');
  };

  const generateAllQRCodes = async () => {
    setIsGenerating(true);
    const tablesCount = config.tablesCount || 20;
    const items: TableQRItem[] = [];
    const activeShopId = tenantId || config.id || 'main-restaurant';
    const shopParam = `&shop=${encodeURIComponent(activeShopId)}`;

    for (let i = 1; i <= tablesCount; i++) {
      const tableUrl = `${baseUrl}/?table=${i}${shopParam}`;
      try {
        const qrDataUrl = await generateSingleQRWithLogo(tableUrl, config.logoUrl);
        items.push({ tableNumber: i, url: tableUrl, qrDataUrl });
      } catch (err) {
        console.error('QR generation error for table', i, err);
      }
    }

    setQrList(items);
    setIsGenerating(false);
  };

  const handlePrintSheet = () => {
    window.print();
  };

  const handleDownloadSingleQR = (item: TableQRItem) => {
    const link = document.createElement('a');
    link.download = `TableQR_Table_${item.tableNumber}_${config.name_en.replace(/\s+/g, '_')}.png`;
    link.href = item.qrDataUrl;
    link.click();
  };

  const currentItem = qrList.find((q) => q.tableNumber === selectedTable) || qrList[0];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6 pb-24">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-stone-900 to-stone-900 text-white rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-khmer">
              {lang === 'km' ? 'ស្ថានីយ៍បង្កើតប័ណ្ណ QR កូដលើតុ' : 'Tabletop QR Code Generator'}
            </h1>
            <p className="text-xs text-stone-300">
              {lang === 'km' 
                ? 'បង្កើតប័ណ្ណ QR សម្រាប់តុនីមួយៗ (តុ ១ ដល់ ២០) ដើម្បីឱ្យភ្ញៀវស្កេនកម្មង់ភ្លាមៗ' 
                : 'Generate high-resolution QR tent cards for tables 1 to 20 for seamless scan-to-order'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            id="print-all-qr-sheet-btn"
            onClick={handlePrintSheet}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-4 py-2.5 rounded-xl text-xs shadow-md transition"
          >
            <Printer className="w-4 h-4" />
            <span>{lang === 'km' ? 'ព្រីនប័ណ្ណទាំងអស់ (Print Sheet)' : 'Print All QR Cards'}</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Table List Selector */}
        <div className="bg-white rounded-2xl border border-stone-200 p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-stone-900 font-khmer">
              {lang === 'km' ? 'បញ្ជីតុទាំងអស់' : 'Select Table Card'}
            </h3>
            <span className="text-xs bg-stone-100 text-stone-600 font-semibold px-2 py-0.5 rounded-full">
              {qrList.length} {lang === 'km' ? 'តុ' : 'Tables'}
            </span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-4 gap-2 max-h-[480px] overflow-y-auto pr-1">
            {qrList.map((item) => (
              <button
                key={item.tableNumber}
                type="button"
                onClick={() => setSelectedTable(item.tableNumber)}
                className={`p-2.5 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 border ${
                  selectedTable === item.tableNumber
                    ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-600/30'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                }`}
              >
                <QrCode className="w-4 h-4 text-stone-500" />
                <span>{lang === 'km' ? `តុ ${item.tableNumber}` : `T-${item.tableNumber}`}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Realistic Tabletop Tent Card Preview */}
        {currentItem && (
          <div className="lg:col-span-2 flex flex-col items-center justify-center p-6 bg-stone-100 rounded-2xl border border-stone-200">
            {/* The Print Card Container */}
            <div 
              id="printable-qr-card"
              className="bg-white border-2 border-stone-900 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center space-y-4"
            >
              {/* Header Branding */}
              <div className="space-y-1.5 flex flex-col items-center">
                {config.logoUrl ? (
                  <img
                    src={config.logoUrl}
                    alt={config.name_en || 'Store Logo'}
                    className="w-12 h-12 rounded-2xl object-cover mx-auto shadow-md border-2 border-amber-500/40 bg-white"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center mx-auto shadow-sm">
                    <UtensilsCrossed className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-stone-900 font-kulen tracking-wide">
                    {config.name_km || 'ភោជនីយដ្ឋាន ស្មាតម៉ឺនុយ'}
                  </h3>
                  <p className="text-xs font-bold text-stone-500 tracking-wide uppercase font-sans">
                    {config.name_en || 'SmartMenu Restaurant'}
                  </p>
                </div>
              </div>

              {/* Huge Table Badge */}
              <div className="bg-stone-900 text-white w-full py-2.5 rounded-xl">
                <span className="text-[10px] tracking-widest uppercase font-bold text-amber-400 block">
                  TABLE NUMBER / តុលេខ
                </span>
                <span className="text-3xl sm:text-4xl font-black tracking-tight">
                  #{currentItem.tableNumber}
                </span>
              </div>

              {/* High-Resolution QR Code */}
              <div className="p-3 bg-white rounded-2xl border-2 border-stone-200 shadow-inner">
                <img
                  src={currentItem.qrDataUrl}
                  alt={`QR Code Table ${currentItem.tableNumber}`}
                  className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
                />
              </div>

              {/* Scan Call to Action */}
              <div className="space-y-1">
                <p className="font-bold text-xs sm:text-sm text-stone-900 font-khmer">
                  ស្កេនដើម្បីមើលម៉ឺនុយ & កម្មង់ម្ហូបភ្លាមៗ
                </p>
                <p className="text-[11px] text-stone-500">
                  Scan QR with Camera to Order Dishes to Kitchen
                </p>
                <p className="text-[10px] text-amber-700 font-mono font-medium pt-1">
                  {currentItem.url}
                </p>
              </div>
            </div>

            {/* Action Bar for Single Card */}
            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={() => handleDownloadSingleQR(currentItem)}
                className="flex items-center gap-1.5 bg-white hover:bg-stone-50 text-stone-800 font-bold px-4 py-2 rounded-xl text-xs border border-stone-300 shadow-2xs transition"
              >
                <Download className="w-4 h-4 text-blue-600" />
                <span>{lang === 'km' ? 'ទាញយក PNG (Download)' : 'Download PNG'}</span>
              </button>

              <button
                onClick={handlePrintSheet}
                className="flex items-center gap-1.5 bg-stone-900 hover:bg-black text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>{lang === 'km' ? 'ព្រីនប័ណ្ណនេះ' : 'Print This Card'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

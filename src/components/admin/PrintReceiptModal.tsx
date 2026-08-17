import React, { useState, useEffect } from 'react';
import { X, Printer, Bluetooth, Download, Check, Sparkles, AlertCircle } from 'lucide-react';
import { Order, RestaurantConfig } from '../../types';
import { generateEscPosPrintJob, printViaWebBluetooth, dispatchRawBtPrint } from '../../lib/escpos';

interface PrintReceiptModalProps {
  order: Order | null;
  onClose: () => void;
  config: RestaurantConfig;
  lang: 'km' | 'en';
}

export const PrintReceiptModal: React.FC<PrintReceiptModalProps> = ({
  order,
  onClose,
  config,
  lang,
}) => {
  useEffect(() => {
    if (order) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [order]);

  if (!order) return null;

  const [btStatus, setBtStatus] = useState<string | null>(null);
  const [isBtPrinting, setIsBtPrinting] = useState(false);

  const escPos = generateEscPosPrintJob(order, config);

  const handlePrintRawBT = () => {
    const res = dispatchRawBtPrint(escPos.rawBtUrl);
    if (!res.isAndroid) {
      setBtStatus(
        lang === 'km'
          ? 'កម្មវិធី RawBT ដំណើរការលើ Android Tablet/ទូរស័ព្ទ។ លើកុំព្យូទ័រ សូមប្រើ "Browser Print" ឬ "ព្រីន Bluetooth"។'
          : 'RawBT service is for Android tablets/phones. On PC/Mac, please use "Browser Print" or "Print via Bluetooth".'
      );
      // Also automatically trigger browser print dialog for convenience
      try {
        window.print();
      } catch (e) {}
    } else {
      setBtStatus(lang === 'km' ? 'បានផ្ញើទៅកាន់កម្មវិធី RawBT រួចរាល់!' : 'Sent print job to RawBT app!');
    }
  };

  const handlePrintWebBluetooth = async () => {
    setIsBtPrinting(true);
    setBtStatus(lang === 'km' ? 'កំពុងស្វែងរកម៉ាស៊ីនព្រីន Bluetooth...' : 'Connecting to Bluetooth printer...');
    try {
      const res = await printViaWebBluetooth(escPos.rawBytes);
      setBtStatus(res.message);
    } catch (err: any) {
      setBtStatus(err.message || 'Bluetooth connection failed');
    } finally {
      setIsBtPrinting(false);
    }
  };

  const handleDownloadBin = () => {
    const blob = new Blob([escPos.rawBytes], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Receipt_Order_${order.orderNumber}_Table_${order.tableNumber}.bin`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleNativePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-stone-950 flex items-center justify-center font-bold">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm font-khmer">
                {lang === 'km' ? 'ម៉ាស៊ីនព្រីនកម្តៅ PP587 (58mm ESC/POS)' : 'PP587 Thermal Receipt (58mm)'}
              </h3>
              <p className="text-[11px] text-stone-400">
                {lang === 'km' ? `តុលេខ ${order.tableNumber} • កូដ #${order.orderNumber}` : `Table #${order.tableNumber} • Order #${order.orderNumber}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-stone-800 text-stone-300 flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 bg-stone-100">
          {/* Thermal Receipt Visual Paper */}
          <div className="bg-white border-2 border-stone-300 shadow-md p-4 sm:p-5 rounded-lg font-mono text-[11px] text-stone-900 leading-tight space-y-1 select-all whitespace-pre-wrap">
            {escPos.printableText}
          </div>

          {btStatus && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{btStatus}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* RawBT App Trigger */}
            <button
              id="rawbt-print-trigger-btn"
              onClick={handlePrintRawBT}
              className="flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs shadow-md transition active:scale-98"
            >
              <Printer className="w-4 h-4" />
              <span>{lang === 'km' ? 'ព្រីនតាម RawBT App' : 'Print via RawBT App'}</span>
            </button>

            {/* Direct Web Bluetooth */}
            <button
              onClick={handlePrintWebBluetooth}
              disabled={isBtPrinting}
              className="flex items-center justify-center gap-1.5 bg-stone-900 hover:bg-black text-white font-bold py-2.5 px-3 rounded-xl text-xs shadow-md transition active:scale-98"
            >
              <Bluetooth className="w-4 h-4 text-blue-400" />
              <span>{lang === 'km' ? 'ព្រីន Bluetooth ផ្ទាល់' : 'Print via Bluetooth'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              onClick={handleDownloadBin}
              className="flex items-center gap-1 text-[11px] font-semibold text-stone-600 hover:text-stone-900 bg-white px-2.5 py-1.5 rounded-lg border border-stone-200"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .BIN</span>
            </button>

            <button
              onClick={handleNativePrint}
              className="flex items-center gap-1 text-[11px] font-semibold text-stone-600 hover:text-stone-900 bg-white px-2.5 py-1.5 rounded-lg border border-stone-200"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Browser Print</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

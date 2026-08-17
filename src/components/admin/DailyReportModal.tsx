import React, { useState, useMemo } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Calendar, 
  PieChart, 
  UtensilsCrossed, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  CreditCard,
  Hash,
  ChevronDown
} from 'lucide-react';
import { Order, RestaurantConfig, CategoryItem } from '../../types';
import { defaultCategories } from '../../data/initialData';

interface DailyReportModalProps {
  orders: Order[];
  config: RestaurantConfig;
  lang: 'km' | 'en';
  onClose: () => void;
}

export const DailyReportModal: React.FC<DailyReportModalProps> = ({
  orders,
  config,
  lang,
  onClose,
}) => {
  // Selected date string in YYYY-MM-DD format (defaults to local today)
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const categories = useMemo(() => {
    return config.categories && config.categories.length > 0 ? config.categories : defaultCategories;
  }, [config.categories]);

  // Filter orders for selected date
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
      return orderDate === selectedDate;
    });
  }, [orders, selectedDate]);

  // Non-cancelled orders for revenue & metrics
  const validOrders = useMemo(() => {
    return filteredOrders.filter(o => o.status !== 'cancelled');
  }, [filteredOrders]);

  const cancelledOrders = useMemo(() => {
    return filteredOrders.filter(o => o.status === 'cancelled');
  }, [filteredOrders]);

  // Financial Metrics
  const totalRevenueUsd = useMemo(() => {
    return validOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  }, [validOrders]);

  const totalRevenueKhr = useMemo(() => {
    return Math.round(totalRevenueUsd * (config.exchangeRate || 4100));
  }, [totalRevenueUsd, config.exchangeRate]);

  const avgOrderValueUsd = validOrders.length > 0 ? totalRevenueUsd / validOrders.length : 0;
  const avgOrderValueKhr = Math.round(avgOrderValueUsd * (config.exchangeRate || 4100));

  // Payment Method Breakdown
  const paymentBreakdown = useMemo(() => {
    const breakdown = {
      cash: { count: 0, usd: 0, khr: 0 },
      aba_khqr: { count: 0, usd: 0, khr: 0 },
      pending: { count: 0, usd: 0, khr: 0 },
    };

    validOrders.forEach(o => {
      const method = o.paymentMethod || 'cash';
      if (breakdown[method]) {
        breakdown[method].count += 1;
        breakdown[method].usd += o.total || 0;
        breakdown[method].khr += o.total_khr || Math.round((o.total || 0) * (config.exchangeRate || 4100));
      } else {
        breakdown.cash.count += 1;
        breakdown.cash.usd += o.total || 0;
        breakdown.cash.khr += o.total_khr || Math.round((o.total || 0) * (config.exchangeRate || 4100));
      }
    });

    return breakdown;
  }, [validOrders, config.exchangeRate]);

  // Status Breakdown
  const statusCounts = useMemo(() => {
    const counts = {
      new: 0,
      preparing: 0,
      ready: 0,
      served: 0,
      completed: 0,
      cancelled: 0,
    };
    filteredOrders.forEach(o => {
      if (counts[o.status] !== undefined) {
        counts[o.status] += 1;
      }
    });
    return counts;
  }, [filteredOrders]);

  // Item & Category Breakdown ("What kind of order")
  const itemSalesBreakdown = useMemo(() => {
    const itemMap: Record<string, {
      itemId: string;
      name_km: string;
      name_en: string;
      quantity: number;
      totalUsd: number;
      totalKhr: number;
      price: number;
    }> = {};

    validOrders.forEach(order => {
      order.items.forEach(item => {
        const key = item.itemId || item.name_en;
        if (!itemMap[key]) {
          itemMap[key] = {
            itemId: key,
            name_km: item.name_km,
            name_en: item.name_en,
            quantity: 0,
            totalUsd: 0,
            totalKhr: 0,
            price: item.price,
          };
        }
        itemMap[key].quantity += item.quantity;
        itemMap[key].totalUsd += item.itemTotal || (item.price * item.quantity);
        itemMap[key].totalKhr += Math.round((item.itemTotal || (item.price * item.quantity)) * (config.exchangeRate || 4100));
      });
    });

    return Object.values(itemMap).sort((a, b) => b.quantity - a.quantity);
  }, [validOrders, config.exchangeRate]);

  const totalItemsSold = useMemo(() => {
    return itemSalesBreakdown.reduce((sum, item) => sum + item.quantity, 0);
  }, [itemSalesBreakdown]);

  // Print PDF Trigger
  const handlePrintPdf = () => {
    window.print();
  };

  // Download Standalone PDF / HTML File
  const handleDownloadReportFile = () => {
    const reportTitle = `Daily_Report_${selectedDate}_${config.name_en.replace(/\s+/g, '_')}`;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to download/print the PDF report.');
      return;
    }

    const formattedDate = new Date(selectedDate).toLocaleDateString(lang === 'km' ? 'km-KH' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>${reportTitle}</title>

        <!-- Google Fonts Khmer -->
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Battambang:wght@400;700&family=Kulen&family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">

        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Plus Jakarta Sans', 'Battambang', system-ui, sans-serif;
            background: #ffffff;
            color: #1c1917;
            padding: 30px;
            font-size: 13px;
            line-height: 1.5;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 3px solid #d97706;
            padding-bottom: 16px;
            margin-bottom: 24px;
          }
          .restaurant-name-km {
            font-family: 'Kulen', 'Battambang', serif;
            font-size: 22px;
            color: #78350f;
            font-weight: bold;
          }
          .restaurant-name-en {
            font-size: 16px;
            font-weight: 700;
            color: #44403c;
          }
          .report-badge {
            background: #fef3c7;
            border: 1px solid #fde68a;
            color: #92400e;
            padding: 6px 14px;
            border-radius: 8px;
            font-weight: 800;
            text-align: right;
          }
          .grid-metrics {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 24px;
          }
          .metric-card {
            background: #fafaf9;
            border: 1px solid #e7e5e4;
            padding: 14px;
            border-radius: 12px;
          }
          .metric-label {
            font-size: 11px;
            color: #78716c;
            font-weight: 700;
            text-transform: uppercase;
            margin-bottom: 4px;
          }
          .metric-value-usd {
            font-size: 20px;
            font-weight: 800;
            color: #0f172a;
          }
          .metric-value-khr {
            font-size: 11px;
            color: #059669;
            font-weight: 700;
          }
          .section-title {
            font-family: 'Kulen', 'Battambang', sans-serif;
            font-size: 15px;
            font-weight: 700;
            color: #1c1917;
            margin-bottom: 12px;
            border-left: 4px solid #d97706;
            padding-left: 10px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
            font-size: 12px;
          }
          th {
            background: #f5f5f4;
            color: #44403c;
            font-weight: 700;
            text-align: left;
            padding: 10px 12px;
            border-bottom: 2px solid #e7e5e4;
          }
          td {
            padding: 10px 12px;
            border-bottom: 1px solid #f5f5f4;
          }
          tr:nth-child(even) {
            background: #fafaf9;
          }
          .text-right { text-align: right; }
          .font-khmer { font-family: 'Battambang', sans-serif; }
          .badge-status {
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
          }
          .bg-completed { background: #dcfce7; color: #166534; }
          .bg-cancelled { background: #fee2e2; color: #991b1b; }
          .bg-new { background: #fef3c7; color: #92400e; }
          .footer {
            border-top: 1px solid #e7e5e4;
            padding-top: 16px;
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            color: #78716c;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 20px; text-align: right;">
          <button onclick="window.print()" style="background: #d97706; color: white; border: none; padding: 10px 20px; font-weight: bold; border-radius: 8px; cursor: pointer;">
            🖨️ Print / Save as PDF
          </button>
        </div>

        <div class="header">
          <div>
            <div class="restaurant-name-km">${config.name_km || 'ភោជនីយដ្ឋាន'}</div>
            <div class="restaurant-name-en">${config.name_en || 'Restaurant'}</div>
            <div style="font-size: 11px; color: #78716c; margin-top: 4px;">
              ${config.address_km || config.address_en || ''} • Tel: ${config.phone || ''}
            </div>
          </div>
          <div class="report-badge">
            <div style="font-size: 14px; font-family: 'Kulen';">របាយការណ៍លក់ប្រចាំថ្ងៃ</div>
            <div style="font-size: 12px; margin-top: 2px;">Daily Revenue & Orders Report</div>
            <div style="font-size: 11px; color: #78716c; margin-top: 4px;">📅 Date: ${formattedDate}</div>
          </div>
        </div>

        <!-- 1. Executive Metrics -->
        <div class="grid-metrics">
          <div class="metric-card">
            <div class="metric-label">Total Revenue (ចំណូលសរុប)</div>
            <div class="metric-value-usd">$${totalRevenueUsd.toFixed(2)}</div>
            <div class="metric-value-khr">${totalRevenueKhr.toLocaleString()} ៛</div>
          </div>

          <div class="metric-card">
            <div class="metric-label">Total Orders (ការកម្មង់សរុប)</div>
            <div class="metric-value-usd">${filteredOrders.length}</div>
            <div class="metric-value-khr">${validOrders.length} valid • ${cancelledOrders.length} cancelled</div>
          </div>

          <div class="metric-card">
            <div class="metric-label">Items Sold (ចំនួនម្ហូប)</div>
            <div class="metric-value-usd">${totalItemsSold}</div>
            <div class="metric-value-khr">across ${itemSalesBreakdown.length} dishes</div>
          </div>

          <div class="metric-card">
            <div class="metric-label">Avg Order Value (មធ្យម)</div>
            <div class="metric-value-usd">$${avgOrderValueUsd.toFixed(2)}</div>
            <div class="metric-value-khr">${avgOrderValueKhr.toLocaleString()} ៛</div>
          </div>
        </div>

        <!-- 2. What Kind of Orders / Item Sales Breakdown -->
        <div class="section-title">របាយការណ៍លក់តាមមុខម្ហូប (Dish Sales & Popularity Breakdown)</div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>ឈ្មោះមុខម្ហូប (Dish Name)</th>
              <th class="text-right">តម្លៃរាយ (Price)</th>
              <th class="text-right">ចំនួនលក់ (Qty Sold)</th>
              <th class="text-right">ចំណូលសរុប (Total USD)</th>
              <th class="text-right">ចំណូលរៀល (Total KHR)</th>
            </tr>
          </thead>
          <tbody>
            ${itemSalesBreakdown.length === 0 
              ? '<tr><td colspan="6" style="text-align:center; padding: 20px; color: #a8a29e;">No sales recorded for this date</td></tr>'
              : itemSalesBreakdown.map((item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>
                    <strong class="font-khmer">${item.name_km}</strong><br/>
                    <span style="font-size: 11px; color: #78716c;">${item.name_en}</span>
                  </td>
                  <td class="text-right">$${item.price.toFixed(2)}</td>
                  <td class="text-right"><strong>${item.quantity}</strong></td>
                  <td class="text-right" style="font-weight: bold; color: #78350f;">$${item.totalUsd.toFixed(2)}</td>
                  <td class="text-right" style="color: #059669;">${item.totalKhr.toLocaleString()} ៛</td>
                </tr>
              `).join('')
            }
          </tbody>
        </table>

        <!-- 3. Payment Method & Status Breakdown -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
          <div>
            <div class="section-title">ការទូទាត់ប្រាក់ (Payment Methods)</div>
            <table>
              <thead>
                <tr>
                  <th>Method</th>
                  <th class="text-right">Orders</th>
                  <th class="text-right">Total USD</th>
                  <th class="text-right">Total KHR</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>💵 Cash (សាច់ប្រាក់)</td>
                  <td class="text-right">${paymentBreakdown.cash.count}</td>
                  <td class="text-right">$${paymentBreakdown.cash.usd.toFixed(2)}</td>
                  <td class="text-right">${paymentBreakdown.cash.khr.toLocaleString()} ៛</td>
                </tr>
                <tr>
                  <td>📱 ABA KHQR (ស្កេន QR)</td>
                  <td class="text-right">${paymentBreakdown.aba_khqr.count}</td>
                  <td class="text-right">$${paymentBreakdown.aba_khqr.usd.toFixed(2)}</td>
                  <td class="text-right">${paymentBreakdown.aba_khqr.khr.toLocaleString()} ៛</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <div class="section-title">ស្ថានភាពការកម្មង់ (Order Status Summary)</div>
            <table>
              <thead>
                <tr>
                  <th>Status</th>
                  <th class="text-right">Count</th>
                  <th class="text-right">% Share</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>✅ Completed / Served</td>
                  <td class="text-right">${statusCounts.completed + statusCounts.served + statusCounts.ready}</td>
                  <td class="text-right">${filteredOrders.length > 0 ? Math.round(((statusCounts.completed + statusCounts.served + statusCounts.ready) / filteredOrders.length) * 100) : 0}%</td>
                </tr>
                <tr>
                  <td>🍳 Preparing / New</td>
                  <td class="text-right">${statusCounts.new + statusCounts.preparing}</td>
                  <td class="text-right">${filteredOrders.length > 0 ? Math.round(((statusCounts.new + statusCounts.preparing) / filteredOrders.length) * 100) : 0}%</td>
                </tr>
                <tr>
                  <td>❌ Cancelled</td>
                  <td class="text-right">${statusCounts.cancelled}</td>
                  <td class="text-right">${filteredOrders.length > 0 ? Math.round((statusCounts.cancelled / filteredOrders.length) * 100) : 0}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 4. Detailed Order History Table -->
        <div class="section-title">បញ្ជីប្រវត្តិការកម្មង់លម្អិត (Detailed Orders List)</div>
        <table>
          <thead>
            <tr>
              <th>Order #</th>
              <th>Table</th>
              <th>Items Ordered</th>
              <th>Time</th>
              <th>Status</th>
              <th class="text-right">Total ($)</th>
              <th class="text-right">Total (៛)</th>
            </tr>
          </thead>
          <tbody>
            ${filteredOrders.length === 0
              ? '<tr><td colspan="7" style="text-align:center; padding: 20px; color: #a8a29e;">No transactions found</td></tr>'
              : filteredOrders.map(o => `
                <tr>
                  <td><strong>#${o.orderNumber}</strong></td>
                  <td>Table #${o.tableNumber}</td>
                  <td class="font-khmer" style="max-width: 250px;">
                    ${o.items.map(i => `${i.quantity}x ${i.name_km}`).join(', ')}
                  </td>
                  <td>${new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                  <td>
                    <span class="badge-status ${o.status === 'completed' || o.status === 'served' ? 'bg-completed' : o.status === 'cancelled' ? 'bg-cancelled' : 'bg-new'}">
                      ${o.status}
                    </span>
                  </td>
                  <td class="text-right" style="font-weight: bold;">$${(o.total || 0).toFixed(2)}</td>
                  <td class="text-right" style="color: #059669;">${(o.total_khr || Math.round((o.total || 0) * (config.exchangeRate || 4100))).toLocaleString()} ៛</td>
                </tr>
              `).join('')
            }
          </tbody>
        </table>

        <!-- Footer -->
        <div class="footer">
          <div>Generated by JIRO Digital Menu POS • Exchange Rate: $1 = ${config.exchangeRate || 4100} KHR</div>
          <div>Report Timestamp: ${new Date().toLocaleString()}</div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 500);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in print:p-0 print:static print:bg-white">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:rounded-none">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-stone-900 text-white flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg font-kulen tracking-wide text-amber-400">
                {lang === 'km' ? 'របាយការណ៍លក់ប្រចាំថ្ងៃ (Daily Order & Revenue Report)' : 'Daily Sales & Order PDF Report'}
              </h3>
              <p className="text-xs text-stone-300 font-battambang">
                {lang === 'km' ? 'មើលព័ត៌មានលម្អិតអំពីចំណូល ចំនួនការកម្មង់ និងមុខម្ហូបលក់ដាច់ប្រចាំថ្ងៃ' : 'Full financial analytics, item category breakdowns, and transaction details'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-stone-800 text-stone-300 flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Date Selector & Quick Controls */}
        <div className="p-3.5 bg-stone-50 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
            <label className="text-xs font-bold text-stone-700 font-khmer">
              {lang === 'km' ? 'ជ្រើសរើសកាលបរិច្ឆេទ:' : 'Report Date:'}
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-900 shadow-2xs focus:ring-2 focus:ring-amber-500 font-mono"
            />
            {selectedDate === todayStr && (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-bold rounded-md font-khmer">
                {lang === 'km' ? 'ថ្ងៃនេះ' : 'Today'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintPdf}
              className="flex items-center gap-1.5 bg-stone-900 hover:bg-black text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition active:scale-95 font-khmer"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>{lang === 'km' ? 'ព្រីន / រក្សាទុក PDF' : 'Print / Save PDF'}</span>
            </button>

            <button
              onClick={handleDownloadReportFile}
              className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition active:scale-95 font-khmer"
            >
              <Download className="w-4 h-4" />
              <span>{lang === 'km' ? 'ទាញយករបាយការណ៍ PDF' : 'Download Report PDF'}</span>
            </button>
          </div>
        </div>

        {/* Report Printable Content Body */}
        <div className="p-5 sm:p-8 overflow-y-auto space-y-6 flex-1 bg-stone-100/60 print:bg-white print:p-0">
          
          {/* Printable Report Header */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-2xs space-y-4 print:border-none print:shadow-none print:p-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold font-kulen text-amber-900">
                  {config.name_km || 'ភោជនីយដ្ឋាន'}
                </h1>
                <h2 className="text-sm font-bold text-stone-700">
                  {config.name_en || 'Restaurant'}
                </h2>
                <p className="text-xs text-stone-500 font-battambang mt-0.5">
                  {config.address_km || config.address_en} • Tel: {config.phone}
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-right">
                <span className="text-xs font-bold text-amber-900 font-kulen block">
                  {lang === 'km' ? 'របាយការណ៍លក់ប្រចាំថ្ងៃ' : 'Daily Sales & Revenue Report'}
                </span>
                <span className="text-xs font-mono font-bold text-stone-800 block mt-0.5">
                  📅 {selectedDate}
                </span>
                <span className="text-[10px] text-stone-500 font-medium">
                  Exchange Rate: $1 = {config.exchangeRate} KHR
                </span>
              </div>
            </div>

            {/* Top Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-emerald-50/80 border border-emerald-200 p-3.5 rounded-xl">
                <span className="text-[11px] font-bold text-emerald-800 block uppercase font-khmer">
                  {lang === 'km' ? 'ចំណូលសរុប (Total Revenue)' : 'Total Gross Revenue'}
                </span>
                <p className="text-xl font-extrabold text-emerald-950 mt-1 font-mono">
                  ${totalRevenueUsd.toFixed(2)}
                </p>
                <span className="text-xs font-bold text-emerald-700 font-mono">
                  {totalRevenueKhr.toLocaleString()} ៛
                </span>
              </div>

              <div className="bg-blue-50/80 border border-blue-200 p-3.5 rounded-xl">
                <span className="text-[11px] font-bold text-blue-800 block uppercase font-khmer">
                  {lang === 'km' ? 'ការកម្មង់សរុប (Total Orders)' : 'Total Orders Count'}
                </span>
                <p className="text-xl font-extrabold text-blue-950 mt-1 font-mono">
                  {filteredOrders.length}
                </p>
                <span className="text-xs font-semibold text-blue-700">
                  {validOrders.length} {lang === 'km' ? 'ជោគជ័យ' : 'Valid'} • {cancelledOrders.length} {lang === 'km' ? 'បោះបង់' : 'Cancelled'}
                </span>
              </div>

              <div className="bg-amber-50/80 border border-amber-200 p-3.5 rounded-xl">
                <span className="text-[11px] font-bold text-amber-800 block uppercase font-khmer">
                  {lang === 'km' ? 'ចំនួនមុខម្ហូបលក់ចេញ' : 'Total Items Sold'}
                </span>
                <p className="text-xl font-extrabold text-amber-950 mt-1 font-mono">
                  {totalItemsSold}
                </p>
                <span className="text-xs font-semibold text-amber-700">
                  Across {itemSalesBreakdown.length} {lang === 'km' ? 'មុខ' : 'dishes'}
                </span>
              </div>

              <div className="bg-purple-50/80 border border-purple-200 p-3.5 rounded-xl">
                <span className="text-[11px] font-bold text-purple-800 block uppercase font-khmer">
                  {lang === 'km' ? 'ចំណាយមធ្យម/ការកម្មង់' : 'Avg Order Value'}
                </span>
                <p className="text-xl font-extrabold text-purple-950 mt-1 font-mono">
                  ${avgOrderValueUsd.toFixed(2)}
                </p>
                <span className="text-xs font-bold text-purple-700 font-mono">
                  {avgOrderValueKhr.toLocaleString()} ៛
                </span>
              </div>
            </div>
          </div>

          {/* Section: What Kind of Order - Dish Sales & Item Breakdown */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-2xs space-y-3 print:border-none print:shadow-none print:p-0">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <h3 className="font-bold text-sm sm:text-base font-kulen text-stone-900 flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-amber-600" />
                <span>{lang === 'km' ? '១. របាយការណ៍លក់តាមមុខម្ហូប (Dish Sales & Item Breakdown)' : '1. Dish Popularity & Item Sales Breakdown'}</span>
              </h3>
              <span className="text-xs font-bold text-stone-500 bg-stone-100 px-2.5 py-1 rounded-lg">
                {itemSalesBreakdown.length} {lang === 'km' ? 'មុខម្ហូបត្រូវបានលក់' : 'Unique Dishes Sold'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-100 text-stone-700 font-bold uppercase font-khmer border-b border-stone-200">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">{lang === 'km' ? 'ឈ្មោះមុខម្ហូប' : 'Dish Name'}</th>
                    <th className="p-3 text-right">{lang === 'km' ? 'តម្លៃរាយ' : 'Unit Price'}</th>
                    <th className="p-3 text-right">{lang === 'km' ? 'ចំនួនលក់' : 'Qty Sold'}</th>
                    <th className="p-3 text-right">{lang === 'km' ? 'ចំណូល USD' : 'Total (USD)'}</th>
                    <th className="p-3 text-right">{lang === 'km' ? 'ចំណូល KHR' : 'Total (KHR)'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {itemSalesBreakdown.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center p-6 text-stone-400 font-khmer">
                        {lang === 'km' ? 'មិនទាន់មានទិន្នន័យលក់សម្រាប់កាលបរិច្ឆេទនេះទេ' : 'No dish sales recorded for this date'}
                      </td>
                    </tr>
                  ) : (
                    itemSalesBreakdown.map((item, idx) => (
                      <tr key={item.itemId} className="hover:bg-stone-50 transition">
                        <td className="p-3 font-mono font-bold text-stone-400">{idx + 1}</td>
                        <td className="p-3">
                          <span className="font-bold text-stone-900 block font-khmer text-sm">
                            {item.name_km}
                          </span>
                          <span className="text-[11px] text-stone-500">{item.name_en}</span>
                        </td>
                        <td className="p-3 text-right font-mono">${item.price.toFixed(2)}</td>
                        <td className="p-3 text-right">
                          <span className="font-extrabold text-amber-900 bg-amber-100/70 px-2.5 py-0.5 rounded-md font-mono text-xs">
                            x{item.quantity}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-stone-900">
                          ${item.totalUsd.toFixed(2)}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-700">
                          {item.totalKhr.toLocaleString()} ៛
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section: Payment Method & Order Status Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Payment Methods */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-3 print:border-none print:shadow-none print:p-0">
              <h3 className="font-bold text-sm font-kulen text-stone-900 border-b border-stone-200 pb-2 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>{lang === 'km' ? '២. ប្រភេទទូទាត់ប្រាក់ (Payment Method Breakdown)' : '2. Payment Method Breakdown'}</span>
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <div className="flex items-center gap-2">
                    <span className="text-base">💵</span>
                    <div>
                      <span className="font-bold text-stone-900 block font-khmer">
                        {lang === 'km' ? 'សាច់ប្រាក់ (Cash)' : 'Cash Payment'}
                      </span>
                      <span className="text-[11px] text-stone-500 font-mono">
                        {paymentBreakdown.cash.count} {lang === 'km' ? 'ការកម្មង់' : 'orders'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-stone-900 block text-sm">
                      ${paymentBreakdown.cash.usd.toFixed(2)}
                    </span>
                    <span className="font-mono text-[11px] text-emerald-700 font-semibold">
                      {paymentBreakdown.cash.khr.toLocaleString()} ៛
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📱</span>
                    <div>
                      <span className="font-bold text-stone-900 block font-khmer">
                        {lang === 'km' ? 'ABA KHQR (ស្កេន)' : 'ABA KHQR Digital'}
                      </span>
                      <span className="text-[11px] text-stone-500 font-mono">
                        {paymentBreakdown.aba_khqr.count} {lang === 'km' ? 'ការកម្មង់' : 'orders'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-stone-900 block text-sm">
                      ${paymentBreakdown.aba_khqr.usd.toFixed(2)}
                    </span>
                    <span className="font-mono text-[11px] text-emerald-700 font-semibold">
                      {paymentBreakdown.aba_khqr.khr.toLocaleString()} ៛
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Status Breakdown */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-3 print:border-none print:shadow-none print:p-0">
              <h3 className="font-bold text-sm font-kulen text-stone-900 border-b border-stone-200 pb-2 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-blue-600" />
                <span>{lang === 'km' ? '៣. ស្ថានភាពការកម្មង់ (Order Status Summary)' : '3. Order Status Breakdown'}</span>
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                  <span className="font-bold text-emerald-900 flex items-center gap-1.5 font-khmer">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{lang === 'km' ? 'ធ្វើរួច / បានជូនភ្ញៀវ (Completed/Served)' : 'Completed / Served'}</span>
                  </span>
                  <span className="font-mono font-bold text-emerald-900 text-sm">
                    {statusCounts.completed + statusCounts.served + statusCounts.ready}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl">
                  <span className="font-bold text-amber-900 flex items-center gap-1.5 font-khmer">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>{lang === 'km' ? 'កំពុងធ្វើ / ថ្មី (New / Preparing)' : 'New / Preparing'}</span>
                  </span>
                  <span className="font-mono font-bold text-amber-900 text-sm">
                    {statusCounts.new + statusCounts.preparing}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-red-50/70 border border-red-200 rounded-xl">
                  <span className="font-bold text-red-900 flex items-center gap-1.5 font-khmer">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span>{lang === 'km' ? 'បានបោះបង់ (Cancelled)' : 'Cancelled'}</span>
                  </span>
                  <span className="font-mono font-bold text-red-900 text-sm">
                    {statusCounts.cancelled}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Detailed Transactions List */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-2xs space-y-3 print:border-none print:shadow-none print:p-0">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <h3 className="font-bold text-sm sm:text-base font-kulen text-stone-900 flex items-center gap-2">
                <Hash className="w-4 h-4 text-purple-600" />
                <span>{lang === 'km' ? '៤. បញ្ជីប្រវត្តិការកម្មង់លម្អិត (Detailed Transactions List)' : '4. Detailed Order Transactions History'}</span>
              </h3>
              <span className="text-xs font-bold font-mono text-stone-500">
                {filteredOrders.length} {lang === 'km' ? 'ការកម្មង់' : 'records'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-100 text-stone-700 font-bold uppercase font-khmer border-b border-stone-200">
                  <tr>
                    <th className="p-3">Order #</th>
                    <th className="p-3">{lang === 'km' ? 'តុ' : 'Table'}</th>
                    <th className="p-3">{lang === 'km' ? 'មុខម្ហូប' : 'Items'}</th>
                    <th className="p-3">{lang === 'km' ? 'ម៉ោង' : 'Time'}</th>
                    <th className="p-3">{lang === 'km' ? 'ស្ថានភាព' : 'Status'}</th>
                    <th className="p-3 text-right">{lang === 'km' ? 'សរុប USD' : 'Total ($)'}</th>
                    <th className="p-3 text-right">{lang === 'km' ? 'សរុប KHR' : 'Total (៛)'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center p-6 text-stone-400 font-khmer">
                        {lang === 'km' ? 'មិនមានការកម្មង់ក្នុងថ្ងៃនេះទេ' : 'No orders found for this date'}
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map(o => (
                      <tr key={o.id} className="hover:bg-stone-50 transition">
                        <td className="p-3 font-mono font-bold text-stone-900">#{o.orderNumber}</td>
                        <td className="p-3">
                          <span className="bg-stone-900 text-white font-bold px-2 py-0.5 rounded-md text-[11px] font-mono">
                            Table #{o.tableNumber}
                          </span>
                        </td>
                        <td className="p-3 font-khmer max-w-xs truncate text-[11px]">
                          {o.items.map(i => `${i.quantity}x ${i.name_km}`).join(', ')}
                        </td>
                        <td className="p-3 font-mono text-stone-500 text-[11px]">
                          {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            o.status === 'completed' || o.status === 'served'
                              ? 'bg-emerald-100 text-emerald-800'
                              : o.status === 'cancelled'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {o.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-stone-900">
                          ${(o.total || 0).toFixed(2)}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-700">
                          {(o.total_khr || Math.round((o.total || 0) * config.exchangeRate)).toLocaleString()} ៛
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between shrink-0 print:hidden">
          <span className="text-xs text-stone-500 font-battambang">
            {lang === 'km' ? 'ទិន្នន័យត្រូវបានធ្វើសមកាលកម្មផ្ទាល់ជាមួយ Cloud Database' : 'Synced live from Cloud Database'}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-200 font-bold text-xs font-khmer"
            >
              {lang === 'km' ? 'បិទ' : 'Close'}
            </button>

            <button
              onClick={handleDownloadReportFile}
              className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition active:scale-95 font-khmer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{lang === 'km' ? 'ទាញយក PDF' : 'Download PDF Report'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

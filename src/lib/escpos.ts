import { Order, RestaurantConfig } from '../types';

export interface EscPosResult {
  rawBytes: Uint8Array;
  base64: string;
  rawBtUrl: string;
  rawBtIntent: string;
  printableText: string;
}

// Convert a UTF-8 string to a Uint8Array
export function stringToBytes(str: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

// Combine multiple Uint8Arrays into one
export function concatBytes(...arrays: (Uint8Array | number[])[]): Uint8Array {
  const formatted = arrays.map(a => a instanceof Uint8Array ? a : new Uint8Array(a));
  const totalLength = formatted.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of formatted) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

export function padLine(left: string, right: string, width: number = 32): string {
  const spaceNeeded = Math.max(1, width - left.length - right.length);
  return left + ' '.repeat(spaceNeeded) + right;
}

/**
 * Builds standard ESC/POS binary data for PP587 (58mm / 80mm thermal receipt printer)
 */
export function generateEscPosPrintJob(order: Order, config: RestaurantConfig): EscPosResult {
  const is58mm = config.printerType === '58mm';
  const lineWidth = is58mm ? 32 : 48;
  const divider = '-'.repeat(lineWidth);
  const doubleDivider = '='.repeat(lineWidth);

  const ESC = 0x1B;
  const GS = 0x1D;

  const parts: (Uint8Array | number[])[] = [];

  // 1. Initialize printer
  parts.push([ESC, 0x40]); // ESC @

  // 2. Center Align Header
  parts.push([ESC, 0x61, 0x01]); // ESC a 1 (center)

  // Restaurant Name (Double Height + Bold)
  parts.push([ESC, 0x45, 0x01]); // Bold on
  parts.push([GS, 0x21, 0x01]); // Double height
  parts.push(stringToBytes(`${config.name_en}\n`));
  parts.push([GS, 0x21, 0x00]); // Normal text
  parts.push(stringToBytes(`${config.name_km}\n`));
  parts.push([ESC, 0x45, 0x00]); // Bold off
  parts.push(stringToBytes(`Tel: ${config.phone}\n`));
  parts.push(stringToBytes(`${doubleDivider}\n`));

  // 3. TABLE NUMBER - Huge Font for Kitchen Chef
  parts.push([ESC, 0x45, 0x01]); // Bold on
  parts.push([GS, 0x21, 0x11]); // Double Width + Double Height
  parts.push(stringToBytes(`TABLE #${order.tableNumber}\n`));
  parts.push([GS, 0x21, 0x00]); // Normal
  parts.push(stringToBytes(`( តុលេខ ${order.tableNumber} )\n`));
  parts.push([ESC, 0x45, 0x00]); // Bold off
  parts.push(stringToBytes(`${divider}\n`));

  // 4. Order Meta
  parts.push([ESC, 0x61, 0x00]); // ESC a 0 (left align)
  const dateFormatted = new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = new Date(order.createdAt).toLocaleDateString();

  parts.push(stringToBytes(padLine(`Order: #${order.orderNumber}`, `Time: ${dateFormatted}`, lineWidth) + '\n'));
  parts.push(stringToBytes(padLine(`Date: ${dateStr}`, `Status: KITCHEN`, lineWidth) + '\n'));
  if (order.customerName) {
    parts.push(stringToBytes(`Guest: ${order.customerName}\n`));
  }
  if (order.customerNote) {
    parts.push([ESC, 0x45, 0x01]); // Bold
    parts.push(stringToBytes(`* NOTE: ${order.customerNote}\n`));
    parts.push([ESC, 0x45, 0x00]);
  }
  parts.push(stringToBytes(`${divider}\n`));

  // 5. Items Header
  parts.push([ESC, 0x45, 0x01]); // Bold
  parts.push(stringToBytes(padLine('QTY  ITEM', 'PRICE', lineWidth) + '\n'));
  parts.push([ESC, 0x45, 0x00]);
  parts.push(stringToBytes(`${divider}\n`));

  // 6. Item rows
  order.items.forEach((item, index) => {
    const qtyStr = `${item.quantity}x`.padEnd(4, ' ');
    const priceStr = `$${item.itemTotal.toFixed(2)}`;
    
    // Main English name line
    parts.push([ESC, 0x45, 0x01]); // Bold item name
    parts.push(stringToBytes(padLine(`${qtyStr} ${item.name_en}`, priceStr, lineWidth) + '\n'));
    parts.push([ESC, 0x45, 0x00]);

    // Khmer name line
    parts.push(stringToBytes(`     ${item.name_km}\n`));

    // Customizations (Spicy, Sweetness, Notes)
    const tags: string[] = [];
    if (item.selectedSpicy) tags.push(`[${item.selectedSpicy}]`);
    if (item.selectedSweetness) tags.push(`[${item.selectedSweetness}]`);
    if (item.notes) tags.push(`Note: ${item.notes}`);

    if (tags.length > 0) {
      parts.push(stringToBytes(`     -> ${tags.join(' ')}\n`));
    }
  });

  parts.push(stringToBytes(`${doubleDivider}\n`));

  // 7. Totals
  parts.push([ESC, 0x61, 0x02]); // Right align
  parts.push([ESC, 0x45, 0x01]); // Bold
  parts.push([GS, 0x21, 0x01]); // Double height
  parts.push(stringToBytes(`TOTAL: $${order.total.toFixed(2)}\n`));
  parts.push([GS, 0x21, 0x00]); // Normal
  parts.push(stringToBytes(`( ${order.total_khr.toLocaleString()} ៛ )\n`));
  parts.push([ESC, 0x45, 0x00]);

  // 8. Footer & Chef Checklist
  parts.push([ESC, 0x61, 0x01]); // Center
  parts.push(stringToBytes(`${divider}\n`));
  parts.push(stringToBytes(`[  ] PREPARED   [  ] SERVED\n`));
  parts.push(stringToBytes(`Powered by TableQR & PP587 Printer\n`));
  parts.push(stringToBytes(`*** CHEF COPY / ប័ណ្ណចុងភៅ ***\n\n\n\n`));

  // 9. Paper Cut Command (GS V 66 0)
  parts.push([GS, 0x56, 0x42, 0x00]); // Full Cut

  const rawBytes = concatBytes(...parts);

  // Convert binary to base64
  let binary = '';
  const len = rawBytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(rawBytes[i]);
  }
  const base64 = btoa(binary);

  // RawBT Scheme URL: opens RawBT app directly on Android / kitchen tablet
  const rawBtUrl = `rawbt:data:base64,${base64}`;
  const rawBtIntent = `intent:base64,${base64}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`;

  // Human readable text version for thermal receipt simulator and browser printing
  const printableText = [
    `================================`,
    `    ${config.name_en}`,
    `    ${config.name_km}`,
    `    Tel: ${config.phone}`,
    `================================`,
    `       TABLE #${order.tableNumber}`,
    `       ( តុលេខ ${order.tableNumber} )`,
    `--------------------------------`,
    padLine(`Order: #${order.orderNumber}`, `Time: ${dateFormatted}`, 32),
    padLine(`Date: ${dateStr}`, `Status: KITCHEN`, 32),
    order.customerName ? `Guest: ${order.customerName}` : '',
    order.customerNote ? `* NOTE: ${order.customerNote}` : '',
    `--------------------------------`,
    padLine('QTY  ITEM', 'PRICE', 32),
    `--------------------------------`,
    ...order.items.flatMap(item => [
      padLine(`${item.quantity}x ${item.name_en}`, `$${item.itemTotal.toFixed(2)}`, 32),
      `   ${item.name_km}`,
      (item.selectedSpicy || item.selectedSweetness || item.notes)
        ? `   -> ${[item.selectedSpicy, item.selectedSweetness, item.notes].filter(Boolean).join(' | ')}`
        : ''
    ].filter(Boolean)),
    `================================`,
    padLine('TOTAL USD:', `$${order.total.toFixed(2)}`, 32),
    padLine('TOTAL KHR:', `${order.total_khr.toLocaleString()} ៛`, 32),
    `--------------------------------`,
    `[  ] PREPARED      [  ] SERVED`,
    `*** CHEF COPY / ប័ណ្ណចុងភៅ ***`,
    `================================`
  ].filter(Boolean).join('\n');

  return {
    rawBytes,
    base64,
    rawBtUrl,
    rawBtIntent,
    printableText,
  };
}

/**
 * Safely dispatches RawBT print command on supported Android devices without throwing scheme navigation errors
 */
export function dispatchRawBtPrint(rawBtUrl: string): { dispatched: boolean; isAndroid: boolean } {
  const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent || '');
  if (!isAndroid) {
    return { dispatched: false, isAndroid: false };
  }

  try {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = rawBtUrl;
    document.body.appendChild(iframe);
    setTimeout(() => {
      try {
        document.body.removeChild(iframe);
      } catch (e) {}
    }, 2000);
    return { dispatched: true, isAndroid: true };
  } catch (err) {
    console.warn('RawBT iframe dispatch notice:', err);
    return { dispatched: false, isAndroid: true };
  }
}

/**
 * Direct Web Bluetooth printer connector for paired PP587 or ESC/POS thermal printers
 */
export async function printViaWebBluetooth(rawBytes: Uint8Array): Promise<{ success: boolean; message: string }> {
  try {
    const nav = navigator as any;
    if (!nav.bluetooth) {
      return { success: false, message: 'Web Bluetooth is not supported on this browser. Please use RawBT app or print preview.' };
    }

    const device = await nav.bluetooth.requestDevice({
      filters: [
        { services: ['000018f0-0000-1000-8000-00805f9b34fb'] }, // Standard ESC/POS service
        { namePrefix: 'PP' },
        { namePrefix: 'MPT' },
        { namePrefix: 'POS' },
        { namePrefix: 'Printer' },
        { namePrefix: 'RP' }
      ],
      optionalServices: [
        '000018f0-0000-1000-8000-00805f9b34fb',
        'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
        '49535343-fe7d-4ae5-8fa9-9fafd205e455'
      ]
    });

    const server = await device.gatt?.connect();
    if (!server) throw new Error('Could not connect to Bluetooth GATT server');

    // Find any writable characteristic
    const services = await server.getPrimaryServices();
    let writeChar: any = null;

    for (const service of services) {
      const chars = await service.getCharacteristics();
      for (const char of chars) {
        if (char.properties.write || char.properties.writeWithoutResponse) {
          writeChar = char;
          break;
        }
      }
      if (writeChar) break;
    }

    if (!writeChar) throw new Error('No writable printer characteristic found');

    // Send chunks (max 512 bytes per write)
    const chunkSize = 256;
    for (let i = 0; i < rawBytes.length; i += chunkSize) {
      const chunk = rawBytes.slice(i, i + chunkSize);
      await writeChar.writeValue(chunk);
    }

    return { success: true, message: 'Print job dispatched successfully to PP587 via Bluetooth!' };
  } catch (err: any) {
    console.warn('Bluetooth print error:', err);
    return { success: false, message: err.message || 'Bluetooth connection failed' };
  }
}

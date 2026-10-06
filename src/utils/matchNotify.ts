/**
 * Match notifications — in-app (NotificationCenter) + one-tap WhatsApp messages.
 *
 * These are DIRECTED 1:1 notifications, so they intentionally include the REAL
 * counterparty phone numbers. The platform-number masking rule applies ONLY to
 * public share text (formatWhatsAppMessage), never here.
 */
import { LoadSlip, AvailableTruck } from '../types';
import { findMatchingTrucks, findMatchingLoads } from './matching';
import { NotificationService } from '../services/notificationService';
import { getWhatsAppShareUrl, OFFICIAL_WEBSITE_URL } from './formatters';

export const slipLink = (id: string) => `${OFFICIAL_WEBSITE_URL}/slip/${id}`;

/** Message sent TO a driver about a matching load (uses the load's real contact). */
export function driverMatchMessage(load: LoadSlip): string {
  return (
    `🚛 *نیا لوڈ دستیاب ہے*\n` +
    `📍 روٹ: ${load.loadingCity} سے ${load.destinationCity}\n` +
    `📦 مال: ${load.goods}${load.weight ? ` (${load.weight})` : ''}\n` +
    `🚚 گاڑی: ${load.vehicleType || 'کوئی بھی'}\n` +
    `🏢 اڈا: ${load.addaName}\n` +
    `📞 رابطہ: ${load.primaryPhone}\n\n` +
    `🔗 مکمل تفصیل دیکھیں:\n${slipLink(load.id)}`
  );
}

/** Message sent TO an adda manager about a matching truck (uses the driver's real number). */
export function addaMatchMessage(truck: AvailableTruck): string {
  return (
    `🚚 *گاڑی دستیاب ہے*\n` +
    `📍 موجودہ شہر: ${truck.currentCity}` +
    `${truck.preferredRoute ? `\n🛣️ ترجیحی روٹ: ${truck.preferredRoute}` : ''}\n` +
    `🚚 گاڑی: ${truck.vehicleType}\n` +
    `👤 ڈرائیور/مالک: ${truck.driverOrOwnerName}\n` +
    `📞 رابطہ: ${truck.phone}\n\n` +
    `🔗 PK Cargo Link: ${OFFICIAL_WEBSITE_URL}`
  );
}

/** One-tap WhatsApp URL notifying a driver about a load. */
export function driverNotifyUrl(load: LoadSlip, driverPhone: string): string {
  return getWhatsAppShareUrl(driverMatchMessage(load), driverPhone);
}

/** One-tap WhatsApp URL notifying an adda manager about a truck. */
export function addaNotifyUrl(truck: AvailableTruck, managerPhone: string): string {
  return getWhatsAppShareUrl(addaMatchMessage(truck), managerPhone);
}

/**
 * Called when a new load slip is created. Finds matching trucks,
 * pushes an in-app notification, and returns matches for WhatsApp one-tap UI.
 */
export function notifyForNewSlip(slip: LoadSlip, trucks: AvailableTruck[]): AvailableTruck[] {
  let matches: AvailableTruck[] = [];
  try {
    matches = findMatchingTrucks(slip, trucks);
  } catch {
    return [];
  }
  if (matches.length > 0) {
    const top = matches[0];
    try {
      NotificationService.addNotification({
        title: `🚛 آپ کے لوڈ کے لیے ${matches.length} موزوں گاڑیاں دستیاب ہیں`,
        message:
          `${slip.loadingCity} سے ${slip.destinationCity} (${slip.goods}) — ` +
          `پہلی گاڑی: ${top.driverOrOwnerName} (${top.vehicleType}, ${top.phone})۔ ` +
          `سلپ کھول کر ڈرائیور کو واٹس ایپ کریں۔`,
        type: 'driver_match',
        slipId: slip.id,
        route: `${slip.loadingCity} تا ${slip.destinationCity}`,
        driverName: top.driverOrOwnerName,
        driverPhone: top.phone,
        vehicleType: top.vehicleType,
      });
    } catch {}
  }
  return matches;
}

/**
 * Called when a new truck is listed. Finds matching loads,
 * pushes an in-app notification, and returns matches for WhatsApp one-tap UI.
 */
export function notifyForNewTruck(truck: AvailableTruck, slips: LoadSlip[]): LoadSlip[] {
  let matches: LoadSlip[] = [];
  try {
    matches = findMatchingLoads(truck, slips);
  } catch {
    return [];
  }
  if (matches.length > 0) {
    const top = matches[0];
    try {
      NotificationService.addNotification({
        title: `📦 آپ کی گاڑی کے لیے ${matches.length} موزوں لوڈز دستیاب ہیں`,
        message:
          `${truck.currentCity} سے — پہلا لوڈ: ${top.loadingCity} تا ${top.destinationCity} ` +
          `(${top.goods}, ${top.addaName}, ${top.primaryPhone})۔`,
        type: 'driver_match',
        slipId: top.id,
        route: `${top.loadingCity} تا ${top.destinationCity}`,
        vehicleType: top.vehicleType,
      });
    } catch {}
  }
  return matches;
}

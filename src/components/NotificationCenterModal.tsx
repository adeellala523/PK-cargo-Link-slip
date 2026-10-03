import React, { useState, useEffect } from 'react';
import {
  Bell,
  X,
  CheckCheck,
  Trash2,
  Truck,
  MapPin,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Volume2,
  Clock,
  Sparkles
} from 'lucide-react';
import { AppNotification, LoadSlip } from '../types';
import { NotificationService } from '../services/notificationService';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewSlip: (slipId: string) => void;
  myActiveSlips: LoadSlip[];
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  onViewSlip,
  myActiveSlips,
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>(NotificationService.getNotifications());
  const [permission, setPermission] = useState<NotificationPermission>(NotificationService.getPermissionStatus());
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      setNotifications(NotificationService.getNotifications());
      setPermission(NotificationService.getPermissionStatus());
    };
    window.addEventListener('pkcl:notification', handleUpdate);
    window.addEventListener('pkcl:notification_permission', handleUpdate);
    return () => {
      window.removeEventListener('pkcl:notification', handleUpdate);
      window.removeEventListener('pkcl:notification_permission', handleUpdate);
    };
  }, []);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const res = await NotificationService.requestPermission();
    setPermission(res);
    if (res === 'granted') {
      NotificationService.addNotification({
        title: '🔔 براؤزر نوٹیفکیشن فعال ہو گیا!',
        message: 'اب جیسے ہی کوئی ڈرائیور آپ کے لوڈز سے میچ ہونے والا روٹ سرچ کرے گا، آپ کو فوری پش الرٹ ملے گا۔',
        type: 'system',
      });
    }
  };

  const handleSendTestNotification = () => {
    const slip = myActiveSlips[0];
    const route = slip ? `${slip.loadingCity} تا ${slip.destinationCity}` : 'ملتان تا کراچی';
    const vehicle = slip ? slip.vehicleType : '22 Wheeler';

    NotificationService.addNotification({
      title: '🚨 ٹیسٹ ڈرائیور الرٹ: روٹ میچ ہو گیا!',
      message: `ایک ڈرائیور نے روٹ [${route}] پر گاڑی [${vehicle}] تلاش کی۔ یہ نوٹیفکیشن آپ کے لوڈ سے میچ ہے۔`,
      type: 'driver_match',
      slipId: slip?.id,
      route,
      vehicleType: vehicle,
    });
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  const handleMarkAllRead = () => {
    NotificationService.markAllAsRead();
    setNotifications(NotificationService.getNotifications());
  };

  const handleClearAll = () => {
    NotificationService.clearAllNotifications();
    setNotifications([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-xs font-nafees">
      <div className="bg-white w-full max-w-lg max-h-[90vh] rounded-3xl shadow-2xl flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-[#0B2545] text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">ڈرائیور سرچ و لوڈ الرٹس</h2>
              <p className="text-xs text-slate-300">
                جب کوئی ڈرائیور آپ کے لوڈز سے ملتا جلتا روٹ سرچ کرے
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Browser Push Permission State Banner */}
        <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 space-y-2">
          {permission === 'granted' ? (
            <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3 flex items-center justify-between gap-2 text-xs text-emerald-900">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-bold">براؤزر پش نوٹیفکیشنز فعال ہیں (Active)</span>
              </div>
              <button
                onClick={handleSendTestNotification}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer"
              >
                {testSent ? 'بھیج دیا گیا!' : 'ٹیسٹ الرٹ بھیجیں'}
              </button>
            </div>
          ) : permission === 'denied' ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-xs text-red-900 space-y-1">
              <span className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-red-600" />
                براؤزر نوٹیفکیشن بلاک ہے
              </span>
              <p className="text-[11px] text-red-700">
                پش نوٹیفکیشنز حاصل کرنے کے لیے اپنے براؤزر کے ایڈریس بار میں لاک آئیکون پر کلک کر کے Notifications کی اجازت دیں۔
              </p>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950">
              <div className="space-y-0.5">
                <span className="font-bold block">فوری براؤزر الرٹس حاصل کریں:</span>
                <p className="text-[11px] text-amber-800">
                  جیسے ہی کوئی ڈرائیور آپ کا مطلوبہ روٹ سرچ کرے گا، براؤزر فورا نوٹیفکیشن بھیجے گا۔
                </p>
              </div>
              <button
                onClick={handleRequestPermission}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition cursor-pointer whitespace-nowrap shadow-xs"
              >
                نوٹیفکیشن آن کریں
              </button>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="px-4 py-2 bg-white border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>کل الرٹس: {notifications.length}</span>
          <div className="flex items-center gap-3">
            {notifications.some((n) => !n.read) && (
              <button
                onClick={handleMarkAllRead}
                className="text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>سب پڑھ لیے</span>
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-slate-400 hover:text-red-600 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>صاف کریں</span>
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Bell className="w-10 h-10 mx-auto opacity-30 text-slate-400" />
              <p className="text-sm">کوئی نیا نوٹیفکیشن موجود نہیں ہے۔</p>
              <p className="text-xs text-slate-400">
                ڈرائیور پورٹل پر جیسے ہی کوئی ڈرائیور سرچ کرے گا، الرٹ یہاں آ جائے گا۔
              </p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3.5 rounded-2xl border transition space-y-2 ${
                  n.read
                    ? 'bg-slate-50/70 border-slate-200 text-slate-700'
                    : 'bg-emerald-50/50 border-emerald-300 text-slate-900 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        n.type === 'driver_match'
                          ? 'bg-emerald-100 text-emerald-800'
                          : n.type === 'query_received'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm">{n.title}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed mt-0.5">{n.message}</p>
                    </div>
                  </div>

                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-emerald-600 flex-shrink-0 mt-1"></span>
                  )}
                </div>

                {/* Footer with Slip Button */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200/60">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(n.createdAt).toLocaleTimeString('ur-PK', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  {n.slipId && (
                    <button
                      onClick={() => {
                        NotificationService.markAsRead(n.id);
                        onViewSlip(n.slipId!);
                        onClose();
                      }}
                      className="text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 cursor-pointer bg-white px-2 py-0.5 rounded-md border border-emerald-200"
                    >
                      <span>میچ لوڈ دیکھیں</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            بند کریں
          </button>
        </div>

      </div>
    </div>
  );
};

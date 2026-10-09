import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Crosshair, Trash2 } from 'lucide-react';
import { getCurrentPosition } from '../utils/tracking';

interface PickupMapPickerProps {
  lat?: number;
  lng?: number;
  onChange: (lat: number | undefined, lng: number | undefined) => void;
}

/**
 * PickupMapPicker — adda manager drops a pin on an OpenStreetMap (Leaflet)
 * map to set the EXACT pickup coordinates for a load.
 * The pin is the source of truth for the 7km driver-matching rule.
 * Mobile-friendly: tap to place, drag to adjust.
 */
export const PickupMapPicker: React.FC<PickupMapPickerProps> = ({ lat, lng, onChange }) => {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [hasPin, setHasPin] = useState<boolean>(lat != null && lng != null);
  const [locating, setLocating] = useState(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Custom pin icon (avoids broken default leaflet image URLs in bundlers)
  const pinIcon = useRef<L.DivIcon>(
    L.divIcon({
      className: 'pkcl-pin',
      html: '<div style="font-size:34px;line-height:1;filter:drop-shadow(0 2px 3px rgba(0,0,0,.4))">📍</div>',
      iconSize: [34, 40],
      iconAnchor: [17, 38],
    })
  );

  const placePin = (m: L.Map, plat: number, plng: number) => {
    if (markerRef.current) {
      markerRef.current.setLatLng([plat, plng]);
    } else {
      const mk = L.marker([plat, plng], { icon: pinIcon.current, draggable: true }).addTo(m);
      mk.on('dragend', () => {
        const p = mk.getLatLng();
        onChangeRef.current(p.lat, p.lng);
      });
      markerRef.current = mk;
    }
    setHasPin(true);
    onChangeRef.current(plat, plng);
  };

  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;
    const startLat = lat ?? 30.3753;
    const startLng = lng ?? 69.3451;
    const m = L.map(mapEl.current, { zoomControl: true }).setView(
      [startLat, startLng],
      lat != null ? 14 : 6
    );
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(m);
    if (lat != null && lng != null) {
      placePin(m, lat, lng);
    }
    m.on('click', (e: L.LeafletMouseEvent) => {
      placePin(m, e.latlng.lat, e.latlng.lng);
    });
    mapRef.current = m;
    return () => {
      m.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const useMyLocation = async () => {
    setLocating(true);
    try {
      const p = await getCurrentPosition();
      const m = mapRef.current;
      if (m) {
        m.setView([p.lat, p.lng], 15);
        placePin(m, p.lat, p.lng);
      }
    } catch {
      /* permission denied — user can still tap manually */
    } finally {
      setLocating(false);
    }
  };

  const clearPin = () => {
    if (markerRef.current && mapRef.current) {
      mapRef.current.removeLayer(markerRef.current);
      markerRef.current = null;
    }
    setHasPin(false);
    onChange(undefined, undefined);
  };

  return (
    <div className="space-y-2 font-nafees" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-xs font-extrabold text-[#111111] flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-[#19A974]" />
          نقشے پر پک اپ کی صحیح جگہ منتخب کریں (پن لگائیں)
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={useMyLocation}
            disabled={locating}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#111111] bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1.5 rounded-xl min-h-[36px] disabled:opacity-60"
          >
            <Crosshair className="w-3.5 h-3.5" />
            {locating ? '…' : 'میری لوکیشن'}
          </button>
          {hasPin && (
            <button
              type="button"
              onClick={clearPin}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1.5 rounded-xl min-h-[36px]"
            >
              <Trash2 className="w-3.5 h-3.5" />
              پن ہٹائیں
            </button>
          )}
        </div>
      </div>

      <div
        ref={mapEl}
        className="w-full rounded-2xl border-2 border-slate-200 overflow-hidden z-0"
        style={{ height: 260 }}
      />

      <p className={`text-[11px] font-bold ${hasPin ? 'text-emerald-700' : 'text-slate-500'}`}>
        {hasPin
          ? '✅ پن لگ گیا — ڈرائیورز کو اسی جگہ سے 7 کلومیٹر کے اندر لوڈ نظر آئے گا'
          : '👆 نقشے پر ٹیپ کریں — جہاں سامان لوڈ ہونا ہے وہاں پن لگائیں (اختیاری، لیکن بہتر میچنگ کے لیے تجویز کردہ)'}
      </p>
    </div>
  );
};

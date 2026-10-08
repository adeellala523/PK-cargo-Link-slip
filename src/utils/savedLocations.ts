import { SavedLocation } from '../types';

const KEY = 'pkcl_saved_locations_v1';

function read(): SavedLocation[] {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function write(list: SavedLocation[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch { /* ignore */ }
}

export function getSavedLocations(): SavedLocation[] {
  return read();
}

export function saveLocation(loc: Omit<SavedLocation, 'id' | 'createdAt'>): SavedLocation {
  const entry: SavedLocation = {
    ...loc,
    id: `sl_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  const list = [entry, ...read()].slice(0, 20);
  write(list);
  return entry;
}

export function deleteSavedLocation(id: string) {
  write(read().filter((l) => l.id !== id));
}

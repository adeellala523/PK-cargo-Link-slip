import { db, isDbInCooldown, markDbUnavailable } from './index.ts';
import { slips } from './schema.ts';
import { eq, desc } from 'drizzle-orm';
import { LoadSlip, VehicleType, BodyType, SlipStatus } from '../types/index';

export async function getDbSlips(): Promise<LoadSlip[]> {
  if (isDbInCooldown() || !process.env.SQL_HOST) {
    return [];
  }

  try {
    const rows = await db.select().from(slips).orderBy(desc(slips.createdAt));
    return rows.map((r) => ({
      id: r.id,
      addaId: r.addaId || '',
      addaName: r.addaName,
      addaCity: r.addaCity || '',
      addaAddress: r.addaAddress || undefined,
      addaLogo: r.addaLogo || undefined,
      managerName: r.managerName || '',
      primaryPhone: r.primaryPhone,
      whatsappNumber: r.whatsappNumber || '',
      additionalContacts: r.additionalContacts ? JSON.parse(r.additionalContacts) : [],
      loadingCity: r.loadingCity,
      loadingLocation: r.loadingLocation || '',
      destinationCity: r.destinationCity,
      destinationLocation: r.destinationLocation || '',
      goods: r.goods,
      weight: r.weight || '',
      quantity: r.quantity || '',
      vehicleType: (r.vehicleType as VehicleType) || '22 Wheeler',
      bodyType: (r.bodyType as BodyType) || 'فل باڈی',
      vehicleNumber: r.vehicleNumber || undefined,
      fareOffer: r.fareOffer || undefined,
      specialInstructions: r.specialInstructions || undefined,
      status: (r.status as SlipStatus) || 'active',
      viewsCount: r.viewsCount || 0,
      sharesCount: r.sharesCount || 0,
      createdAt: r.createdAt || new Date().toISOString(),
    }));
  } catch (error: any) {
    markDbUnavailable(error);
    return [];
  }
}

export async function saveDbSlip(slip: LoadSlip): Promise<LoadSlip | null> {
  if (isDbInCooldown() || !process.env.SQL_HOST) {
    return null;
  }

  try {
    const payload = {
      id: slip.id,
      userId: null,
      addaId: slip.addaId || '',
      addaName: slip.addaName,
      addaCity: slip.addaCity || '',
      addaAddress: slip.addaAddress || null,
      addaLogo: slip.addaLogo || null,
      managerName: slip.managerName || '',
      primaryPhone: slip.primaryPhone,
      whatsappNumber: slip.whatsappNumber || '',
      additionalContacts: slip.additionalContacts ? JSON.stringify(slip.additionalContacts) : '[]',
      loadingCity: slip.loadingCity,
      loadingLocation: slip.loadingLocation || '',
      destinationCity: slip.destinationCity,
      destinationLocation: slip.destinationLocation || '',
      goods: slip.goods,
      weight: slip.weight || '',
      quantity: slip.quantity || '',
      vehicleType: slip.vehicleType,
      bodyType: slip.bodyType || 'فل باڈی',
      vehicleNumber: slip.vehicleNumber || null,
      fareOffer: slip.fareOffer || null,
      specialInstructions: slip.specialInstructions || null,
      status: slip.status || 'active',
      viewsCount: slip.viewsCount || 0,
      sharesCount: slip.sharesCount || 0,
      createdAt: slip.createdAt || new Date().toISOString(),
    };

    await db
      .insert(slips)
      .values(payload)
      .onConflictDoUpdate({
        target: slips.id,
        set: payload,
      });

    return slip;
  } catch (error: any) {
    markDbUnavailable(error);
    return null;
  }
}

export async function deleteDbSlip(id: string): Promise<boolean> {
  if (isDbInCooldown() || !process.env.SQL_HOST) {
    return false;
  }

  try {
    await db.delete(slips).where(eq(slips.id, id));
    return true;
  } catch (error: any) {
    markDbUnavailable(error);
    return false;
  }
}

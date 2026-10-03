export type VehicleType =
  | '22 Wheeler'
  | '10 Wheeler'
  | 'Shahzor'
  | 'JAC'
  | 'Porter'
  | 'Mazda'
  | '16 Foot'
  | '18 Foot'
  | '20 Foot'
  | '40 Foot Container'
  | 'Mazda 16 Foot'
  | 'Mazda 18 Foot'
  | 'Mazda 20 Foot'
  | '40 Foot'
  | 'Other';

export type BodyType = 'پھٹا' | 'ہاف باڈی' | 'فل باڈی' | 'کنٹینر';

export type SlipStatus = 'active' | 'expired' | 'booked';

export interface AddaContact {
  id: string;
  name?: string;
  number: string;
  isWhatsApp?: boolean;
}

export interface AddaProfile {
  id: string;
  managerName: string;
  addaName: string;
  city: string;
  address: string;
  logoUrl?: string;
  primaryPhone: string;
  whatsappNumber: string;
  contact1?: string;
  contact2?: string;
  contact3?: string;
  contact4?: string;
  contact5?: string;
  isVerified?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoadSlip {
  id: string; // Unique format: PKCL-YYYYMMDD-XXXXXX
  addaId: string;
  addaName: string;
  addaCity: string;
  addaAddress?: string;
  addaLogo?: string;
  managerName: string;
  primaryPhone: string;
  whatsappNumber: string;
  additionalContacts: string[];
  
  // Loading Details
  loadingCity: string;
  loadingLocation: string;
  
  // Destination Details
  destinationCity: string;
  destinationLocation: string;
  
  // Goods & Vehicle
  goods: string;
  weight: string;
  quantity: string;
  vehicleType: VehicleType;
  bodyType: BodyType;
  vehicleNumber?: string;
  
  // Freight / Notes
  fareOffer?: string; // Optional fare/کرایہ
  specialInstructions?: string;
  
  // Metadata
  status: SlipStatus;
  createdAt: string;
  expiresAt?: string;
  viewsCount: number;
  sharesCount: number;
}

export interface WhatsAppGroup {
  id: string;
  name: string;
  description?: string;
  inviteLink?: string;
  routeHint?: string;
  phoneNumber?: string; // Direct WhatsApp contact/admin number (e.g. 03001234567)
  chatId?: string; // WhatsApp Chat ID / JID (e.g. 923001234567@c.us or group JID)
}

export interface UserAccount {
  id: string;
  phone: string;
  password?: string;
  addaName: string;
  managerName: string;
  city: string;
  address: string;
  logoUrl?: string;
  whatsappNumber: string;
  contact1?: string;
  contact2?: string;
  contact3?: string;
  contact4?: string;
  contact5?: string;
  
  // Subscription & Payment status
  status: 'active' | 'pending_payment' | 'locked_expired';
  subscriptionPlan: 'monthly';
  subscriptionStartedAt?: string;
  subscriptionExpiresAt?: string;
  paymentScreenshot?: string;
  paymentTransactionId?: string;
  paymentSubmittedAt?: string;
  isApprovedByAdmin: boolean;
  createdAt: string;
}

export interface PaymentSettings {
  isPaymentRequired: boolean; // default: false (disabled)
  monthlyFee: number; // default: 1500
  jazzcashNumber: string;
  jazzcashTitle: string;
  easypaisaNumber: string;
  easypaisaTitle: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountTitle: string;
  instructions: string;
}

export interface AdminStats {
  totalAddas: number;
  totalSlips: number;
  activeLoads: number;
  expiredLoads: number;
  todaySlips: number;
  topRoutes: { route: string; count: number }[];
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'driver_match' | 'query_received' | 'slip_booked' | 'system';
  slipId?: string;
  route?: string;
  driverPhone?: string;
  driverName?: string;
  vehicleType?: string;
  createdAt: string;
  read: boolean;
}

export interface DriverLoadQuery {
  id: string;
  driverName: string;
  driverPhone: string;
  fromCity: string;
  toCity: string;
  vehicleType: string;
  notes?: string;
  createdAt: string;
}

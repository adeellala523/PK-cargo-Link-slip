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

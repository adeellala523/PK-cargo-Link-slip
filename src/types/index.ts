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
  | 'Other'
  | string;

export type BodyType = 'پھٹا' | 'ہاف باڈی' | 'فل باڈی' | 'کنٹینر' | string;

export type SlipStatus = 'active' | 'expired' | 'booked';

export type DriverTripStatus =
  | 'not_started'
  | 'at_loading'
  | 'in_transit'
  | 'reached_destination'
  | 'delivered';

export interface DriverTripUpdate {
  id: string;
  status: DriverTripStatus;
  statusUrdu: string;
  driverName?: string;
  driverPhone?: string;
  currentCity?: string;
  notes?: string;
  timestamp: string;
}

export interface NamedContact {
  name: string;
  number: string;
}

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
  contact1Name?: string;
  contact2?: string;
  contact2Name?: string;
  contact3?: string;
  contact3Name?: string;
  contact4?: string;
  contact4Name?: string;
  contact5?: string;
  contact5Name?: string;
  namedContacts?: NamedContact[];
  isVerified?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoadSlip {
  id: string; // Unique format: PKCLYYYYMMDDXXXXXX
  addaId: string;
  addaName: string;
  addaCity: string;
  addaAddress?: string;
  addaLogo?: string;
  managerName: string;
  primaryPhone: string;
  whatsappNumber: string;
  additionalContacts: string[];
  namedContacts?: NamedContact[];
  
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
  vehicleType: string;
  bodyType: string;
  vehicleNumber?: string;
  
  // Freight / Notes
  fareOffer?: string; // Optional fare/کرایہ
  specialInstructions?: string;
  
  // Metadata
  status: SlipStatus;
  createdAt: string;
  updatedAt?: string;
  expiresAt?: string;
  viewsCount: number;
  sharesCount: number;

  // Driver Trip Live Status Tracking
  driverTripStatus?: DriverTripStatus;
  driverTripUpdates?: DriverTripUpdate[];
  driverAssignedName?: string;
  driverAssignedPhone?: string;
  lastDriverUpdateAt?: string;

  // Multi-Load Support (Allow 2 or more loads per slip)
  additionalLoads?: Array<{
    goods: string;
    loadingCity: string;
    destinationCity: string;
    weight?: string;
    quantity?: string;
    vehicleType?: string;
    bodyType?: string;
    fareOffer?: string;
  }>;
}

export interface WhatsAppGroup {
  id: string;
  name: string;
  description?: string;
  inviteLink?: string;
  routeHint?: string;
  phoneNumber?: string; // Direct WhatsApp contact/admin number
  chatId?: string;
}

export interface UserAccount {
  id: string;
  phone: string;
  password?: string;
  role?: 'adda_manager' | 'driver';
  addaName: string;
  managerName: string;
  city: string;
  address: string;
  logoUrl?: string;
  whatsappNumber: string;
  contact1?: string;
  contact1Name?: string;
  contact2?: string;
  contact2Name?: string;
  contact3?: string;
  contact3Name?: string;
  contact4?: string;
  contact4Name?: string;
  contact5?: string;
  contact5Name?: string;
  namedContacts?: NamedContact[];

  // Driver specific details if role is driver
  driverDetails?: {
    vehicleType?: string;
    bodyType?: string;
    vehicleNumber?: string;
    preferredRoute?: string;
  };
  
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

export interface DriverRating {
  id: string;
  driverPhone: string;
  driverName?: string;
  addaId?: string;
  addaName?: string;
  rating: number; // 1 to 5
  feedback?: string;
  slipId?: string;
  createdAt: string;
}

export interface DriverAccount {
  id: string;
  driverName: string;
  phone: string;
  password?: string;
  whatsappNumber?: string;
  vehicleType: string;
  bodyType?: string;
  vehicleNumber?: string;
  currentCity: string;
  preferredRoute?: string;
  createdAt?: string;
  registeredAt?: string;
  isVerified?: boolean;
  totalRatingsCount?: number;
  averageRating?: number;
}

export interface PaymentSettings {
  isPaymentRequired: boolean; // default: false
  monthlyFee: number;
  jazzcashNumber: string;
  jazzcashTitle: string;
  jazzcashTillId?: string;
  jazzcashQrImage?: string;
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
  type: 'driver_match' | 'query_received' | 'slip_booked' | 'driver_status_update' | 'system';
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

export interface AvailableTruck {
  id: string;
  driverOrOwnerName: string;
  phone: string;
  whatsappNumber?: string;
  vehicleType: string;
  bodyType: string;
  vehicleNumber?: string;
  currentCity: string;
  locationDetails?: string;
  preferredRoute?: string;
  createdAt: string;
  userId?: string;
  createdByPhone?: string;
  userRole?: 'driver' | 'adda_manager';
}

export interface AiVoiceSubscription {
  isSubscribed: boolean;
  isTrial: boolean;
  planFee: number; // 500 PKR
  expiresAt: string; // ISO date
  subscribedAt: string;
  transactionId?: string;
  paymentMethod?: 'jazzcash' | 'easypaisa' | 'bank' | 'trial';
  userPhone?: string;
}

export interface AiVoiceCallAction {
  type: 'search_loads' | 'create_slip' | 'register_truck' | 'register_driver' | 'navigate' | 'info';
  params?: Record<string, any>;
  summaryUrdu?: string;
}

export interface AiVoiceMessage {
  id: string;
  sender: 'driver' | 'ai';
  text: string;
  timestamp: string;
  action?: AiVoiceCallAction;
  audioGenerated?: boolean;
}


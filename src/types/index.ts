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

export interface SingleLoadItem {
  id?: string;
  goods: string;
  loadingCity: string;
  loadingLocation?: string;
  destinationCity: string;
  destinationLocation?: string;
  weight?: string;
  quantity?: string;
  vehicleType?: string;
  bodyType?: string;
  fareOffer?: string;
}

/**
 * PriceOffer — one bid in the inDrive-style negotiation thread.
 * Adda opens with their price; driver counters; back-and-forth until
 * someone accepts. Only the latest 'pending' offer awaits a response.
 */
export interface PriceOffer {
  id: string;
  by: 'adda' | 'driver';
  byName: string;
  byPhone: string;
  amount: string;
  createdAt: string;
  status: 'pending' | 'accepted' | 'declined';
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
  /** Pickup GPS coordinates (geocoded from loadingCity when the slip is posted).
      Used for driver proximity filtering (7km rule). */
  pickupLat?: number;
  pickupLng?: number;
  
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

  // Driver accepted this load (Yango Pro style accept flow)
  acceptedByDriverName?: string;
  acceptedByDriverPhone?: string;
  acceptedAt?: string;

  // InDrive-style negotiation: driver's counter offer
  driverOffer?: string;

  // --- inDrive-style price negotiation thread ---
  // Adda posts with their price → driver counters → adda counters → deal.
  // Only the latest 'pending' offer awaits a response (turn-taking).
  offers?: PriceOffer[];
  /** Agreed price when a deal is struck (accepted offer amount) */
  finalFare?: string;

  /** inDrive Freight-style trip kind: city (intracity) | freight | intercity */
  tripKind?: 'city' | 'freight' | 'intercity';

  // Lifecycle (Yango-style history)
  completedAt?: string;
  cancelledAt?: string;

  // Multi-Load Support (Allow 2 or more loads per slip)
  additionalLoads?: SingleLoadItem[];
  includeContactsInWhatsApp?: boolean; // Default false (Preview only rule)

  // Import origin marker (e.g. 'whatsapp' for chat-export imports)
  source?: string;
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

  // Verification (KYC) — mandatory for posting loads / listing vehicles
  verificationStatus?: 'unverified' | 'pending' | 'verified' | 'rejected';
  verificationDocs?: {
    // Driver docs
    driverLicenseUrl?: string;   // ڈرائیونگ لائسنس کی تصویر
    numberPlateUrl?: string;     // گاڑی کی نمبر پلیٹ کی تصویر
    cnicUrl?: string;            // شناختی کارڈ (فرنٹ) کی تصویر
    // Adda manager docs
    addaPhotoUrl?: string;       // اڈے کی تصویر
    addaLocationLat?: number;    // اڈے کی لوکیشن (نقشہ)
    addaLocationLng?: number;
    addaLocationLabel?: string;  // لوکیشن کا نام/پتہ
  };
  verificationRejectedReason?: string;
  verificationSubmittedAt?: string;
  verificationReviewedAt?: string;
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

/** Saved pickup/delivery point (Yango-style saved places) */
export interface SavedLocation {
  id: string;
  label: string;   // e.g. "میرا اڈا", "گودام"
  city: string;
  location: string;
  kind: 'pickup' | 'delivery' | 'both';
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
  userRole?: 'driver' | 'adda_manager' | 'admin';
  status?: 'available' | 'booked';
  /** True when the truck row was mirrored from a load slip record */
  isFromSlip?: boolean;
  /** Import origin marker (e.g. 'whatsapp' for chat-export imports) */
  source?: string;
  /** GPS coords of the truck's current location (geocoded on listing).
      Used for proximity-sorted vehicle matching for adda managers. */
  truckLat?: number;
  truckLng?: number;
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


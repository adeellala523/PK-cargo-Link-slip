import { pgTable, serial, text, timestamp, integer, boolean } from 'drizzle-orm/pg-core';

// Users table (linked to Firebase Auth UID)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name'),
  phone: text('phone'),
  role: text('role').default('user'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Load Slips table
export const slips = pgTable('slips', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  addaId: text('adda_id'),
  addaName: text('adda_name').notNull(),
  addaCity: text('adda_city'),
  addaAddress: text('adda_address'),
  addaLogo: text('adda_logo'),
  managerName: text('manager_name'),
  primaryPhone: text('primary_phone').notNull(),
  whatsappNumber: text('whatsapp_number'),
  additionalContacts: text('additional_contacts'), // JSON string array
  loadingCity: text('loading_city').notNull(),
  loadingLocation: text('loading_location'),
  destinationCity: text('destination_city').notNull(),
  destinationLocation: text('destination_location'),
  goods: text('goods').notNull(),
  weight: text('weight'),
  quantity: text('quantity'),
  vehicleType: text('vehicle_type').notNull(),
  bodyType: text('body_type'),
  vehicleNumber: text('vehicle_number'),
  fareOffer: text('fare_offer'),
  specialInstructions: text('special_instructions'),
  status: text('status').default('active'),
  viewsCount: integer('views_count').default(0),
  sharesCount: integer('shares_count').default(0),
  createdAt: text('created_at'),
});

// Adda Profiles table
export const addaProfiles = pgTable('adda_profiles', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  managerName: text('manager_name'),
  addaName: text('adda_name').notNull(),
  city: text('city'),
  address: text('address'),
  logoUrl: text('logo_url'),
  primaryPhone: text('primary_phone').notNull(),
  whatsappNumber: text('whatsapp_number'),
  contact1: text('contact_1'),
  contact2: text('contact_2'),
  contact3: text('contact_3'),
  contact4: text('contact_4'),
  contact5: text('contact_5'),
  isVerified: boolean('is_verified').default(true),
  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
});

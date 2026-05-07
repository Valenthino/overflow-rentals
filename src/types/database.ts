export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type VehicleStatus = 'available' | 'rented' | 'maintenance' | 'retired';
export type TripStatus = 'upcoming' | 'active' | 'completed' | 'cancelled';
export type BookingStatus = 'confirmed' | 'active' | 'completed' | 'cancelled' | 'no_show';
export type ClaimStatus = 'open' | 'submitted' | 'under_review' | 'approved' | 'denied' | 'paid' | 'appealed' | 'closed';
export type CleaningType = 'quick' | 'full' | 'deep';
export type CleaningStatus = 'scheduled' | 'in_progress' | 'completed';
export type ExpenseCategory =
  | 'fuel' | 'insurance' | 'maintenance' | 'cleaning' | 'tolls_tickets'
  | 'parking' | 'registration' | 'financing' | 'supplies' | 'software'
  | 'marketing' | 'office' | 'professional' | 'depreciation' | 'other';
export type PayoutType = 'owner_draw' | 'salary' | 'bonus' | 'reimbursement' | 'other';
export type TeamRole = 'driver' | 'cleaner' | 'manager' | 'admin';
export type PayType = 'hourly' | 'per_job' | 'salary';
export type MaintenanceType =
  | 'oil_change' | 'tire_rotation' | 'brake_service' | 'battery'
  | 'transmission' | 'coolant' | 'air_filter' | 'cabin_filter'
  | 'spark_plugs' | 'alignment' | 'inspection' | 'recall' | 'other';
export type ClaimCategory =
  | 'body_damage' | 'interior_damage' | 'windshield' | 'tire_wheel'
  | 'mechanical' | 'theft' | 'total_loss' | 'smoking'
  | 'pet_damage' | 'excessive_miles' | 'late_return' | 'toll_violation'
  | 'parking_ticket' | 'other';

export interface Database {
  public: {
    Tables: {
      vehicles: {
        Row: Vehicle;
        Insert: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Vehicle, 'id' | 'created_at'>>;
      };
      trips: {
        Row: Trip;
        Insert: Omit<Trip, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Trip, 'id' | 'created_at'>>;
      };
      bookings: {
        Row: Booking;
        Insert: Omit<Booking, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Booking, 'id' | 'created_at'>>;
      };
      renters: {
        Row: Renter;
        Insert: Omit<Renter, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Renter, 'id' | 'created_at'>>;
      };
      expenses: {
        Row: Expense;
        Insert: Omit<Expense, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Expense, 'id' | 'created_at'>>;
      };
      cleaning: {
        Row: Cleaning;
        Insert: Omit<Cleaning, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Cleaning, 'id' | 'created_at'>>;
      };
      maintenance: {
        Row: Maintenance;
        Insert: Omit<Maintenance, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Maintenance, 'id' | 'created_at'>>;
      };
      claims: {
        Row: Claim;
        Insert: Omit<Claim, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Claim, 'id' | 'created_at'>>;
      };
      team_members: {
        Row: TeamMember;
        Insert: Omit<TeamMember, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<TeamMember, 'id' | 'created_at'>>;
      };
      payouts: {
        Row: Payout;
        Insert: Omit<Payout, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Payout, 'id' | 'created_at'>>;
      };
      mileage_logs: {
        Row: MileageLog;
        Insert: Omit<MileageLog, 'id' | 'created_at'>;
        Update: Partial<Omit<MileageLog, 'id' | 'created_at'>>;
      };
      settings: {
        Row: Setting;
        Insert: Setting;
        Update: Partial<Setting>;
      };
    };
  };
}

export interface Vehicle {
  id: string;
  user_id: string;
  make: string;
  model: string;
  year: number;
  vin: string | null;
  license_plate: string | null;
  color: string | null;
  status: VehicleStatus;
  purchase_price: number | null;
  purchase_date: string | null;
  insurance_monthly: number | null;
  financing_monthly: number | null;
  turo_listing_url: string | null;
  daily_rate: number | null;
  retirement_date: string | null;
  retirement_km: number | null;
  current_odometer: number | null;
  notes: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Trip {
  id: string;
  user_id: string;
  reservation_id: string | null;
  vehicle_id: string | null;
  vehicle_name: string | null;
  guest_name: string | null;
  status: TripStatus;
  start_date: string | null;
  end_date: string | null;
  pickup_location: string | null;
  return_location: string | null;
  checkin_odometer: number | null;
  checkout_odometer: number | null;
  trip_price: number;
  total_discounts: number;
  extras: number;
  delivery_fee: number;
  other_fees: number;
  sales_tax: number;
  host_fee: number;
  total_earnings: number;
  days: number;
  source: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  vehicle_id: string | null;
  vehicle_name: string | null;
  renter_name: string | null;
  renter_id: string | null;
  status: BookingStatus;
  pickup_date: string | null;
  pickup_time: string | null;
  pickup_location: string | null;
  return_date: string | null;
  return_time: string | null;
  return_location: string | null;
  daily_rate: number | null;
  total_price: number | null;
  pre_trip_check: boolean;
  post_trip_check: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Renter {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  turo_username: string | null;
  drivers_license: string | null;
  total_trips: number;
  average_rating: number | null;
  is_flagged: boolean;
  flag_reason: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  vehicle_id: string | null;
  vehicle_name: string | null;
  vendor: string | null;
  payment_method: string | null;
  is_tax_deductible: boolean;
  gst_amount: number;
  receipt_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Cleaning {
  id: string;
  user_id: string;
  vehicle_id: string | null;
  vehicle_name: string | null;
  date: string;
  assigned_to: string | null;
  type: CleaningType;
  status: CleaningStatus;
  cost: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Maintenance {
  id: string;
  user_id: string;
  vehicle_id: string | null;
  vehicle_name: string | null;
  date: string;
  type: MaintenanceType;
  description: string | null;
  vendor: string | null;
  cost: number;
  odometer: number | null;
  next_due_date: string | null;
  next_due_odometer: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Claim {
  id: string;
  user_id: string;
  vehicle_id: string | null;
  vehicle_name: string | null;
  trip_id: string | null;
  renter_name: string | null;
  category: ClaimCategory;
  status: ClaimStatus;
  incident_date: string | null;
  description: string | null;
  claimed_amount: number;
  received_amount: number;
  insurance_claim_number: string | null;
  is_insurance_claim: boolean;
  resolution_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: TeamRole;
  pay_rate: number | null;
  pay_type: PayType;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payout {
  id: string;
  user_id: string;
  date: string;
  recipient: string;
  type: PayoutType;
  amount: number;
  description: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MileageLog {
  id: string;
  user_id: string;
  vehicle_id: string;
  date: string;
  odometer: number;
  notes: string | null;
  created_at: string;
}

export interface Setting {
  user_id: string;
  key: string;
  value: string;
}

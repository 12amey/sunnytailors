export type Language = 'en' | 'mr';

export const measurementFields = [
  'height',
  'blouse_back_length',
  'chest',
  'arm_length',
  'arm_measurements',
  'pants_length',
  'top_length',
  'waist',
  'hip',
  'sleeve_length',
  'sleeve_width',
  'front_neck',
  'back_neck',
  'top_chest',
  'top_waist',
  'top_hip',
  'top_sleeve_length',
  'top_sleeve_width',
  'top_arm_length',
  'top_front_neck',
  'top_back_neck',
  'pants_waist',
  'pants_hip',
  'pants_thigh',
  'pants_crotch',
  'pants_bottom',
  'nine_vaari_front_length',
  'nine_vaari_back_length',
  'nine_vaari_crotch_length',
  'nine_vaari_waist',
  'nine_vaari_hip',
  'nine_vaari_pleats',
  'nine_vaari_pallu',
] as const;

export type MeasurementField = (typeof measurementFields)[number];
export type Measurements = Partial<Record<MeasurementField, string>>;

export type Customer = {
  id: string;
  name: string;
  phone: string;
  notes: string;
  garment_type: string;
  measurements: Measurements;
  measurement_notes: string;
  measurement_date: string;
  design_image?: string;
  created_at: string;
  updated_at: string;
};

export type CustomerDraft = Omit<Customer, 'id' | 'created_at' | 'updated_at' | 'design_image'>;

export type CustomerEvent = {
  id: string;
  customer_id: string;
  event_type: 'measurement_created' | 'measurement_updated' | 'payment' | 'design_saved';
  title: string;
  amount: number | null;
  notes: string;
  details: Record<string, unknown>;
  created_at: string;
};

export type ScanField = { value: string; confidence: number };
export type ScanResult = {
  name?: ScanField;
  phone?: ScanField;
  notes?: ScanField;
  garment_type?: ScanField;
  measurement_notes?: ScanField;
  measurement_date?: ScanField;
  measurements?: Partial<Record<MeasurementField, ScanField>>;
};

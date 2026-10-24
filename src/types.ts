export type Language = 'en' | 'mr';

export const measurementFields = [
  'pants_length',
  'top_length',
  'waist',
  'hip',
  'sleeve_length',
  'sleeve_width',
  'front_neck',
  'back_neck',
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
  created_at: string;
  updated_at: string;
};

export type CustomerDraft = Omit<Customer, 'id' | 'created_at' | 'updated_at'>;

export type ScanField = { value: string; confidence: number };
export type ScanResult = {
  name?: ScanField;
  phone?: ScanField;
  notes?: ScanField;
  garment_type?: ScanField;
  measurement_notes?: ScanField;
  measurements?: Partial<Record<MeasurementField, ScanField>>;
};

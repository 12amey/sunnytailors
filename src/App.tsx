import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type PointerEvent as ReactPointerEvent } from 'react';
import {
  AlertCircle, Brush, CalendarDays, Camera, Check, ChevronLeft, ChevronRight, CircleHelp, Clock3, Eraser, FileStack,
  Languages, LoaderCircle, Pencil, Plus, RotateCcw, RotateCw, Save, Search, Scissors,
  Sparkles, Trash2, UserRound, Users, X,
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { measurementFields, type Customer, type CustomerDraft, type CustomerEvent, type CustomerOrder, type CustomerOrderPayment, type Language, type MeasurementField, type ScanResult } from './types';

const emptyDraft = (): CustomerDraft => ({
  name: '', phone: '', notes: '', garment_type: '', measurements: {}, measurement_notes: '', measurement_date: '', design_image: '',
});
const localDateString = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const copy = {
  en: {
    subtitle: 'Customer book', search: 'Search by name, phone or measurement…', add: 'Add customer',
    records: 'Customer records', customers: 'customers', noCustomers: 'Your customer book is empty',
    noCustomersHelp: 'Add your first customer to keep their contact details and measurements together.',
    noResults: 'No matching customers', noResultsHelp: 'Try another name, phone number, or measurement.',
    newCustomer: 'New customer', editCustomer: 'Edit customer', basic: 'Customer details', measurements: 'Measurements',
    name: 'Name', phone: 'Phone number', garment: 'Garment type', notes: 'Customer notes',
    date: 'Measurement date', topMeasurements: 'Top measurements', pantsMeasurements: 'Pants measurements',
    chooseGarment: 'Choose garment type', blouseOption: 'Blouse', dressOption: 'Dress', nineVaariOption: '9 vaari', otherOption: 'Other', otherGarmentPlaceholder: 'Enter garment type',
    measureNotes: 'Measurement notes', namePlaceholder: 'Customer name', phonePlaceholder: 'Phone number',
    garmentPlaceholder: 'e.g. Blouse, dress, trousers', notesPlaceholder: 'Style preferences, fitting notes…',
    measureNotesPlaceholder: 'Extra notes about these measurements…', save: 'Save customer', saving: 'Saving…',
    cancel: 'Cancel', required: 'Please enter a customer name.', saved: 'Customer saved',
    saveError: 'Could not save the customer. Check the database setup and try again.',
    connectionError: 'Could not load records. Check your connection and Supabase setup.',
    setupTitle: 'Connect your customer book', setupBody: 'Add your Supabase URL and publishable key in Netlify, then run the SQL setup script in Supabase.',
    scan: 'Scan Marathi note', camera: 'Take photo', gallery: 'Choose photo', rotate: 'Rotate photo', scanning: 'Reading note…',
    scanHint: 'Photograph a measurement page. AI will read Marathi handwriting and fill a draft for you to review.',
    scanPrivacy: 'The selected image is sent to Google Gemini for reading. It is not saved with the customer record.',
    scanNeedKey: 'Add GEMINI_API_KEY to Netlify environment variables to enable image scanning.',
    scanError: 'The note could not be read. Try a clearer, brighter photo with the full page in view.',
    scanApplied: 'Draft filled. Review every value before saving.', confidence: 'AI confidence',
    emptyMeasure: 'No measurements added', delete: 'Delete', deleteConfirm: 'Delete this customer record? This cannot be undone.',
    updated: 'Updated', addFirst: 'Add first customer', searchCount: 'shown', localData: 'Public customer book',
    unitHint: 'Enter measurements as written in the notebook. Marathi text and digits are supported.',
    selectPhoto: 'Choose a measurement photo', close: 'Close form', noMeasurements: 'Add values as written in the notebook.',
    cameraHint: 'A clear, upright photo with the whole page visible gives the best reading.',
    datePlaceholder: 'Choose date',
    bodyGroup: 'Body measurements', lengthGroup: 'Garment lengths', armsGroup: 'Sleeve and arm measurements', neckGroup: 'Neck measurements',
    designPad: 'Design scratchpad', designPadHint: 'Sketch a clothing design for this customer. Save it with their record.',
    pen: 'Pen', eraser: 'Eraser', undo: 'Undo', clearDrawing: 'Clear', saveDrawing: 'Save design', savingDrawing: 'Saving design…', drawingSaved: 'Design saved with this customer.', drawingError: 'Could not save the design.', drawingColor: 'Pen color',
    batch: 'Bulk import', batchTitle: 'Import multiple customers', batchHint: 'Choose one or more notebook photos. AI finds each customer entry on every page and saves the results automatically.',
    batchChoose: 'Choose photos', batchRun: 'Scan and save all', batchRunning: 'Scanning and saving…', batchPrivacy: 'Photos are sent to Google Gemini for reading and are not stored. Extracted customer details are saved directly to this public customer book.',
    batchDone: 'Import finished', batchProgress: 'Photos processed', batchError: 'Could not import this photo', batchEmpty: 'No customer entries with measurements were found in this photo.', batchNameFallback: 'Name not readable', batchSize: 'Each photo must be smaller than 4 MB.',
    history: 'Customer history', noHistory: 'No activity recorded yet.', payment: 'Add payment', paymentTitle: 'Record a payment', amount: 'Amount', paymentDate: 'Payment date', paymentMethod: 'Method', paymentNote: 'Note (optional)', cash: 'Cash', upi: 'UPI', otherMethod: 'Other', savePayment: 'Save payment', paymentSaved: 'Payment recorded.', paymentError: 'Could not record payment. Run the latest Supabase schema first.', totalPaid: 'Total paid', measurementAdded: 'Measurements added', measurementUpdated: 'Measurements updated', designSavedEvent: 'Design sketch saved', paymentEvent: 'Payment received', amountRequired: 'Enter a valid amount greater than zero.',
    sariGroup: '9 vaari drape', topGroup: 'Top', pantsGroup: 'Pants',
    addBill: 'New bill / order', billTitle: 'New tailoring bill', linkedCustomer: 'Find customer', billGarment: 'Garment / work', billDescription: 'Work description', billAmount: 'Total bill (₹)', advanceAmount: 'Advance received (₹)', balanceDue: 'Balance due', remainingAfterAdvance: 'Remaining after advance', advanceMethod: 'Advance method', dueDate: 'Delivery date', calendarNote: 'This delivery date will appear on the calendar.', orderNotes: 'Order notes', createBill: 'Save bill', selectCustomer: 'Search and select an existing customer', chooseCustomer: 'Select customer', noCustomerMatch: 'No matching customer found.', billSaved: 'Bill saved', billError: 'Could not save this bill. Run the latest Supabase schema and try again.', bills: 'Bills and tailoring orders', noBills: 'No bills yet. Add a bill to track advance and balance.', order: 'Order', status: 'Status', orderNew: 'New', orderInProgress: 'In progress', orderReady: 'Ready', orderDelivered: 'Delivered', orderCancelled: 'Cancelled', totalBill: 'Total', paidSoFar: 'Paid', due: 'Due', remainingPayment: 'Add payment', editBill: 'Edit bill', paymentForBill: 'Attach to bill', noOrderLink: 'Unassigned payment', orderPayment: 'Order payment', advanceStage: 'Advance', partPaymentStage: 'Part payment', finalPaymentStage: 'Final balance', attachedMeasurements: 'Current measurements will be saved with this bill.', sketchDuringEntry: 'Design scratchpad', createOrEditSketchHint: 'Draw the design now; it will save with this customer. You can edit it later.', sketchEdited: 'Sketch changes are saved with the customer.', paymentExceedsDue: 'Payment is more than this bill’s remaining balance.', calendar: 'Calendar', todayWork: "Today's work", noWork: 'No deliveries scheduled for this date.', markComplete: 'Mark complete', postpone: 'Postpone', postponedTo: 'New delivery date', saveDate: 'Reschedule', monthPrev: 'Previous month', monthNext: 'Next month', backToRecords: 'Customer records',
  },
  mr: {
    subtitle: 'ग्राहक वही', search: 'नाव, फोन किंवा माप शोधा…', add: 'ग्राहक जोडा',
    records: 'ग्राहक नोंदी', customers: 'ग्राहक', noCustomers: 'तुमच्या ग्राहक वहीत अजून नोंदी नाहीत',
    noCustomersHelp: 'नाव, संपर्क आणि माप एकत्र ठेवण्यासाठी पहिला ग्राहक जोडा.',
    noResults: 'जुळणारे ग्राहक सापडले नाहीत', noResultsHelp: 'दुसरे नाव, फोन नंबर किंवा माप शोधा.',
    newCustomer: 'नवीन ग्राहक', editCustomer: 'ग्राहकाची नोंद बदला', basic: 'ग्राहकाची माहिती', measurements: 'मापे',
    name: 'नाव', phone: 'फोन नंबर', garment: 'कपड्याचा प्रकार', notes: 'ग्राहकाबद्दल नोंद',
    date: 'मापाची तारीख', topMeasurements: 'टॉपची मापे', pantsMeasurements: 'पँटची मापे',
    chooseGarment: 'कपड्याचा प्रकार निवडा', blouseOption: 'ब्लाउज', dressOption: 'ड्रेस', nineVaariOption: '९ वारी', otherOption: 'इतर', otherGarmentPlaceholder: 'कपड्याचा प्रकार लिहा',
    measureNotes: 'मापांबद्दल नोंद', namePlaceholder: 'ग्राहकाचे नाव', phonePlaceholder: 'फोन नंबर',
    garmentPlaceholder: 'उदा. ब्लाउज, ड्रेस, पँट', notesPlaceholder: 'आवड, फिटिंगविषयी नोंद…',
    measureNotesPlaceholder: 'या मापांबद्दल इतर नोंद…', save: 'ग्राहक जतन करा', saving: 'जतन होत आहे…',
    cancel: 'रद्द करा', required: 'कृपया ग्राहकाचे नाव लिहा.', saved: 'ग्राहकाची नोंद जतन झाली',
    saveError: 'नोंद जतन झाली नाही. डेटाबेसची मांडणी तपासून पुन्हा प्रयत्न करा.',
    connectionError: 'नोंदी उघडता आल्या नाहीत. इंटरनेट आणि Supabase मांडणी तपासा.',
    setupTitle: 'ग्राहक वही जोडा', setupBody: 'Netlify मध्ये Supabase URL आणि publishable key जोडा, मग Supabase मध्ये SQL मांडणी चालवा.',
    scan: 'मराठी चिठ्ठी स्कॅन करा', camera: 'फोटो काढा', gallery: 'फोटो निवडा', rotate: 'फोटो फिरवा', scanning: 'चिठ्ठी वाचत आहे…',
    scanHint: 'मापांच्या पानाचा फोटो घ्या. AI मराठी हस्ताक्षर वाचून तपासण्यासाठी मसुदा भरेल.',
    scanPrivacy: 'निवडलेला फोटो वाचण्यासाठी Google Gemini कडे पाठवला जातो. तो ग्राहकाच्या नोंदीत जतन होत नाही.',
    scanNeedKey: 'फोटो स्कॅन सुरू करण्यासाठी Netlify पर्यावरणीय चलांमध्ये GEMINI_API_KEY जोडा.',
    scanError: 'चिठ्ठी वाचता आली नाही. पूर्ण पानाचा स्वच्छ, उजेडात काढलेला फोटो वापरून पाहा.',
    scanApplied: 'मसुदा भरला. जतन करण्यापूर्वी प्रत्येक किंमत तपासा.', confidence: 'AI विश्वास पातळी',
    emptyMeasure: 'मापे दिलेली नाहीत', delete: 'हटवा', deleteConfirm: 'ही ग्राहक नोंद हटवायची? ही क्रिया मागे घेता येणार नाही.',
    updated: 'बदल', addFirst: 'पहिला ग्राहक जोडा', searchCount: 'दिसत आहेत', localData: 'सार्वजनिक ग्राहक वही',
    unitHint: 'वहीत लिहिलेली मापे तशीच भरा. मराठी मजकूर आणि अंक चालतात.',
    selectPhoto: 'मापांच्या चिठ्ठीचा फोटो निवडा', close: 'फॉर्म बंद करा', noMeasurements: 'वहीत लिहिल्याप्रमाणे मापे भरा.',
    cameraHint: 'पूर्ण पान दिसेल असा सरळ आणि स्पष्ट फोटो काढल्यास वाचन चांगले होते.',
    datePlaceholder: 'तारीख निवडा',
    bodyGroup: 'शरीराची मापे', lengthGroup: 'कपड्याची लांबी', armsGroup: 'बाहीची मापे', neckGroup: 'गळ्याची मापे',
    designPad: 'डिझाइन स्क्रॅचपॅड', designPadHint: 'या ग्राहकासाठी कपड्याचे डिझाइन काढा. ते ग्राहकाच्या नोंदीसोबत जतन करा.',
    pen: 'पेन', eraser: 'खोडरबर', undo: 'मागे घ्या', clearDrawing: 'पुसा', saveDrawing: 'डिझाइन जतन करा', savingDrawing: 'डिझाइन जतन होत आहे…', drawingSaved: 'डिझाइन या ग्राहकासोबत जतन झाले.', drawingError: 'डिझाइन जतन झाले नाही.', drawingColor: 'पेनचा रंग',
    batch: 'अनेक नोंदी एकत्र', batchTitle: 'अनेक ग्राहकांची मापे भरा', batchHint: 'वहीची एक किंवा अधिक पाने निवडा. AI प्रत्येक पानावरील ग्राहकांच्या नोंदी वाचून आपोआप जतन करेल.',
    batchChoose: 'फोटो निवडा', batchRun: 'सर्व वाचून जतन करा', batchRunning: 'वाचून जतन होत आहे…', batchPrivacy: 'फोटो वाचण्यासाठी Google Gemini कडे पाठवले जातात आणि जतन होत नाहीत. वाचलेली ग्राहक माहिती या सार्वजनिक वहीत थेट जतन होते.',
    batchDone: 'नोंदी जतन झाल्या', batchProgress: 'पूर्ण केलेले फोटो', batchError: 'हा फोटो जतन करता आला नाही', batchEmpty: 'या फोटोमध्ये मापांसह ग्राहक नोंदी सापडल्या नाहीत.', batchNameFallback: 'नाव वाचता आले नाही', batchSize: 'प्रत्येक फोटो ४ MB पेक्षा लहान हवा.',
    history: 'ग्राहकाचा इतिहास', noHistory: 'अजून कोणतीही नोंद नाही.', payment: 'पैसे नोंदवा', paymentTitle: 'पेमेंट नोंदवा', amount: 'रक्कम', paymentDate: 'पेमेंटची तारीख', paymentMethod: 'पद्धत', paymentNote: 'नोंद (ऐच्छिक)', cash: 'रोख', upi: 'UPI', otherMethod: 'इतर', savePayment: 'पेमेंट जतन करा', paymentSaved: 'पेमेंट नोंदवले.', paymentError: 'पेमेंट नोंदवता आले नाही. आधी नवीनतम Supabase schema चालवा.', totalPaid: 'एकूण मिळाले', measurementAdded: 'मापे जोडली', measurementUpdated: 'मापे बदलली', designSavedEvent: 'डिझाइन जतन केले', paymentEvent: 'पेमेंट मिळाले', amountRequired: 'शून्यापेक्षा जास्त योग्य रक्कम लिहा.',
    sariGroup: '९ वारी नेसणी', topGroup: 'टॉप', pantsGroup: 'पँट',
    addBill: 'नवीन बिल / ऑर्डर', billTitle: 'नवीन शिलाई बिल', linkedCustomer: 'ग्राहक शोधा', billGarment: 'कपडा / काम', billDescription: 'कामाचे वर्णन', billAmount: 'एकूण बिल (₹)', advanceAmount: 'आगाऊ मिळाले (₹)', balanceDue: 'बाकी रक्कम', remainingAfterAdvance: 'आगाऊनंतर बाकी', advanceMethod: 'आगाऊची पद्धत', dueDate: 'देण्याची तारीख', calendarNote: 'ही तारीख दिनदर्शिकेत दिसेल.', orderNotes: 'ऑर्डरची नोंद', createBill: 'बिल जतन करा', selectCustomer: 'जुना ग्राहक शोधून निवडा', chooseCustomer: 'ग्राहक निवडा', noCustomerMatch: 'जुळणारा ग्राहक सापडला नाही.', billSaved: 'बिल जतन झाले', billError: 'बिल जतन झाले नाही. नवीनतम Supabase schema चालवून पुन्हा प्रयत्न करा.', bills: 'बिले आणि शिलाई ऑर्डर', noBills: 'अजून बिल नाही. आगाऊ आणि बाकी रक्कम पाहण्यासाठी बिल जोडा.', order: 'ऑर्डर', status: 'स्थिती', orderNew: 'नवीन', orderInProgress: 'काम सुरू', orderReady: 'तयार', orderDelivered: 'दिलेली', orderCancelled: 'रद्द', totalBill: 'एकूण', paidSoFar: 'मिळाले', due: 'बाकी', remainingPayment: 'पेमेंट जोडा', editBill: 'बिल बदला', paymentForBill: 'बिलाशी जोडा', noOrderLink: 'बिलाशी जोडलेले नाही', orderPayment: 'ऑर्डर पेमेंट', advanceStage: 'आगाऊ', partPaymentStage: 'अंशतः पेमेंट', finalPaymentStage: 'अंतिम बाकी', attachedMeasurements: 'सध्याची मापे या बिलासोबत जतन होतील.', sketchDuringEntry: 'डिझाइन स्क्रॅचपॅड', createOrEditSketchHint: 'आत्ताच डिझाइन काढा; ते ग्राहकासोबत जतन होईल. नंतर पुन्हा बदलता येईल.', sketchEdited: 'डिझाइन ग्राहकासोबत जतन झाले.', paymentExceedsDue: 'पेमेंट बिलाच्या बाकी रकमेपेक्षा जास्त आहे.', calendar: 'दिनदर्शिका', todayWork: 'आजचे काम', noWork: 'या तारखेला डिलिव्हरी नाही.', markComplete: 'पूर्ण झाले', postpone: 'पुढे ढकला', postponedTo: 'नवीन डिलिव्हरी तारीख', saveDate: 'तारीख बदला', monthPrev: 'मागील महिना', monthNext: 'पुढील महिना', backToRecords: 'ग्राहक नोंदी',
  },
} satisfies Record<Language, Record<string, string>>;

const labels: Record<Language, Record<MeasurementField, string>> = {
  en: { height: 'Height', blouse_back_length: 'Blouse back length', chest: 'Chest / bust', arm_length: 'Arm length', arm_measurements: 'Arm measurements', pants_length: 'Pants length', top_length: 'Top length', waist: 'Waist', hip: 'Hip', sleeve_length: 'Sleeve length', sleeve_width: 'Sleeve width', front_neck: 'Front neck', back_neck: 'Back neck', top_chest: 'Top chest / bust', top_waist: 'Top waist', top_hip: 'Top hip', top_sleeve_length: 'Top sleeve length', top_sleeve_width: 'Top sleeve width', top_arm_length: 'Top arm length', top_front_neck: 'Top front neck', top_back_neck: 'Top back neck', pants_waist: 'Pants waist', pants_hip: 'Pants hip', pants_thigh: 'Pants thigh', pants_crotch: 'Pants crotch / rise', pants_bottom: 'Pants bottom width', nine_vaari_front_length: 'Front fall length', nine_vaari_back_length: 'Back fall length', nine_vaari_crotch_length: 'Crotch / dhoti length', nine_vaari_waist: 'Waist', nine_vaari_hip: 'Hip', nine_vaari_pleats: 'Pleat count / width', nine_vaari_pallu: 'Pallu length' },
  mr: { height: 'उंची', blouse_back_length: 'ब्लाउजची मागची लांबी', chest: 'छातीचा घेर', arm_length: 'बाहीची लांबी', arm_measurements: 'बाहीची जोड मापे', pants_length: 'पँटची लांबी', top_length: 'टॉपची लांबी', waist: 'कंबर', hip: 'नितंब', sleeve_length: 'बाहीची लांबी', sleeve_width: 'बाहीची रुंदी', front_neck: 'गळा पुढे', back_neck: 'गळा मागे', top_chest: 'टॉपचा छातीचा घेर', top_waist: 'टॉपची कंबर', top_hip: 'टॉपचा नितंब घेर', top_sleeve_length: 'टॉपच्या बाहीची लांबी', top_sleeve_width: 'टॉपच्या बाहीची रुंदी', top_arm_length: 'टॉपच्या बाहीची लांबी', top_front_neck: 'टॉपचा पुढचा गळा', top_back_neck: 'टॉपचा मागचा गळा', pants_waist: 'पँटची कंबर', pants_hip: 'पँटचा नितंब घेर', pants_thigh: 'मांडीचा घेर', pants_crotch: 'पँटची बैठक / उंची', pants_bottom: 'पँटच्या बॉटमची रुंदी', nine_vaari_front_length: 'पुढची लांबी', nine_vaari_back_length: 'मागची लांबी', nine_vaari_crotch_length: 'धोतर घडीची लांबी', nine_vaari_waist: 'कंबर', nine_vaari_hip: 'नितंब', nine_vaari_pleats: 'निऱ्यांची संख्या / रुंदी', nine_vaari_pallu: 'पदराची लांबी' },
};

function CalendarOrderCard({ order, customerName, t, language, onComplete, onReschedule }: {
  order: CustomerOrder; customerName: string; t: typeof copy.en; language: Language;
  onComplete: () => void; onReschedule: (date: string) => void;
}) {
  const [date, setDate] = useState(order.due_date || localDateString());
  const status = order.status === 'in_progress' ? t.orderInProgress : order.status === 'ready' ? t.orderReady : order.status === 'delivered' ? t.orderDelivered : order.status === 'cancelled' ? t.orderCancelled : t.orderNew;
  return <article className="calendar-order-card">
    <div className="calendar-order-top"><strong>{customerName || t.linkedCustomer}</strong><span>{order.order_number}</span></div>
    <p>{order.garment_type}{order.description ? ` · ${order.description}` : ''}</p>
    <div className="calendar-order-meta"><span className={`order-status ${order.status}`}>{status}</span><time>{formatDate(`${order.due_date}T12:00:00`, language)}</time></div>
    {order.status !== 'delivered' && order.status !== 'cancelled' && <div className="calendar-order-actions"><button className="complete-button" onClick={onComplete}><Check size={14} />{t.markComplete}</button><label className="calendar-reschedule"><span>{t.postponedTo}</span><input type="date" value={date} min={localDateString()} onChange={(event) => setDate(event.target.value)} /><button className="text-button" disabled={!date || date === order.due_date} onClick={() => onReschedule(date)}>{t.saveDate}</button></label></div>}
  </article>;
}

const categoryFields: Record<string, MeasurementField[]> = {
  blouse: ['height', 'blouse_back_length', 'chest', 'waist', 'arm_length', 'arm_measurements', 'front_neck', 'back_neck'],
  dress: ['top_length', 'top_chest', 'top_waist', 'top_hip', 'top_sleeve_length', 'top_sleeve_width', 'top_arm_length', 'top_front_neck', 'top_back_neck', 'pants_length', 'pants_waist', 'pants_hip', 'pants_thigh', 'pants_crotch', 'pants_bottom'],
  'nine-vaari': ['height', 'nine_vaari_front_length', 'nine_vaari_back_length', 'nine_vaari_crotch_length', 'nine_vaari_waist', 'nine_vaari_hip', 'nine_vaari_pleats', 'nine_vaari_pallu', 'blouse_back_length', 'chest', 'arm_length', 'arm_measurements', 'front_neck', 'back_neck'],
  other: [...measurementFields],
};

const measurementGroups: Record<string, MeasurementField[]> = {
  body: ['height', 'chest', 'waist', 'hip'],
  length: ['blouse_back_length', 'top_length', 'pants_length'],
  arms: ['arm_length', 'arm_measurements', 'sleeve_length', 'sleeve_width'],
  neck: ['front_neck', 'back_neck'],
  top: ['top_length', 'top_chest', 'top_waist', 'top_hip', 'top_sleeve_length', 'top_sleeve_width', 'top_arm_length', 'top_front_neck', 'top_back_neck'],
  pants: ['pants_length', 'pants_waist', 'pants_hip', 'pants_thigh', 'pants_crotch', 'pants_bottom'],
  sari: ['nine_vaari_front_length', 'nine_vaari_back_length', 'nine_vaari_crotch_length', 'nine_vaari_waist', 'nine_vaari_hip', 'nine_vaari_pleats', 'nine_vaari_pallu'],
};

const groupMeasurements = (fields: MeasurementField[]) => Object.entries(measurementGroups).map(([group, keys]) => ({
  group,
  fields: keys.filter((field) => fields.includes(field) && !((group === 'length') && (fields.includes('top_chest') || fields.includes('pants_waist')) && (field === 'top_length' || field === 'pants_length'))),
})).filter(({ fields: keys }) => keys.length > 0);

const normalizeSearch = (value: string) => value
  .normalize('NFKC')
  .replace(/[०-९]/g, (digit) => String('०१२३४५६७८९'.indexOf(digit)))
  .toLocaleLowerCase();

const garmentCategory = (value: string) => {
  const normalized = normalizeSearch(value.trim());
  if (['blouse', 'ब्लाउज', 'चोळी'].some((alias) => normalized.includes(alias)) || normalized.includes('ब्लाऊ')) return 'blouse';
  if (['dress', 'ड्रेस', 'पोशाख'].some((alias) => normalized.includes(alias))) return 'dress';
  if (['9 vaari', '9 वारी', '9वारी', 'nauvari', 'navvari', 'नऊवारी', 'नऊ वारी'].some((alias) => normalized.includes(alias))) return 'nine-vaari';
  return value.trim() ? 'other' : '';
};

const garmentLabel = (category: string, language: Language) => {
  const choices: Record<string, [string, string]> = { blouse: ['Blouse', 'ब्लाउज'], dress: ['Dress', 'ड्रेस'], 'nine-vaari': ['9 vaari', '९ वारी'] };
  return choices[category]?.[language === 'mr' ? 1 : 0] ?? '';
};

const garmentAliases = (value: string) => {
  const category = garmentCategory(value);
  const aliases: Record<string, string[]> = {
    blouse: ['Blouse', 'ब्लाउज', 'चोळी'],
    dress: ['Dress', 'ड्रेस', 'पोशाख'],
    'nine-vaari': ['9 vaari', '9वारी', '९ वारी', '९वारी', 'nauvari', 'नऊवारी'],
  };
  return [value, ...(aliases[category] ?? [])];
};

const formatDate = (value: string, language: Language) => new Intl.DateTimeFormat(language === 'mr' ? 'mr-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));

async function rotateImage(file: File, quarters: number): Promise<File> {
  if (!quarters) return file;
  const bitmap = await createImageBitmap(file);
  const swap = Math.abs(quarters) % 2 === 1;
  const canvas = document.createElement('canvas');
  canvas.width = swap ? bitmap.height : bitmap.width;
  canvas.height = swap ? bitmap.width : bitmap.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Image rotation is unavailable.');
  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate((quarters * Math.PI) / 2);
  context.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((result) => result ? resolve(result) : reject(new Error('Could not prepare image.')), file.type || 'image/jpeg', 0.92));
  return new File([blob], file.name, { type: file.type || 'image/jpeg' });
}

const fileToBase64 = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(new Error('Could not read this image.'));
  reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
  reader.readAsDataURL(file);
});

async function readJsonResponse(response: Response): Promise<{ error?: string; result?: ScanResult; customers?: ScanResult[] }> {
  const text = await response.text();
  let body: { error?: string; result?: ScanResult; customers?: ScanResult[] };
  try { body = JSON.parse(text); }
  catch {
    const statusHint = response.status === 404
      ? 'The scan function is not deployed yet. Wait for the Netlify deploy to finish and retry.'
      : response.status === 413
        ? 'This photo is too large for Netlify. Choose a smaller image.'
        : `The scan service returned a non-JSON error (HTTP ${response.status}). Check the Netlify function deploy and logs.`;
    throw new Error(statusHint);
  }
  if (!response.ok) throw new Error(body.error || `The scan service failed (HTTP ${response.status}).`);
  return body;
}

export default function App() {
  const [language, setLanguage] = useState<Language>(() => localStorage.getItem('sunny-language') === 'mr' ? 'mr' : 'en');
  const t = copy[language];
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CustomerDraft>(emptyDraft());
  const [garmentChoice, setGarmentChoice] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [formError, setFormError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [scanMessage, setScanMessage] = useState('');
  const [scanError, setScanError] = useState('');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [rotation, setRotation] = useState(0);
  const [batchOpen, setBatchOpen] = useState(false);
  const [batchPhotos, setBatchPhotos] = useState<File[]>([]);
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [batchStatus, setBatchStatus] = useState('');
  const [batchError, setBatchError] = useState('');
  const [designImage, setDesignImage] = useState('');
  const [designDirty, setDesignDirty] = useState(false);
  const [draftDesignDirty, setDraftDesignDirty] = useState(false);
  const [designSaving, setDesignSaving] = useState(false);
  const [designError, setDesignError] = useState('');
  const [designMessage, setDesignMessage] = useState('');
  const [designMode, setDesignMode] = useState<'pen' | 'eraser'>('pen');
  const [designColor, setDesignColor] = useState('#27253a');
  const [events, setEvents] = useState<CustomerEvent[]>([]);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [calendarOrders, setCalendarOrders] = useState<CustomerOrder[]>([]);
  const [calendarView, setCalendarView] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [calendarDate, setCalendarDate] = useState(() => localDateString());
  const [calendarError, setCalendarError] = useState('');
  const [orderPayments, setOrderPayments] = useState<CustomerOrderPayment[]>([]);
  const [historyError, setHistoryError] = useState('');
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentDraft, setPaymentDraft] = useState({ amount: '', date: new Date().toISOString().slice(0, 10), method: 'cash', stage: 'part', order_id: '', notes: '' });
  const [orderOpen, setOrderOpen] = useState(false);
  const [orderSaving, setOrderSaving] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [orderCustomerId, setOrderCustomerId] = useState('');
  const [orderCustomerQuery, setOrderCustomerQuery] = useState('');
  const [orderDraft, setOrderDraft] = useState({ garment_type: '', description: '', total_amount: '', advance_amount: '', advance_method: 'cash', due_date: '', status: 'new', notes: '' });
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const designCanvasRef = useRef<HTMLCanvasElement>(null);
  const formDesignCanvasRef = useRef<HTMLCanvasElement>(null);
  const designSectionRef = useRef<HTMLDivElement>(null);
  const drawingRef = useRef(false);
  const drawingHistoryRef = useRef<string[]>([]);
  const formDrawingHistoryRef = useRef<string[]>([]);
  const clearedDrawingRef = useRef(false);
  const formClearedDrawingRef = useRef(false);

  const loadCustomers = useCallback(async () => {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    setLoadError('');
    const { data, error } = await supabase.from('customers').select('id,name,phone,notes,garment_type,measurements,measurement_notes,measurement_date,design_image,created_at,updated_at').order('updated_at', { ascending: false });
    if (error) setLoadError(error.message || t.connectionError);
    else {
      setCustomers((data ?? []) as Customer[]);
      setSelected((current) => current && data?.some((row) => row.id === current) ? current : data?.[0]?.id ?? null);
    }
    setLoading(false);
  }, [t.connectionError]);

  useEffect(() => { void loadCustomers(); }, [loadCustomers]);
  useEffect(() => { document.documentElement.lang = language === 'mr' ? 'mr' : 'en'; localStorage.setItem('sunny-language', language); }, [language]);

  const filteredCustomers = useMemo(() => {
    const needle = normalizeSearch(query.trim());
    if (!needle) return customers;
    return customers.filter((customer) => {
      const values = [customer.name, customer.phone, customer.notes, ...garmentAliases(customer.garment_type), customer.measurement_notes, customer.measurement_date];
      for (const [key, value] of Object.entries(customer.measurements ?? {})) {
        values.push(value ?? '', labels.en[key as MeasurementField] ?? '', labels.mr[key as MeasurementField] ?? '');
      }
      return normalizeSearch(values.join(' ')).includes(needle);
    });
  }, [customers, query]);
  const activeCustomer = customers.find((customer) => customer.id === selected) ?? null;
  const visibleMeasurements = categoryFields[garmentChoice] ?? categoryFields.blouse;
  const groupedMeasurements = groupMeasurements(visibleMeasurements);
  const selectedCustomerFields = activeCustomer ? categoryFields[garmentCategory(activeCustomer.garment_type)] ?? [...measurementFields] : [...measurementFields];
  const customerGroupedMeasurements = groupMeasurements(selectedCustomerFields);
  const totalPaid = events.filter((item) => item.event_type === 'payment').reduce((total, item) => total + Number(item.amount || 0), 0);
  const formatMoney = (amount: number) => new Intl.NumberFormat(language === 'mr' ? 'mr-IN' : 'en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount);
  const orderPaid = (order: CustomerOrder) => Number(order.advance_amount || 0) + orderPayments.filter((payment) => payment.order_id === order.id).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const orderBalance = (order: CustomerOrder) => Math.max(0, Number(order.total_amount || 0) - orderPaid(order));
  const orderCustomerMatches = orderCustomerQuery.trim()
    ? customers.filter((customer) => normalizeSearch(`${customer.name} ${customer.phone}`).includes(normalizeSearch(orderCustomerQuery.trim())))
    : customers;
  const orderDraftTotal = Number(orderDraft.total_amount);
  const orderDraftAdvance = Number(orderDraft.advance_amount || 0);
  const orderDraftOtherPayments = orderPayments.filter((payment) => payment.order_id === editingOrderId).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const orderDraftBalance = Math.max(0, orderDraftTotal - orderDraftAdvance - orderDraftOtherPayments);
  const groupTitle = (group: string) => group === 'body' ? t.bodyGroup : group === 'length' ? t.lengthGroup : group === 'arms' ? t.armsGroup : group === 'neck' ? t.neckGroup : group === 'top' ? t.topGroup : group === 'pants' ? t.pantsGroup : t.sariGroup;

  useEffect(() => {
    if (!selected || !supabase) { setDesignImage(''); return; }
    let cancelled = false;
    setDesignImage(''); setDesignDirty(false); setDesignError(''); setDesignMessage('');
    drawingHistoryRef.current = []; clearedDrawingRef.current = false;
    void supabase.from('customers').select('design_image').eq('id', selected).single().then(({ data, error }) => {
      if (cancelled) return;
      if (error) setDesignError(error.message);
      else setDesignImage(data?.design_image ?? '');
    });
    return () => { cancelled = true; };
  }, [selected]);

  const loadCustomerEvents = useCallback(async (customerId: string) => {
    if (!supabase) return;
    const { data, error } = await supabase.from('customer_events').select('id,customer_id,event_type,title,amount,notes,details,created_at').eq('customer_id', customerId).order('created_at', { ascending: false });
    if (error) { setHistoryError(t.paymentError); setEvents([]); }
    else { setHistoryError(''); setEvents((data ?? []) as CustomerEvent[]); }
  }, [t.paymentError]);

  const loadCustomerOrders = useCallback(async (customerId: string) => {
    if (!supabase) return;
    const { data, error } = await supabase.from('customer_orders').select('*').eq('customer_id', customerId).order('created_at', { ascending: false });
    if (error) { setHistoryError(t.billError); setOrders([]); setOrderPayments([]); return; }
    const loadedOrders = (data ?? []) as CustomerOrder[];
    setOrders(loadedOrders);
    if (!loadedOrders.length) { setOrderPayments([]); return; }
    const { data: payments, error: paymentLoadError } = await supabase.from('customer_order_payments').select('*').in('order_id', loadedOrders.map((order) => order.id)).order('created_at', { ascending: false });
    if (paymentLoadError) { setHistoryError(t.billError); setOrderPayments([]); }
    else setOrderPayments((payments ?? []) as CustomerOrderPayment[]);
  }, [t.billError]);

  const loadCalendarOrders = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase.from('customer_orders').select('*').not('due_date', 'is', null).order('due_date', { ascending: true });
    if (!error) setCalendarOrders((data ?? []) as CustomerOrder[]);
    else setCalendarError(error.message || t.billError);
  }, [t.billError]);
  useEffect(() => { void loadCalendarOrders(); }, [loadCalendarOrders]);

  const updateCalendarOrder = async (order: CustomerOrder, updates: Partial<Pick<CustomerOrder, 'status' | 'due_date'>>) => {
    if (!supabase) return;
    const result = await supabase.from('customer_orders').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', order.id).select().single();
    if (result.error) { setCalendarError(result.error.message || t.billError); return; }
    setCalendarError('');
    await Promise.all([loadCalendarOrders(), loadCustomerOrders(order.customer_id)]);
  };

  useEffect(() => {
    setEvents([]); setOrders([]); setOrderPayments([]); setHistoryError('');
    if (selected) { void loadCustomerEvents(selected); void loadCustomerOrders(selected); }
  }, [selected, loadCustomerEvents, loadCustomerOrders]);

  useEffect(() => {
    const canvas = designCanvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (!designImage) return;
    const image = new Image();
    image.onload = () => { context.clearRect(0, 0, canvas.width, canvas.height); context.drawImage(image, 0, 0, canvas.width, canvas.height); };
    image.src = designImage;
  }, [designImage, activeCustomer?.id]);

  useEffect(() => {
    const canvas = formDesignCanvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (!draft.design_image) return;
    const image = new Image();
    image.onload = () => { context.clearRect(0, 0, canvas.width, canvas.height); context.drawImage(image, 0, 0, canvas.width, canvas.height); };
    image.src = draft.design_image;
  }, [formOpen, editingId, draft.design_image]);

  const canvasPoint = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * canvas.width / rect.width, y: (event.clientY - rect.top) * canvas.height / rect.height };
  };

  const startDrawing = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget;
    const point = canvasPoint(event);
    const context = canvas.getContext('2d');
    if (!context) return;
    const history = formOpen ? formDrawingHistoryRef.current : drawingHistoryRef.current;
    if (history.length >= 20) history.shift();
    history.push(canvas.toDataURL('image/webp', 0.65));
    drawingRef.current = true;
    clearedDrawingRef.current = false;
    canvas.setPointerCapture(event.pointerId);
    context.beginPath(); context.moveTo(point.x, point.y);
    context.lineCap = 'round'; context.lineJoin = 'round';
    if (formOpen) setDraftDesignDirty(true); else setDesignDirty(true);
    setDesignMessage(''); setDesignError('');
  };

  const continueDrawing = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const canvas = event.currentTarget;
    const context = canvas.getContext('2d');
    if (!context) return;
    const point = canvasPoint(event);
    context.globalCompositeOperation = designMode === 'eraser' ? 'destination-out' : 'source-over';
    context.strokeStyle = designColor;
    context.lineWidth = 7 * (canvas.width / canvas.getBoundingClientRect().width);
    context.lineTo(point.x, point.y); context.stroke();
  };

  const stopDrawing = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    drawingRef.current = false;
    const context = event.currentTarget.getContext('2d');
    if (context) context.globalCompositeOperation = 'source-over';
  };

  const clearDesign = () => {
    const canvas = formOpen ? formDesignCanvasRef.current : designCanvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const history = formOpen ? formDrawingHistoryRef.current : drawingHistoryRef.current;
    if (history.length >= 20) history.shift();
    history.push(canvas.toDataURL('image/webp', 0.65));
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (formOpen) { formClearedDrawingRef.current = true; setDraftDesignDirty(true); }
    else { clearedDrawingRef.current = true; setDesignDirty(true); }
    setDesignMessage(''); setDesignError('');
  };

  const undoDesign = () => {
    const canvas = formOpen ? formDesignCanvasRef.current : designCanvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const history = formOpen ? formDrawingHistoryRef.current : drawingHistoryRef.current;
    const previous = history.pop();
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (!previous) { if (formOpen) formClearedDrawingRef.current = true; else clearedDrawingRef.current = true; }
    else {
      const image = new Image();
      image.onload = () => { context.drawImage(image, 0, 0, canvas.width, canvas.height); };
      image.src = previous;
      if (formOpen) formClearedDrawingRef.current = false; else clearedDrawingRef.current = false;
    }
    if (formOpen) setDraftDesignDirty(true); else setDesignDirty(true);
    setDesignMessage(''); setDesignError('');
  };

  const saveDesign = async () => {
    const canvas = designCanvasRef.current;
    if (!supabase || !activeCustomer || !canvas || designSaving) return;
    setDesignSaving(true); setDesignError(''); setDesignMessage('');
    const image = clearedDrawingRef.current ? '' : canvas.toDataURL('image/webp', 0.82);
    const { error } = await supabase.from('customers').update({ design_image: image, updated_at: new Date().toISOString() }).eq('id', activeCustomer.id);
    if (error) setDesignError(error.message || t.drawingError);
    else {
      setDesignImage(image); setDesignDirty(false); setDesignMessage(t.drawingSaved); drawingHistoryRef.current = []; clearedDrawingRef.current = false;
      await supabase.from('customer_events').insert({ customer_id: activeCustomer.id, event_type: 'design_saved', title: t.designSavedEvent, amount: null, notes: '', details: {} });
      await loadCustomerEvents(activeCustomer.id);
    }
    setDesignSaving(false);
  };

  const startNew = () => {
    setEditingId(null); setDraft(emptyDraft()); setGarmentChoice(''); setFormError(''); setScanMessage(''); setScanError('');
    setScanResult(null); setPhoto(null); setRotation(0); setDraftDesignDirty(false); formClearedDrawingRef.current = false; formDrawingHistoryRef.current = []; setFormOpen(true);
  };

  const startEdit = (customer: Customer) => {
    setEditingId(customer.id);
    setDraft({ name: customer.name, phone: customer.phone ?? '', notes: customer.notes ?? '', garment_type: customer.garment_type ?? '', measurements: customer.measurements ?? {}, measurement_notes: customer.measurement_notes ?? '', measurement_date: customer.measurement_date ?? '', design_image: customer.design_image ?? '' });
    setGarmentChoice(garmentCategory(customer.garment_type));
    setFormError(''); setScanMessage(''); setScanError(''); setScanResult(null); setPhoto(null); setRotation(0); setDraftDesignDirty(false); formClearedDrawingRef.current = false; formDrawingHistoryRef.current = []; setFormOpen(true);
  };

  const updateMeasurement = (key: MeasurementField, value: string) => setDraft((current) => ({ ...current, measurements: { ...current.measurements, [key]: value } }));

  const selectPhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = '';
    setScanError(''); setScanMessage(''); setScanResult(null); setRotation(0);
    if (file && !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setScanError(language === 'mr' ? 'कृपया JPG, PNG किंवा WebP फोटो निवडा.' : 'Choose a JPG, PNG, or WebP image.'); return; }
    if (file && file.size > 4 * 1024 * 1024) { setScanError(language === 'mr' ? 'फोटो ४ MB पेक्षा लहान निवडा.' : 'Choose an image smaller than 4 MB.'); return; }
    setPhoto(file);
  };

  const scanPhoto = async () => {
    if (!photo) { setScanError(t.scanError); return; }
    setScanning(true); setScanError(''); setScanMessage(''); setScanResult(null);
    try {
      const prepared = await rotateImage(photo, rotation);
      const image = await fileToBase64(prepared);
      const response = await fetch('/api/scan-measurements', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mimeType: prepared.type || 'image/jpeg', image, language }),
      });
      const body = await readJsonResponse(response);
      if (response.status === 503) throw new Error(t.scanNeedKey);
      const result = body.result as ScanResult;
      setScanResult(result);
      const scannedGarmentChoice = result.garment_type?.value ? garmentCategory(result.garment_type.value) : '';
      if (scannedGarmentChoice) setGarmentChoice(scannedGarmentChoice);
      setDraft((current) => ({
        ...current,
        name: result.name?.value || current.name,
        phone: result.phone?.value || current.phone,
        notes: result.notes?.value || current.notes,
        garment_type: result.garment_type?.value ? garmentLabel(scannedGarmentChoice, language) || result.garment_type.value : current.garment_type,
        measurement_notes: result.measurement_notes?.value || current.measurement_notes,
        measurement_date: result.measurement_date?.value || current.measurement_date,
        measurements: Object.fromEntries(measurementFields.map((field) => [field, result.measurements?.[field]?.value || current.measurements[field] || ''])) as CustomerDraft['measurements'],
      }));
      setScanMessage(t.scanApplied);
    } catch (error) {
      setScanError(error instanceof Error ? error.message : t.scanError);
    } finally { setScanning(false); }
  };

  const selectBatchPhotos = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    setBatchError(''); setBatchStatus(''); setBatchProgress(0);
    if (files.some((file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type))) {
      setBatchError(language === 'mr' ? 'JPG, PNG किंवा WebP फोटोच निवडा.' : 'Choose JPG, PNG, or WebP images.'); return;
    }
    if (files.some((file) => file.size > 4 * 1024 * 1024)) { setBatchError(t.batchSize); return; }
    setBatchPhotos(files);
  };

  const saveBatchPhotos = async () => {
    if (!supabase || !batchPhotos.length || batchRunning) return;
    setBatchRunning(true); setBatchProgress(0); setBatchError(''); setBatchStatus('');
    let saved = 0; let skipped = 0; const errors: string[] = [];
    try {
      for (let photoIndex = 0; photoIndex < batchPhotos.length; photoIndex += 1) {
        const photo = batchPhotos[photoIndex];
        try {
          const image = await fileToBase64(photo);
          const response = await fetch('/api/scan-batch-measurements', {
            method: 'POST', headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ mimeType: photo.type || 'image/jpeg', image, language }),
          });
          const body = await readJsonResponse(response);
          const entries = body.customers ?? [];
          if (!entries.length) { errors.push(`${photo.name}: ${t.batchEmpty}`); }
          else {
            const digest = await crypto.subtle.digest('SHA-256', await photo.arrayBuffer());
            const imageKey = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
            const payload = entries.flatMap((entry, entryIndex) => {
              const measurements = Object.fromEntries(measurementFields.map((field) => [field, entry.measurements?.[field]?.value?.trim() || '']).filter(([, value]) => value)) as CustomerDraft['measurements'];
              const hasContent = Object.keys(measurements).length > 0 || Boolean(entry.notes?.value?.trim() || entry.measurement_notes?.value?.trim() || entry.phone?.value?.trim());
              if (!hasContent) return [];
              const recognizedName = entry.name?.value?.trim() || '';
              return [{
                name: recognizedName || `${t.batchNameFallback} (${photoIndex + 1}-${entryIndex + 1})`,
                phone: entry.phone?.value?.trim() || '', notes: entry.notes?.value?.trim() || '',
                garment_type: entry.garment_type?.value?.trim() || '', measurements,
                measurement_notes: entry.measurement_notes?.value?.trim() || '',
                measurement_date: entry.measurement_date?.value?.trim() || '',
                import_key: `${imageKey}:${entryIndex}`, updated_at: new Date().toISOString(),
              }];
            });
            if (!payload.length) errors.push(`${photo.name}: ${t.batchEmpty}`);
            else {
              const result = await supabase.from('customers').upsert(payload, { onConflict: 'import_key', ignoreDuplicates: true }).select('id');
              if (result.error) throw new Error(result.error.message || t.saveError);
              saved += result.data?.length ?? 0;
              skipped += payload.length - (result.data?.length ?? 0);
            }
          }
        } catch (error) { errors.push(`${photo.name}: ${error instanceof Error ? error.message : t.batchError}`); }
        setBatchProgress(photoIndex + 1);
      }
      await loadCustomers();
      const summary = `${t.batchDone}: ${saved} ${language === 'mr' ? 'नवीन नोंदी' : 'new records'}${skipped ? `, ${skipped} ${language === 'mr' ? 'आधीच जतन' : 'already saved'}` : ''}. ${t.batchProgress}: ${batchPhotos.length}/${batchPhotos.length}.`;
      setBatchStatus(summary);
      setBatchError(errors.join('\n'));
    } finally { setBatchRunning(false); }
  };

  const saveCustomer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.name.trim()) { setFormError(t.required); return; }
    if (!supabase) return;
    setSaving(true); setFormError('');
    const image = formDesignCanvasRef.current;
    const customerDesign = draftDesignDirty ? (formClearedDrawingRef.current ? '' : image?.toDataURL('image/webp', 0.82) ?? draft.design_image) : draft.design_image;
    const payload = { ...draft, design_image: customerDesign, name: draft.name.trim(), phone: draft.phone.trim(), updated_at: new Date().toISOString() };
    const result = editingId
      ? await supabase.from('customers').update(payload).eq('id', editingId).select().single()
      : await supabase.from('customers').insert(payload).select().single();
    if (result.error) { setFormError(result.error.message || t.saveError); setSaving(false); return; }
    const eventResult = await supabase.from('customer_events').insert({
      customer_id: result.data.id,
      event_type: editingId ? 'measurement_updated' : 'measurement_created',
      title: editingId ? t.measurementUpdated : t.measurementAdded,
      amount: null,
      notes: payload.measurement_notes || '',
      details: { garment_type: payload.garment_type, measurements: payload.measurements, measurement_date: payload.measurement_date, design_saved: draftDesignDirty },
    });
    if (eventResult.error) setHistoryError(eventResult.error.message);
    await loadCustomers();
    setSelected(result.data.id); setDraft((current) => ({ ...current, design_image: customerDesign ?? '' })); setDesignImage(customerDesign ?? ''); setDraftDesignDirty(false); formClearedDrawingRef.current = false; formDrawingHistoryRef.current = []; await loadCustomerEvents(result.data.id); setSaving(false); setFormOpen(false);
  };

  const savePayment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(paymentDraft.amount);
    if (!activeCustomer || !supabase || !Number.isFinite(amount) || amount <= 0) { setPaymentError(t.amountRequired); return; }
    const linkedOrder = orders.find((order) => order.id === paymentDraft.order_id);
    if (linkedOrder && amount > orderBalance(linkedOrder) + 0.001) { setPaymentError(`${t.paymentExceedsDue} ${t.due}: ${formatMoney(orderBalance(linkedOrder))}`); return; }
    setPaymentSaving(true); setPaymentError('');
    if (linkedOrder) {
      const paymentResult = await supabase.from('customer_order_payments').insert({
        order_id: linkedOrder.id, amount, method: paymentDraft.method, stage: paymentDraft.stage,
        notes: paymentDraft.notes.trim(), payment_date: paymentDraft.date,
      });
      if (paymentResult.error) { setPaymentError(paymentResult.error.message || t.paymentError); setPaymentSaving(false); return; }
    }
    const { error } = await supabase.from('customer_events').insert({
      customer_id: activeCustomer.id, event_type: 'payment', title: t.paymentEvent,
      amount, notes: paymentDraft.notes.trim(), details: { method: paymentDraft.method, payment_date: paymentDraft.date, payment_stage: paymentDraft.stage, order_id: linkedOrder?.id ?? '', order_number: linkedOrder?.order_number ?? '' },
      created_at: paymentDraft.date ? new Date(`${paymentDraft.date}T12:00:00`).toISOString() : new Date().toISOString(),
    });
    if (error) setHistoryError(t.paymentError);
    await Promise.all([loadCustomerEvents(activeCustomer.id), loadCustomerOrders(activeCustomer.id)]);
    setPaymentDraft({ amount: '', date: new Date().toISOString().slice(0, 10), method: 'cash', stage: 'part', order_id: '', notes: '' });
    setPaymentSaving(false); setPaymentOpen(false);
  };

  const startNewOrder = (customerId = activeCustomer?.id ?? '') => {
    const customer = customers.find((item) => item.id === customerId);
    setEditingOrderId(null); setOrderError(''); setOrderCustomerId(customer?.id ?? '');
    setOrderCustomerQuery(customer ? `${customer.name}${customer.phone ? ` · ${customer.phone}` : ''}` : '');
    setOrderDraft({ garment_type: customer?.garment_type ?? '', description: '', total_amount: '', advance_amount: '', advance_method: 'cash', due_date: '', status: 'new', notes: '' });
    setOrderOpen(true);
  };

  const startEditOrder = (order: CustomerOrder) => {
    const customer = customers.find((item) => item.id === order.customer_id);
    setEditingOrderId(order.id); setOrderError(''); setOrderCustomerId(order.customer_id);
    setOrderCustomerQuery(customer ? `${customer.name}${customer.phone ? ` · ${customer.phone}` : ''}` : '');
    setOrderDraft({ garment_type: order.garment_type, description: order.description, total_amount: String(order.total_amount), advance_amount: String(order.advance_amount), advance_method: order.advance_method, due_date: order.due_date, status: order.status, notes: order.notes });
    setOrderOpen(true);
  };

  const saveOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase || !orderCustomerId) { setOrderError(t.chooseCustomer); return; }
    const customer = customers.find((item) => item.id === orderCustomerId);
    const total = Number(orderDraft.total_amount);
    const advance = Number(orderDraft.advance_amount || 0);
    if (!customer || !Number.isFinite(total) || total <= 0 || !Number.isFinite(advance) || advance < 0 || advance > total) { setOrderError(t.amountRequired); return; }
    const existing = orders.find((item) => item.id === editingOrderId);
    if (existing && total < orderPaid(existing) - Number(existing.advance_amount || 0) + advance) { setOrderError(`${t.due}: ${formatMoney(orderPaid(existing))}`); return; }
    setOrderSaving(true); setOrderError('');
    const orderNumber = existing?.order_number ?? `ST-${Date.now().toString().slice(-8)}`;
    const payload = {
      customer_id: customer.id, order_number: orderNumber, garment_type: orderDraft.garment_type.trim(),
      description: orderDraft.description.trim(), total_amount: total, advance_amount: advance,
      advance_method: orderDraft.advance_method, due_date: orderDraft.due_date, status: orderDraft.status,
      notes: orderDraft.notes.trim(), measurements: customer.measurements ?? {}, measurement_date: customer.measurement_date ?? '',
      updated_at: new Date().toISOString(),
    };
    const result = existing
      ? await supabase.from('customer_orders').update(payload).eq('id', existing.id).select().single()
      : await supabase.from('customer_orders').insert(payload).select().single();
    if (result.error) { setOrderError(result.error.message || t.billError); setOrderSaving(false); return; }
    const eventType = existing ? 'order_updated' : 'order_created';
    const eventResult = await supabase.from('customer_events').insert({
      customer_id: customer.id, event_type: eventType,
      title: `${existing ? t.editBill : t.addBill} · ${orderNumber}`, amount: total,
      notes: payload.notes,
      details: { order_id: result.data.id, order_number: orderNumber, garment_type: payload.garment_type, total_amount: total, advance_amount: advance, measurements: payload.measurements, due_date: payload.due_date, status: payload.status },
    });
    if (!existing && advance > 0) {
      await supabase.from('customer_events').insert({ customer_id: customer.id, event_type: 'payment', title: t.paymentEvent, amount: advance, notes: '', details: { method: payload.advance_method, payment_stage: 'advance', payment_date: new Date().toISOString().slice(0, 10), order_id: result.data.id, order_number: orderNumber } });
    }
    if (eventResult.error) setHistoryError(t.billError);
    setSelected(customer.id);
    await Promise.all([loadCustomerEvents(customer.id), loadCustomerOrders(customer.id), loadCustomers()]);
    await loadCalendarOrders();
    setOrderSaving(false); setOrderOpen(false);
  };

  const openPayment = (order?: CustomerOrder) => {
    const due = order ? orderBalance(order) : 0;
    setPaymentError('');
    setPaymentDraft({ amount: order && due > 0 ? due.toFixed(2) : '', date: new Date().toISOString().slice(0, 10), method: 'cash', stage: order ? (due > 0 ? 'final' : 'part') : 'advance', order_id: order?.id ?? '', notes: '' });
    setPaymentOpen(true);
  };

  const deleteCustomer = async () => {
    if (!activeCustomer || !supabase || !window.confirm(t.deleteConfirm)) return;
    const { error } = await supabase.from('customers').delete().eq('id', activeCustomer.id);
    if (error) { setLoadError(error.message); return; }
    setSelected(null);
    await loadCustomers();
  };

  const formatConfidence = (value?: number) => value === undefined ? '' : `${Math.round(value * 100)}%`;
  const previewSrc = useMemo(() => photo ? URL.createObjectURL(photo) : '', [photo]);
  const todayKey = localDateString();
  const monthStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
  const calendarCells = Array.from({ length: Math.ceil((monthStart.getDay() + new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate()) / 7) * 7 }, (_, index) => {
    const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), index - monthStart.getDay() + 1);
    return { date, key: localDateString(date), inMonth: date.getMonth() === calendarMonth.getMonth() };
  });
  const deliveryOrdersOn = (date: string) => calendarOrders.filter((order) => order.due_date === date && order.status !== 'delivered' && order.status !== 'cancelled');
  const selectedDayOrders = calendarOrders.filter((order) => order.due_date === calendarDate);
  const customerForOrder = (order: CustomerOrder) => customers.find((customer) => customer.id === order.customer_id);
  useEffect(() => () => { if (previewSrc) URL.revokeObjectURL(previewSrc); }, [previewSrc]);

  return (
    <div className="app-shell" data-language={language}>
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark"><Scissors size={22} strokeWidth={2.2} /></div>
          <div><div className="brand-name">Sunny Tailor</div><div className="brand-subtitle">{t.subtitle}</div></div>
        </div>
        <div className="top-actions">
          <div className="public-badge"><span className="status-dot" />{t.localData}</div>
          <button className={`language-toggle calendar-toggle ${calendarView ? 'active' : ''}`} onClick={() => setCalendarView((value) => !value)} title={t.calendar} aria-label={t.calendar}><CalendarDays size={16} /><span>{t.calendar}</span></button>
          <button className="language-toggle" onClick={() => setLanguage(language === 'en' ? 'mr' : 'en')} title="Change language" aria-label="Change language">
            <Languages size={16} /><span>{language === 'en' ? 'मराठी' : 'English'}</span>
          </button>
        </div>
      </header>

      <main className="workspace">
        <section className="page-heading">
          <div>
            <p className="eyebrow">SUNNY TAILOR · {t.subtitle.toLocaleUpperCase(language === 'mr' ? 'mr-IN' : 'en-IN')}</p>
            <h1>{calendarView ? t.calendar : t.records}</h1>
            <p className="heading-copy">{calendarView ? `${calendarOrders.length} ${t.order.toLocaleLowerCase(language === 'mr' ? 'mr-IN' : 'en-IN')}` : `${customers.length} ${t.customers}`}</p>
          </div>
          <div className="heading-actions">{calendarView ? <><button className="secondary-button" onClick={() => { setCalendarDate(todayKey); setCalendarMonth(new Date()); }}>{t.todayWork}</button><button className="primary-button" onClick={() => startNewOrder('')}><Plus size={17} />{t.addBill}</button></> : <><button className="secondary-button" onClick={() => { setBatchOpen(true); setBatchPhotos([]); setBatchError(''); setBatchStatus(''); setBatchProgress(0); }}><FileStack size={17} />{t.batch}</button><button className="secondary-button" onClick={() => startNewOrder('')}><Plus size={16} />{t.addBill}</button><button className="primary-button" onClick={startNew}><Plus size={18} />{t.add}</button></>}</div>
        </section>

        {!isSupabaseConfigured ? (
          <section className="notice-card setup-card"><div className="notice-icon"><CircleHelp size={22} /></div><div><h2>{t.setupTitle}</h2><p>{t.setupBody}</p></div></section>
        ) : null}
        {loadError ? <section className="notice-card error-card"><AlertCircle size={19} /><div><strong>{t.connectionError}</strong><p>{loadError}</p><button className="text-button" onClick={() => void loadCustomers()}>{language === 'mr' ? 'पुन्हा प्रयत्न करा' : 'Try again'}</button></div></section> : null}

        {calendarView ? <section className="calendar-layout">
          <div className="calendar-panel panel">
            <div className="calendar-toolbar"><button className="icon-button" aria-label={t.monthPrev} onClick={() => setCalendarMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft size={18} /></button><h2>{new Intl.DateTimeFormat(language === 'mr' ? 'mr-IN' : 'en-IN', { month: 'long', year: 'numeric' }).format(calendarMonth)}</h2><button className="icon-button" aria-label={t.monthNext} onClick={() => setCalendarMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight size={18} /></button></div>
            <div className="calendar-grid">{Array.from({ length: 7 }, (_, index) => <div className="calendar-weekday" key={`weekday-${index}`}>{new Intl.DateTimeFormat(language === 'mr' ? 'mr-IN' : 'en-IN', { weekday: 'short' }).format(new Date(2024, 0, 7 + index))}</div>)}
              {calendarCells.map(({ date, key, inMonth }) => { const count = deliveryOrdersOn(key).length; return <button key={key} className={`calendar-day ${inMonth ? '' : 'outside'} ${calendarDate === key ? 'chosen' : ''} ${key === todayKey ? 'today' : ''}`} onClick={() => setCalendarDate(key)}><span>{new Intl.DateTimeFormat(language === 'mr' ? 'mr-IN' : 'en-IN', { day: 'numeric' }).format(date)}</span>{count > 0 && <small>{count}</small>}</button>; })}
            </div>
            <div className="calendar-legend"><span><i />{t.dueDate}</span><small>{calendarOrders.filter((order) => order.due_date).length} {t.order.toLocaleLowerCase(language === 'mr' ? 'mr-IN' : 'en-IN')}</small></div>
          </div>
          <aside className="calendar-work panel">{calendarError && <p className="inline-error history-error"><AlertCircle size={15} />{calendarError}</p>}
            <section className="calendar-work-section"><h2>{t.todayWork}</h2><p className="calendar-date-heading">{formatDate(`${todayKey}T12:00:00`, language)}</p>{deliveryOrdersOn(todayKey).length ? <div className="calendar-order-list">{deliveryOrdersOn(todayKey).map((order) => <CalendarOrderCard key={order.id} order={order} customerName={customerForOrder(order)?.name || ''} t={t} language={language} onComplete={() => void updateCalendarOrder(order, { status: 'delivered' })} onReschedule={(date) => void updateCalendarOrder(order, { due_date: date })} />)}</div> : <p className="calendar-empty">{t.noWork}</p>}</section>
            {calendarDate !== todayKey && <section className="calendar-work-section selected-work"><h3>{formatDate(`${calendarDate}T12:00:00`, language)}</h3>{selectedDayOrders.length ? <div className="calendar-order-list">{selectedDayOrders.map((order) => <CalendarOrderCard key={order.id} order={order} customerName={customerForOrder(order)?.name || ''} t={t} language={language} onComplete={() => void updateCalendarOrder(order, { status: 'delivered' })} onReschedule={(date) => void updateCalendarOrder(order, { due_date: date })} />)}</div> : <p className="calendar-empty">{t.noWork}</p>}</section>}
          </aside>
        </section> : <div className="content-grid">
          <section className="list-panel panel">
            <div className="list-toolbar">
              <div className="search-wrap"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.search} aria-label={t.search} /></div>
              <span className="result-count">{filteredCustomers.length} {t.searchCount}</span>
            </div>
            {loading ? <div className="loading-state"><LoaderCircle className="spin" size={22} />{language === 'mr' ? 'नोंदी उघडत आहेत…' : 'Loading customer records…'}</div> : filteredCustomers.length === 0 ? (
              <div className="empty-state"><div className="empty-icon"><Users size={26} /></div><h2>{query ? t.noResults : t.noCustomers}</h2><p>{query ? t.noResultsHelp : t.noCustomersHelp}</p>{!query && <button className="primary-button" onClick={startNew}><Plus size={17} />{t.addFirst}</button>}</div>
            ) : (
              <div className="customer-list">{filteredCustomers.map((customer) => {
                const measurementCount = Object.values(customer.measurements ?? {}).filter(Boolean).length;
                return <button key={customer.id} className={`customer-row ${selected === customer.id ? 'selected' : ''}`} onClick={() => setSelected(customer.id)}>
                  <div className="avatar"><UserRound size={19} /></div>
                  <div className="customer-main"><div className="customer-name">{customer.name}</div><div className="customer-meta">{customer.phone || customer.garment_type || t.updated}</div></div>
                  <div className="customer-side"><span className="measurement-count">{measurementCount} {language === 'mr' ? 'मापे' : 'measures'}</span><span className="customer-date">{formatDate(customer.updated_at, language)}</span></div>
                  <ChevronRight className="row-chevron" size={17} />
                </button>;
              })}</div>
            )}
          </section>

          <aside className="detail-panel panel">
            {activeCustomer ? <>
              <div className="detail-head"><div className="detail-avatar"><UserRound size={23} /></div><div className="detail-title"><h2>{activeCustomer.name}</h2><p>{activeCustomer.phone || activeCustomer.garment_type || t.subtitle}</p></div><button className="icon-button" onClick={() => designSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })} aria-label={t.designPad} title={t.designPad}><Brush size={17} /></button><button className="icon-button" onClick={() => startEdit(activeCustomer)} aria-label={t.editCustomer} title={t.editCustomer}><Pencil size={17} /></button></div>
              <div className="detail-scroll">
                <div className="detail-section"><div className="section-heading"><h3>{t.basic}</h3><span className="small-muted">{t.updated} {formatDate(activeCustomer.updated_at, language)}</span></div>
                  <dl className="info-list">{activeCustomer.measurement_date && <div><dt>{t.date}</dt><dd dir="auto">{formatDate(`${activeCustomer.measurement_date}T12:00:00`, language)}</dd></div>}{activeCustomer.phone && <div><dt>{t.phone}</dt><dd dir="auto">{activeCustomer.phone}</dd></div>}{activeCustomer.garment_type && <div><dt>{t.garment}</dt><dd dir="auto">{activeCustomer.garment_type}</dd></div>}{activeCustomer.notes && <div className="notes-row"><dt>{t.notes}</dt><dd dir="auto">{activeCustomer.notes}</dd></div>}</dl>
                </div>
                <div className="detail-section"><div className="section-heading"><h3>{t.measurements}</h3><span className="measurement-pill">{Object.values(activeCustomer.measurements ?? {}).filter(Boolean).length}</span></div>
                  {Object.values(activeCustomer.measurements ?? {}).some(Boolean) ? customerGroupedMeasurements.map(({ group, fields }) => {
                    const title = groupTitle(group);
                    const saved = fields.filter((field) => activeCustomer.measurements?.[field]);
                    return saved.length ? <div className="measurement-category-group" key={group}><h4>{title}</h4><div className="measure-grid">{saved.map((field) => <div className="measure-cell" key={field}><span>{labels[language][field]}</span><strong dir="auto">{activeCustomer.measurements[field]}</strong></div>)}</div></div> : null;
                  }) : <p className="muted-copy">{t.emptyMeasure}</p>}
                  {activeCustomer.measurement_notes && <div className="measure-notes"><span>{t.measureNotes}</span><p dir="auto">{activeCustomer.measurement_notes}</p></div>}
                </div>
                <div className="detail-section"><div className="section-heading"><h3>{t.bills}</h3><button className="secondary-button payment-add" onClick={() => startNewOrder(activeCustomer.id)}><Plus size={15} />{t.addBill}</button></div>
                  {orders.length === 0 ? <p className="muted-copy">{t.noBills}</p> : <div className="orders-list">{orders.map((order) => {
                    const paid = orderPaid(order);
                    const due = orderBalance(order);
                    const statusText = order.status === 'in_progress' ? t.orderInProgress : order.status === 'ready' ? t.orderReady : order.status === 'delivered' ? t.orderDelivered : order.status === 'cancelled' ? t.orderCancelled : t.orderNew;
                    const extraPayments = orderPayments.filter((payment) => payment.order_id === order.id);
                    return <article className="order-card" key={order.id}><div className="order-card-head"><div><strong>{order.order_number}</strong><span className={`order-status ${order.status}`}>{statusText}</span></div><button className="icon-button order-edit" onClick={() => startEditOrder(order)} aria-label={t.editBill} title={t.editBill}><Pencil size={15} /></button></div>
                      <h4 dir="auto">{order.garment_type || t.billGarment}{order.description ? ` · ${order.description}` : ''}</h4>
                      <div className="order-money-grid"><span>{t.totalBill}<b>{formatMoney(Number(order.total_amount))}</b></span><span>{t.paidSoFar}<b>{formatMoney(paid)}</b></span><span>{t.due}<b className={due > 0 ? 'due-amount' : 'paid-amount'}>{formatMoney(due)}</b></span></div>
                      {order.due_date && <p className="order-delivery">{t.dueDate}: {formatDate(`${order.due_date}T12:00:00`, language)}</p>}
                      <p className="order-measure-count">{t.attachedMeasurements} {Object.values(order.measurements ?? {}).filter(Boolean).length}</p>
                      {extraPayments.length > 0 && <div className="order-payment-list">{extraPayments.map((payment) => <span key={payment.id}>{formatMoney(Number(payment.amount))} · {payment.method === 'upi' ? 'UPI' : payment.method === 'cash' ? t.cash : t.otherMethod} · {formatDate(`${payment.payment_date || payment.created_at.slice(0, 10)}T12:00:00`, language)}</span>)}</div>}
                      <div className="order-actions">{due > 0 && <button className="secondary-button payment-add" onClick={() => openPayment(order)}><Plus size={14} />{t.remainingPayment}</button>}<button className="text-button" onClick={() => startEditOrder(order)}>{t.editBill}</button></div>
                    </article>;
                  })}</div>}
                </div>
                <div className="detail-section">
                  <div className="section-heading"><div><h3>{t.history}</h3>{totalPaid > 0 && <p className="history-total">{t.totalPaid}: {formatMoney(totalPaid)}</p>}</div><button className="secondary-button payment-add" onClick={() => openPayment()}><Plus size={15} />{t.payment}</button></div>
                  {historyError ? <p className="inline-error history-error"><AlertCircle size={15} />{historyError}</p> : events.length === 0 ? <p className="muted-copy">{t.noHistory}</p> : <ol className="history-list">{events.map((item) => {
                    const isPayment = item.event_type === 'payment';
                    const isOrder = item.event_type === 'order_created' || item.event_type === 'order_updated';
                    const title = isPayment ? t.paymentEvent : item.event_type === 'measurement_created' ? t.measurementAdded : item.event_type === 'measurement_updated' ? t.measurementUpdated : item.event_type === 'design_saved' ? t.designSavedEvent : item.event_type === 'order_updated' ? t.editBill : t.addBill;
                    const method = typeof item.details?.method === 'string' ? item.details.method : '';
                    const orderNumber = typeof item.details?.order_number === 'string' ? item.details.order_number : '';
                    const stage = typeof item.details?.payment_stage === 'string' ? item.details.payment_stage : '';
                    return <li className="history-item" key={item.id}><span className={`history-dot ${isPayment ? 'paid' : ''}`} /><div className="history-content"><div className="history-title"><strong>{title}{isOrder && orderNumber ? ` · ${orderNumber}` : ''}</strong>{(isPayment || isOrder) && <b>{formatMoney(Number(isPayment ? item.amount || 0 : item.details?.total_amount ?? item.amount ?? 0))}</b>}</div><time>{formatDate(item.created_at, language)}{method && ` · ${method === 'cash' ? t.cash : method === 'upi' ? 'UPI' : t.otherMethod}`}{stage && ` · ${stage === 'advance' ? t.advanceStage : stage === 'final' ? t.finalPaymentStage : t.partPaymentStage}`}{isOrder && typeof item.details?.garment_type === 'string' && item.details.garment_type ? ` · ${item.details.garment_type}` : ''}</time>{item.notes && <p dir="auto">{item.notes}</p>}</div></li>;
                  })}</ol>}
                </div>
                <div className="detail-section design-section" ref={designSectionRef}>
                  <div className="section-heading"><div><h3>{t.designPad}</h3><p className="design-hint">{t.designPadHint}</p></div><Brush size={17} /></div>
                  <div className="drawing-toolbar">
                    <button className={`draw-tool ${designMode === 'pen' ? 'active' : ''}`} onClick={() => setDesignMode('pen')} title={t.pen}><Pencil size={15} />{t.pen}</button>
                    <button className={`draw-tool ${designMode === 'eraser' ? 'active' : ''}`} onClick={() => setDesignMode('eraser')} title={t.eraser}><Eraser size={15} />{t.eraser}</button>
                    <button className="draw-icon-tool" onClick={undoDesign} disabled={drawingHistoryRef.current.length === 0} title={t.undo} aria-label={t.undo}><RotateCcw size={15} /></button>
                    <button className="draw-icon-tool" onClick={clearDesign} title={t.clearDrawing}>{language === 'mr' ? 'पुसा' : 'Clear'}</button>
                    <label className="draw-color" title={t.drawingColor}><span>{t.drawingColor}</span><input type="color" value={designColor} onChange={(event) => setDesignColor(event.target.value)} aria-label={t.drawingColor} /></label>
                  </div>
                  <canvas ref={designCanvasRef} className="design-canvas" width={1000} height={500} onPointerDown={startDrawing} onPointerMove={continueDrawing} onPointerUp={stopDrawing} onPointerCancel={stopDrawing} aria-label={t.designPad} />
                  {designError && <p className="inline-error design-message"><AlertCircle size={15} />{designError}</p>}
                  {designMessage && <p className="inline-success design-message"><Check size={15} />{designMessage}</p>}
                  <div className="design-save-row"><span>{designDirty ? (language === 'mr' ? 'जतन न केलेले बदल' : 'Unsaved changes') : ''}</span><button className="secondary-button" onClick={() => void saveDesign()} disabled={!designDirty || designSaving}>{designSaving ? <LoaderCircle className="spin" size={15} /> : <Save size={15} />}{designSaving ? t.savingDrawing : t.saveDrawing}</button></div>
                </div>
                <div className="detail-footer"><button className="danger-button" onClick={() => void deleteCustomer()}><Trash2 size={16} />{t.delete}</button><span><Clock3 size={14} />{formatDate(activeCustomer.created_at, language)}</span></div>
              </div>
            </> : <div className="detail-placeholder"><div className="placeholder-icon"><Scissors size={24} /></div><h2>{language === 'mr' ? 'ग्राहक निवडा' : 'Choose a customer'}</h2><p>{language === 'mr' ? 'संपर्क आणि मापे पाहण्यासाठी यादीतील नोंद निवडा.' : 'Select a record to view contact details and measurements.'}</p></div>}
          </aside>
        </div>}
        <footer className="page-footer"><span>Sunny Tailor · {language === 'mr' ? 'ग्राहक आणि मापे' : 'Customer & measurement book'}</span><span><span className="status-dot" />{t.localData}</span></footer>
      </main>

      {batchOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !batchRunning) setBatchOpen(false); }}>
        <section className="batch-modal" role="dialog" aria-modal="true" aria-labelledby="batch-title">
          <header className="modal-head"><div><p className="eyebrow">SUNNY TAILOR · AI</p><h2 id="batch-title">{t.batchTitle}</h2></div><button className="icon-button" onClick={() => setBatchOpen(false)} disabled={batchRunning} aria-label={t.cancel}><X size={19} /></button></header>
          <div className="batch-body"><p className="batch-hint">{t.batchHint}</p>
            <label className="batch-drop"><FileStack size={25} /><strong>{t.batchChoose}</strong><span>{language === 'mr' ? 'JPG, PNG, WebP · एका पानाचा एक फोटो · ४ MB पर्यंत' : 'JPG, PNG, WebP · one page per photo · up to 4 MB each'}</span><input className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={selectBatchPhotos} /></label>
            {batchPhotos.length > 0 && <div className="batch-file-list">{batchPhotos.map((file, index) => <div className="batch-file" key={`${file.name}-${index}`}><Check size={15} /><span>{file.name}</span><small>{(file.size / 1024 / 1024).toFixed(1)} MB</small></div>)}</div>}
            {batchRunning && <div className="batch-progress"><span><LoaderCircle className="spin" size={16} />{t.batchRunning} {batchProgress}/{batchPhotos.length}</span><progress max={batchPhotos.length} value={batchProgress} /></div>}
            {batchStatus && <p className="inline-success batch-message"><Check size={16} />{batchStatus}</p>}{batchError && <p className="inline-error batch-message"><AlertCircle size={16} />{batchError}</p>}
            <p className="privacy-note batch-privacy">{t.batchPrivacy}</p>
          </div>
          <footer className="modal-footer"><button className="plain-button" onClick={() => setBatchOpen(false)} disabled={batchRunning}>{t.cancel}</button><button className="primary-button" onClick={() => void saveBatchPhotos()} disabled={batchRunning || batchPhotos.length === 0}>{batchRunning ? <LoaderCircle className="spin" size={17} /> : <Sparkles size={17} />}{batchRunning ? t.batchRunning : t.batchRun}</button></footer>
        </section>
      </div>}

      {paymentOpen && activeCustomer && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !paymentSaving) setPaymentOpen(false); }}>
        <section className="payment-modal" role="dialog" aria-modal="true" aria-labelledby="payment-title">
          <header className="modal-head"><div><p className="eyebrow">{activeCustomer.name}</p><h2 id="payment-title">{t.paymentTitle}</h2></div><button className="icon-button" onClick={() => setPaymentOpen(false)} disabled={paymentSaving} aria-label={t.cancel}><X size={19} /></button></header>
          <form onSubmit={(event) => void savePayment(event)}>
            <div className="modal-body"><div className="form-grid">
              <label className="field"><span>{t.amount} (₹) *</span><input type="number" min="0.01" step="0.01" inputMode="decimal" required autoFocus value={paymentDraft.amount} onChange={(event) => setPaymentDraft((current) => ({ ...current, amount: event.target.value }))} /></label>
              <label className="field"><span>{t.paymentDate}</span><input type="date" value={paymentDraft.date} onChange={(event) => setPaymentDraft((current) => ({ ...current, date: event.target.value }))} /></label>
              <label className="field"><span>{t.paymentMethod}</span><select value={paymentDraft.method} onChange={(event) => setPaymentDraft((current) => ({ ...current, method: event.target.value }))}><option value="cash">{t.cash}</option><option value="upi">UPI</option><option value="other">{t.otherMethod}</option></select></label>
              <label className="field full-field"><span>{t.paymentForBill}</span><select value={paymentDraft.order_id} onChange={(event) => { const order = orders.find((item) => item.id === event.target.value); setPaymentDraft((current) => ({ ...current, order_id: event.target.value, amount: order ? orderBalance(order).toFixed(2) : current.amount, stage: order ? 'final' : 'advance' })); }}><option value="">{t.noOrderLink}</option>{orders.filter((order) => orderBalance(order) > 0).map((order) => <option value={order.id} key={order.id}>{order.order_number} · {order.garment_type} · {t.due}: {formatMoney(orderBalance(order))}</option>)}</select></label>
              <label className="field"><span>{t.orderPayment}</span><select value={paymentDraft.stage} onChange={(event) => setPaymentDraft((current) => ({ ...current, stage: event.target.value }))}><option value="advance">{t.advanceStage}</option><option value="part">{t.partPaymentStage}</option><option value="final">{t.finalPaymentStage}</option></select></label>
              <label className="field full-field"><span>{t.paymentNote}</span><textarea rows={2} value={paymentDraft.notes} onChange={(event) => setPaymentDraft((current) => ({ ...current, notes: event.target.value }))} /></label>
            </div>{paymentError && <p className="inline-error form-error"><AlertCircle size={16} />{paymentError}</p>}</div>
            <footer className="modal-footer"><button type="button" className="plain-button" onClick={() => setPaymentOpen(false)} disabled={paymentSaving}>{t.cancel}</button><button type="submit" className="primary-button" disabled={paymentSaving}>{paymentSaving ? <LoaderCircle className="spin" size={17} /> : <Save size={17} />}{paymentSaving ? t.saving : t.savePayment}</button></footer>
          </form>
        </section>
      </div>}

      {orderOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !orderSaving) setOrderOpen(false); }}>
        <section className="order-modal" role="dialog" aria-modal="true" aria-labelledby="order-title">
          <header className="modal-head"><div><p className="eyebrow">SUNNY TAILOR</p><h2 id="order-title">{editingOrderId ? t.editBill : t.billTitle}</h2></div><button className="icon-button" onClick={() => setOrderOpen(false)} disabled={orderSaving} aria-label={t.cancel}><X size={19} /></button></header>
          <form onSubmit={(event) => void saveOrder(event)}>
            <div className="modal-body">
              <section className="form-section"><div className="form-grid">
                <div className="field full-field"><span>{t.linkedCustomer} *</span>{orderCustomerId ? <div className="selected-order-customer"><UserRound size={16} /><strong>{customers.find((customer) => customer.id === orderCustomerId)?.name}</strong><small>{customers.find((customer) => customer.id === orderCustomerId)?.phone}</small>{!editingOrderId && <button type="button" className="text-button" onClick={() => { setOrderCustomerId(''); setOrderCustomerQuery(''); }}>{language === 'mr' ? 'बदला' : 'Change'}</button>}</div> : <><input type="search" value={orderCustomerQuery} onChange={(event) => setOrderCustomerQuery(event.target.value)} placeholder={t.selectCustomer} autoFocus /><div className="order-customer-results">{orderCustomerMatches.slice(0, 8).map((customer) => <button type="button" key={customer.id} onClick={() => { setOrderCustomerId(customer.id); setOrderCustomerQuery(`${customer.name}${customer.phone ? ` · ${customer.phone}` : ''}`); setOrderDraft((current) => ({ ...current, garment_type: current.garment_type || customer.garment_type })); }}><strong>{customer.name}</strong><span>{customer.phone || customer.garment_type}</span></button>)}{orderCustomerMatches.length === 0 && <small>{t.noCustomerMatch}</small>}</div></>}</div>
                <label className="field"><span>{t.garment} *</span><select required value={orderDraft.garment_type} onChange={(event) => setOrderDraft((current) => ({ ...current, garment_type: event.target.value }))}><option value="">{t.chooseGarment}</option><option value={language === 'mr' ? 'ब्लाउज' : 'Blouse'}>{t.blouseOption}</option><option value={language === 'mr' ? 'ड्रेस' : 'Dress'}>{t.dressOption}</option><option value={language === 'mr' ? '९ वारी' : '9 vaari'}>{t.nineVaariOption}</option><option value={language === 'mr' ? 'इतर' : 'Other'}>{t.otherOption}</option></select></label>
                <label className="field"><span>{t.status}</span><select value={orderDraft.status} onChange={(event) => setOrderDraft((current) => ({ ...current, status: event.target.value }))}><option value="new">{t.orderNew}</option><option value="in_progress">{t.orderInProgress}</option><option value="ready">{t.orderReady}</option><option value="delivered">{t.orderDelivered}</option><option value="cancelled">{t.orderCancelled}</option></select></label>
                <label className="field"><span>{t.billDescription}</span><input value={orderDraft.description} onChange={(event) => setOrderDraft((current) => ({ ...current, description: event.target.value }))} placeholder={language === 'mr' ? 'उदा. लग्नाचा ब्लाउज' : 'e.g. wedding blouse'} /></label>
                <label className="field"><span>{t.billAmount} *</span><input type="number" min="0.01" step="0.01" required value={orderDraft.total_amount} onChange={(event) => setOrderDraft((current) => ({ ...current, total_amount: event.target.value }))} /></label>
                <label className="field"><span>{t.advanceAmount}</span><input type="number" min="0" step="0.01" disabled={Boolean(editingOrderId)} value={orderDraft.advance_amount} onChange={(event) => setOrderDraft((current) => ({ ...current, advance_amount: event.target.value }))} /></label>
                <label className="field"><span>{t.advanceMethod}</span><select disabled={Boolean(editingOrderId)} value={orderDraft.advance_method} onChange={(event) => setOrderDraft((current) => ({ ...current, advance_method: event.target.value }))}><option value="cash">{t.cash}</option><option value="upi">UPI</option><option value="other">{t.otherMethod}</option></select></label>
                <div className="order-balance-preview full-field"><span>{t.remainingAfterAdvance}</span><strong>{orderDraft.total_amount.trim() && Number.isFinite(orderDraftTotal) ? formatMoney(orderDraftBalance) : '—'}</strong></div>
                <label className="field"><span>{t.dueDate}</span><input type="date" value={orderDraft.due_date} onChange={(event) => setOrderDraft((current) => ({ ...current, due_date: event.target.value }))} /><small className="field-hint">{t.calendarNote}</small></label>
                <label className="field full-field"><span>{t.orderNotes}</span><textarea rows={2} value={orderDraft.notes} onChange={(event) => setOrderDraft((current) => ({ ...current, notes: event.target.value }))} /></label>
              </div></section>
              {orderCustomerId && <p className="order-snapshot-note"><Check size={15} />{t.attachedMeasurements} {Object.values(customers.find((customer) => customer.id === orderCustomerId)?.measurements ?? {}).filter(Boolean).length}</p>}
              {orderError && <p className="inline-error form-error"><AlertCircle size={16} />{orderError}</p>}
            </div>
            <footer className="modal-footer"><button type="button" className="plain-button" onClick={() => setOrderOpen(false)} disabled={orderSaving}>{t.cancel}</button><button type="submit" className="primary-button" disabled={orderSaving || !orderCustomerId}>{orderSaving ? <LoaderCircle className="spin" size={17} /> : <Save size={17} />}{orderSaving ? t.saving : t.createBill}</button></footer>
          </form>
        </section>
      </div>}

      {formOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setFormOpen(false); }}>
        <section className="customer-modal" role="dialog" aria-modal="true" aria-labelledby="form-title">
          <header className="modal-head"><div><p className="eyebrow">SUNNY TAILOR</p><h2 id="form-title">{editingId ? t.editCustomer : t.newCustomer}</h2></div><button className="icon-button" onClick={() => setFormOpen(false)} disabled={saving} aria-label={t.close}><X size={19} /></button></header>
          <form onSubmit={(event) => void saveCustomer(event)}>
            <div className="modal-body">
              <section className="scan-card">
                <div className="scan-card-head"><div className="scan-symbol"><Sparkles size={18} /></div><div><h3>{t.scan}</h3><p>{t.scanHint}</p></div></div>
                <div className="photo-actions"><button type="button" className="secondary-button" onClick={() => cameraRef.current?.click()}><Camera size={16} />{t.camera}</button><button type="button" className="secondary-button" onClick={() => galleryRef.current?.click()}>{t.gallery}</button>
                  <input ref={cameraRef} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={selectPhoto} />
                  <input ref={galleryRef} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={selectPhoto} />
                </div>
                {photo && <div className="photo-preview-row"><img src={previewSrc} alt={t.selectPhoto} style={{ transform: `rotate(${rotation * 90}deg)` }} /><div className="photo-info"><strong>{photo.name}</strong><small>{(photo.size / 1024 / 1024).toFixed(1)} MB</small></div><button type="button" className="icon-button" title={t.rotate} aria-label={t.rotate} onClick={() => setRotation((value) => (value + 1) % 4)}><RotateCw size={17} /></button><button type="button" className="icon-button" aria-label={t.cancel} onClick={() => { setPhoto(null); setScanResult(null); }}><X size={17} /></button></div>}
                {photo && <button type="button" className="scan-button" onClick={() => void scanPhoto()} disabled={scanning}>{scanning ? <LoaderCircle className="spin" size={17} /> : <Sparkles size={17} />}{scanning ? t.scanning : t.scan}</button>}
                <p className="privacy-note">{t.scanPrivacy}</p><p className="camera-hint">{t.cameraHint}</p>
                {scanMessage && <p className="inline-success"><Check size={15} />{scanMessage}</p>}{scanError && <p className="inline-error"><AlertCircle size={15} />{scanError}</p>}
                {scanResult && <div className="confidence-list"><span>{t.confidence}</span>{[...measurementFields.map((key) => [labels[language][key], scanResult.measurements?.[key]?.confidence] as const), [t.name, scanResult.name?.confidence] as const].filter(([, score]) => score !== undefined).map(([label, score]) => <span key={label}>{label} {formatConfidence(score)}</span>)}</div>}
              </section>

              <section className="form-section"><div className="form-section-title"><span className="number-badge">1</span><h3>{t.basic}</h3></div>
                <div className="form-grid"><label className="field full-field"><span>{t.name} <b>*</b></span><input autoFocus required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder={t.namePlaceholder} dir="auto" /></label>
                  <label className="field"><span>{t.date}</span><input type="date" value={draft.measurement_date} onChange={(event) => setDraft({ ...draft, measurement_date: event.target.value })} aria-label={t.datePlaceholder} /></label>
                  <label className="field"><span>{t.phone}</span><input type="tel" inputMode="tel" value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} placeholder={t.phonePlaceholder} dir="auto" /></label>
                  <label className="field"><span>{t.garment}</span><select value={garmentChoice} onChange={(event) => {
                    const choice = event.target.value;
                    setGarmentChoice(choice);
                    const options: Record<string, [string, string]> = { blouse: ['Blouse', 'ब्लाउज'], dress: ['Dress', 'ड्रेस'], 'nine-vaari': ['9 vaari', '९ वारी'] };
                    setDraft((current) => ({ ...current, garment_type: options[choice]?.[language === 'mr' ? 1 : 0] ?? (choice === 'other' && garmentChoice === 'other' ? current.garment_type : '') }));
                  }}>
                    <option value="">{t.chooseGarment}</option><option value="blouse">{t.blouseOption}</option><option value="dress">{t.dressOption}</option><option value="nine-vaari">{t.nineVaariOption}</option><option value="other">{t.otherOption}</option>
                  </select>{garmentChoice === 'other' && <input value={draft.garment_type} onChange={(event) => setDraft({ ...draft, garment_type: event.target.value })} placeholder={t.otherGarmentPlaceholder} dir="auto" />}</label>
                  <label className="field full-field"><span>{t.notes}</span><textarea rows={2} value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} placeholder={t.notesPlaceholder} dir="auto" /></label>
                </div>
              </section>

              <section className="form-section"><div className="form-section-title"><span className="number-badge">2</span><div><h3>{t.measurements}{garmentChoice && ` · ${garmentChoice === 'blouse' ? t.blouseOption : garmentChoice === 'dress' ? t.dressOption : garmentChoice === 'nine-vaari' ? t.nineVaariOption : t.otherOption}`}</h3><p>{t.unitHint}</p></div></div>
                {groupedMeasurements.map(({ group, fields }) => {
                  const title = groupTitle(group);
                  return <div className="measurement-category-group" key={group}><h4>{title}</h4><div className="form-grid measurement-input-grid">{fields.map((field) => <label className="field" key={field}><span>{labels[language][field]}{scanResult?.measurements?.[field]?.confidence !== undefined && <em>{formatConfidence(scanResult.measurements[field]?.confidence)}</em>}</span><input value={draft.measurements[field] ?? ''} onChange={(event) => updateMeasurement(field, event.target.value)} placeholder="—" dir="auto" /></label>)}</div></div>;
                })}
                <label className="field measure-note-field"><span>{t.measureNotes}</span><textarea rows={2} value={draft.measurement_notes} onChange={(event) => setDraft({ ...draft, measurement_notes: event.target.value })} placeholder={t.measureNotesPlaceholder} dir="auto" /></label>
              </section>
              <section className="form-section form-design-section">
                <div className="form-section-title"><span className="number-badge">3</span><div><h3>{t.sketchDuringEntry}</h3><p>{t.createOrEditSketchHint}</p></div></div>
                <div className="drawing-toolbar">
                  <button type="button" className={`draw-tool ${designMode === 'pen' ? 'active' : ''}`} onClick={() => setDesignMode('pen')} title={t.pen}><Pencil size={15} />{t.pen}</button>
                  <button type="button" className={`draw-tool ${designMode === 'eraser' ? 'active' : ''}`} onClick={() => setDesignMode('eraser')} title={t.eraser}><Eraser size={15} />{t.eraser}</button>
                  <button type="button" className="draw-icon-tool" onClick={undoDesign} disabled={formDrawingHistoryRef.current.length === 0} title={t.undo} aria-label={t.undo}><RotateCcw size={15} /></button>
                  <button type="button" className="draw-icon-tool" onClick={clearDesign} title={t.clearDrawing}>{language === 'mr' ? 'पुसा' : 'Clear'}</button>
                  <label className="draw-color" title={t.drawingColor}><span>{t.drawingColor}</span><input type="color" value={designColor} onChange={(event) => setDesignColor(event.target.value)} aria-label={t.drawingColor} /></label>
                </div>
                <canvas ref={formDesignCanvasRef} className="design-canvas" width={1000} height={500} onPointerDown={startDrawing} onPointerMove={continueDrawing} onPointerUp={stopDrawing} onPointerCancel={stopDrawing} aria-label={t.designPad} />
                <div className="design-save-row"><span>{draftDesignDirty ? (language === 'mr' ? 'ग्राहक जतन केल्यावर डिझाइनही जतन होईल' : 'Sketch will save with this customer') : draft.design_image ? t.sketchEdited : ''}</span><span className="form-design-status"><Save size={14} /> {draftDesignDirty ? t.sketchEdited : t.save}</span></div>
              </section>
              {formError && <p className="inline-error form-error"><AlertCircle size={16} />{formError}</p>}
            </div>
            <footer className="modal-footer"><button type="button" className="plain-button" onClick={() => setFormOpen(false)} disabled={saving}>{t.cancel}</button><button type="submit" className="primary-button" disabled={saving}>{saving ? <LoaderCircle className="spin" size={17} /> : <Save size={17} />}{saving ? t.saving : t.save}</button></footer>
          </form>
        </section>
      </div>}
    </div>
  );
}

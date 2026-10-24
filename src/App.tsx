import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  AlertCircle, Camera, Check, ChevronRight, CircleHelp, Clock3,
  Languages, LoaderCircle, Pencil, Plus, RotateCw, Save, Search, Scissors,
  Sparkles, Trash2, UserRound, Users, X,
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { measurementFields, type Customer, type CustomerDraft, type Language, type MeasurementField, type ScanResult } from './types';

const emptyDraft = (): CustomerDraft => ({
  name: '', phone: '', notes: '', garment_type: '', measurements: {}, measurement_notes: '',
});

const copy = {
  en: {
    subtitle: 'Customer book', search: 'Search by name, phone or measurement…', add: 'Add customer',
    records: 'Customer records', customers: 'customers', noCustomers: 'Your customer book is empty',
    noCustomersHelp: 'Add your first customer to keep their contact details and measurements together.',
    noResults: 'No matching customers', noResultsHelp: 'Try another name, phone number, or measurement.',
    newCustomer: 'New customer', editCustomer: 'Edit customer', basic: 'Customer details', measurements: 'Measurements',
    name: 'Name', phone: 'Phone number', garment: 'Garment type', notes: 'Customer notes',
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
  },
  mr: {
    subtitle: 'ग्राहक वही', search: 'नाव, फोन किंवा माप शोधा…', add: 'ग्राहक जोडा',
    records: 'ग्राहक नोंदी', customers: 'ग्राहक', noCustomers: 'तुमच्या ग्राहक वहीत अजून नोंदी नाहीत',
    noCustomersHelp: 'नाव, संपर्क आणि माप एकत्र ठेवण्यासाठी पहिला ग्राहक जोडा.',
    noResults: 'जुळणारे ग्राहक सापडले नाहीत', noResultsHelp: 'दुसरे नाव, फोन नंबर किंवा माप शोधा.',
    newCustomer: 'नवीन ग्राहक', editCustomer: 'ग्राहकाची नोंद बदला', basic: 'ग्राहकाची माहिती', measurements: 'मापे',
    name: 'नाव', phone: 'फोन नंबर', garment: 'कपड्याचा प्रकार', notes: 'ग्राहकाबद्दल नोंद',
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
  },
} satisfies Record<Language, Record<string, string>>;

const labels: Record<Language, Record<MeasurementField, string>> = {
  en: { pants_length: 'Pants length', top_length: 'Top length', waist: 'Waist', hip: 'Hip', sleeve_length: 'Sleeve length', sleeve_width: 'Sleeve width', front_neck: 'Front neck', back_neck: 'Back neck' },
  mr: { pants_length: 'पँटची लांबी', top_length: 'टॉपची लांबी', waist: 'कंबर', hip: 'नितंब', sleeve_length: 'बाहीची लांबी', sleeve_width: 'बाहीची रुंदी', front_neck: 'गळा पुढे', back_neck: 'गळा मागे' },
};

const normalizeSearch = (value: string) => value
  .normalize('NFKC')
  .replace(/[०-९]/g, (digit) => String('०१२३४५६७८९'.indexOf(digit)))
  .toLocaleLowerCase();

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

export default function App() {
  const [language, setLanguage] = useState<Language>(() => localStorage.getItem('sunny-language') === 'mr' ? 'mr' : 'en');
  const t = copy[language];
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CustomerDraft>(emptyDraft());
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
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const loadCustomers = useCallback(async () => {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    setLoadError('');
    const { data, error } = await supabase.from('customers').select('*').order('updated_at', { ascending: false });
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
      const values = [customer.name, customer.phone, customer.notes, customer.garment_type, customer.measurement_notes];
      for (const [key, value] of Object.entries(customer.measurements ?? {})) {
        values.push(value ?? '', labels.en[key as MeasurementField] ?? '', labels.mr[key as MeasurementField] ?? '');
      }
      return normalizeSearch(values.join(' ')).includes(needle);
    });
  }, [customers, query]);
  const activeCustomer = customers.find((customer) => customer.id === selected) ?? null;

  const startNew = () => {
    setEditingId(null); setDraft(emptyDraft()); setFormError(''); setScanMessage(''); setScanError('');
    setScanResult(null); setPhoto(null); setRotation(0); setFormOpen(true);
  };

  const startEdit = (customer: Customer) => {
    setEditingId(customer.id);
    setDraft({ name: customer.name, phone: customer.phone ?? '', notes: customer.notes ?? '', garment_type: customer.garment_type ?? '', measurements: customer.measurements ?? {}, measurement_notes: customer.measurement_notes ?? '' });
    setFormError(''); setScanMessage(''); setScanError(''); setScanResult(null); setPhoto(null); setRotation(0); setFormOpen(true);
  };

  const updateMeasurement = (key: MeasurementField, value: string) => setDraft((current) => ({ ...current, measurements: { ...current.measurements, [key]: value } }));

  const selectPhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = '';
    setScanError(''); setScanMessage(''); setScanResult(null); setRotation(0);
    if (file && !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setScanError(language === 'mr' ? 'कृपया JPG, PNG किंवा WebP फोटो निवडा.' : 'Choose a JPG, PNG, or WebP image.'); return; }
    if (file && file.size > 9 * 1024 * 1024) { setScanError(language === 'mr' ? 'फोटो ९ MB पेक्षा लहान निवडा.' : 'Choose an image smaller than 9 MB.'); return; }
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
      const body = await response.json();
      if (!response.ok) throw new Error(response.status === 503 ? t.scanNeedKey : body.error || t.scanError);
      const result = body.result as ScanResult;
      setScanResult(result);
      setDraft((current) => ({
        ...current,
        name: result.name?.value || current.name,
        phone: result.phone?.value || current.phone,
        notes: result.notes?.value || current.notes,
        garment_type: result.garment_type?.value || current.garment_type,
        measurement_notes: result.measurement_notes?.value || current.measurement_notes,
        measurements: Object.fromEntries(measurementFields.map((field) => [field, result.measurements?.[field]?.value || current.measurements[field] || ''])) as CustomerDraft['measurements'],
      }));
      setScanMessage(t.scanApplied);
    } catch (error) {
      setScanError(error instanceof Error ? error.message : t.scanError);
    } finally { setScanning(false); }
  };

  const saveCustomer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.name.trim()) { setFormError(t.required); return; }
    if (!supabase) return;
    setSaving(true); setFormError('');
    const payload = { ...draft, name: draft.name.trim(), phone: draft.phone.trim(), updated_at: new Date().toISOString() };
    const result = editingId
      ? await supabase.from('customers').update(payload).eq('id', editingId).select().single()
      : await supabase.from('customers').insert(payload).select().single();
    if (result.error) { setFormError(result.error.message || t.saveError); setSaving(false); return; }
    await loadCustomers();
    setSelected(result.data.id); setSaving(false); setFormOpen(false);
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
          <button className="language-toggle" onClick={() => setLanguage(language === 'en' ? 'mr' : 'en')} title="Change language" aria-label="Change language">
            <Languages size={16} /><span>{language === 'en' ? 'मराठी' : 'English'}</span>
          </button>
        </div>
      </header>

      <main className="workspace">
        <section className="page-heading">
          <div>
            <p className="eyebrow">SUNNY TAILOR · {t.subtitle.toLocaleUpperCase(language === 'mr' ? 'mr-IN' : 'en-IN')}</p>
            <h1>{t.records}</h1>
            <p className="heading-copy">{customers.length} {t.customers}</p>
          </div>
          <button className="primary-button" onClick={startNew}><Plus size={18} />{t.add}</button>
        </section>

        {!isSupabaseConfigured ? (
          <section className="notice-card setup-card"><div className="notice-icon"><CircleHelp size={22} /></div><div><h2>{t.setupTitle}</h2><p>{t.setupBody}</p></div></section>
        ) : null}
        {loadError ? <section className="notice-card error-card"><AlertCircle size={19} /><div><strong>{t.connectionError}</strong><p>{loadError}</p><button className="text-button" onClick={() => void loadCustomers()}>{language === 'mr' ? 'पुन्हा प्रयत्न करा' : 'Try again'}</button></div></section> : null}

        <div className="content-grid">
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
              <div className="detail-head"><div className="detail-avatar"><UserRound size={23} /></div><div className="detail-title"><h2>{activeCustomer.name}</h2><p>{activeCustomer.phone || activeCustomer.garment_type || t.subtitle}</p></div><button className="icon-button" onClick={() => startEdit(activeCustomer)} aria-label={t.editCustomer} title={t.editCustomer}><Pencil size={17} /></button></div>
              <div className="detail-scroll">
                <div className="detail-section"><div className="section-heading"><h3>{t.basic}</h3><span className="small-muted">{t.updated} {formatDate(activeCustomer.updated_at, language)}</span></div>
                  <dl className="info-list">{activeCustomer.phone && <div><dt>{t.phone}</dt><dd dir="auto">{activeCustomer.phone}</dd></div>}{activeCustomer.garment_type && <div><dt>{t.garment}</dt><dd dir="auto">{activeCustomer.garment_type}</dd></div>}{activeCustomer.notes && <div className="notes-row"><dt>{t.notes}</dt><dd dir="auto">{activeCustomer.notes}</dd></div>}</dl>
                </div>
                <div className="detail-section"><div className="section-heading"><h3>{t.measurements}</h3><span className="measurement-pill">{Object.values(activeCustomer.measurements ?? {}).filter(Boolean).length}</span></div>
                  {Object.values(activeCustomer.measurements ?? {}).some(Boolean) ? <div className="measure-grid">{measurementFields.filter((field) => activeCustomer.measurements?.[field]).map((field) => <div className="measure-cell" key={field}><span>{labels[language][field]}</span><strong dir="auto">{activeCustomer.measurements[field]}</strong></div>)}</div> : <p className="muted-copy">{t.emptyMeasure}</p>}
                  {activeCustomer.measurement_notes && <div className="measure-notes"><span>{t.measureNotes}</span><p dir="auto">{activeCustomer.measurement_notes}</p></div>}
                </div>
                <div className="detail-footer"><button className="danger-button" onClick={() => void deleteCustomer()}><Trash2 size={16} />{t.delete}</button><span><Clock3 size={14} />{formatDate(activeCustomer.created_at, language)}</span></div>
              </div>
            </> : <div className="detail-placeholder"><div className="placeholder-icon"><Scissors size={24} /></div><h2>{language === 'mr' ? 'ग्राहक निवडा' : 'Choose a customer'}</h2><p>{language === 'mr' ? 'संपर्क आणि मापे पाहण्यासाठी यादीतील नोंद निवडा.' : 'Select a record to view contact details and measurements.'}</p></div>}
          </aside>
        </div>
        <footer className="page-footer"><span>Sunny Tailor · {language === 'mr' ? 'ग्राहक आणि मापे' : 'Customer & measurement book'}</span><span><span className="status-dot" />{t.localData}</span></footer>
      </main>

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
                  <label className="field"><span>{t.phone}</span><input type="tel" inputMode="tel" value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} placeholder={t.phonePlaceholder} dir="auto" /></label>
                  <label className="field"><span>{t.garment}</span><input value={draft.garment_type} onChange={(event) => setDraft({ ...draft, garment_type: event.target.value })} placeholder={t.garmentPlaceholder} dir="auto" /></label>
                  <label className="field full-field"><span>{t.notes}</span><textarea rows={2} value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} placeholder={t.notesPlaceholder} dir="auto" /></label>
                </div>
              </section>

              <section className="form-section"><div className="form-section-title"><span className="number-badge">2</span><div><h3>{t.measurements}</h3><p>{t.unitHint}</p></div></div>
                <div className="form-grid measurement-input-grid">{measurementFields.map((field) => <label className="field" key={field}><span>{labels[language][field]}{scanResult?.measurements?.[field]?.confidence !== undefined && <em>{formatConfidence(scanResult.measurements[field]?.confidence)}</em>}</span><input value={draft.measurements[field] ?? ''} onChange={(event) => updateMeasurement(field, event.target.value)} placeholder="—" dir="auto" /></label>)}</div>
                <label className="field measure-note-field"><span>{t.measureNotes}</span><textarea rows={2} value={draft.measurement_notes} onChange={(event) => setDraft({ ...draft, measurement_notes: event.target.value })} placeholder={t.measureNotesPlaceholder} dir="auto" /></label>
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

import React from 'react';
import { supabase } from '../supabase';
import { Property, PropertyType, PropertyStatus, DocumentInfo } from '../types';
import PropertyFormMap, { isOutsideOoty } from './PropertyFormMap';
import {
  X, Plus, Upload, Loader2, AlertCircle, AlertTriangle,
  FileText, Image as ImageIcon, Youtube, GripVertical,
  ToggleLeft, ToggleRight, ChevronDown
} from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatIndianCurrency = (value: string | number): string => {
  const num = typeof value === 'string' ? parseInt(value.replace(/[^\d]/g, ''), 10) : value;
  if (isNaN(num) || num <= 0) return '';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
};

const getYouTubeId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
};

const getPinIcon = (type: PropertyType): string => {
  switch (type) {
    case 'flat': return 'map-pin-flat';
    case 'land': return 'map-pin-land';
    case 'resort': return 'map-pin-resort';
    case 'tea_estate': return 'map-pin-tea';
  }
};

// ─── Image / Document item types ───────────────────────────────────────────

interface ImageItem {
  id: string;
  file?: File;
  url?: string;        // existing uploaded URL (edit mode)
  preview: string;     // objectURL or remote URL for display
}

interface DocItem {
  id: string;
  file?: File;
  url?: string;        // existing uploaded URL (edit mode)
  name: string;
  isPublic: boolean;
}

// ─── Form State ──────────────────────────────────────────────────────────────

interface FormState {
  type: PropertyType;
  title: string;
  description: string;
  price: string;
  locality: string;
  plotAreaSqft: string;
  builtUpAreaSqft: string;
  bhk: string;
  floorNumber: string;
  amenities: string[];
  status: PropertyStatus;
  is_published: boolean;
  latitude: number | null;
  longitude: number | null;
  videoUrl: string;
  distanceFromTownKm: string;
}

const emptyForm = (): FormState => ({
  type: 'land',
  title: '',
  description: '',
  price: '',
  locality: '',
  plotAreaSqft: '',
  builtUpAreaSqft: '',
  bhk: '',
  floorNumber: '',
  amenities: [],
  status: 'available',
  is_published: false,
  latitude: null,
  longitude: null,
  videoUrl: '',
  distanceFromTownKm: '',
});

const propertyToForm = (p: Property): FormState => ({
  type: p.type,
  title: p.title,
  description: p.description,
  price: String(p.price),
  locality: p.locality,
  plotAreaSqft: p.plotAreaSqft ? String(p.plotAreaSqft) : '',
  builtUpAreaSqft: p.builtUpAreaSqft ? String(p.builtUpAreaSqft) : '',
  bhk: p.bhk ? String(p.bhk) : '',
  floorNumber: p.floorNumber ? String(p.floorNumber) : '',
  amenities: [...p.amenities],
  status: p.status,
  is_published: p.is_published ?? false,
  latitude: p.latitude,
  longitude: p.longitude,
  videoUrl: p.videoUrl ?? '',
  distanceFromTownKm: p.distanceFromTownKm ? String(p.distanceFromTownKm) : '',
});

// ─── Component ───────────────────────────────────────────────────────────────

interface PropertyFormProps {
  mode: 'create' | 'edit';
  property?: Property | null;
  onCancel: () => void;
  onSaved: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

// Shared label + error field wrapper
function Field({ label, error, children, required }: { label: string; error?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
        {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-[11px] text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

// Section card wrapper
function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-neutral-50 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-brand-green/8 flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-brand-green" />
        </div>
        <h3 className="text-sm font-display font-bold text-brand-charcoal">{title}</h3>
      </div>
      <div className="p-6 space-y-5">
        {children}
      </div>
    </div>
  );
}

const INPUT_CLASS = "w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-sans focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all placeholder:text-neutral-300";
const INPUT_ERROR_CLASS = "border-rose-300 bg-rose-50 focus:ring-rose-200 focus:border-rose-400";

export default function PropertyForm({ mode, property, onCancel, onSaved, showToast }: PropertyFormProps) {
  const [form, setForm] = React.useState<FormState>(
    mode === 'edit' && property ? propertyToForm(property) : emptyForm()
  );
  const [imageItems, setImageItems] = React.useState<ImageItem[]>(() => {
    if (mode === 'edit' && property) {
      return property.images.map((url, i) => ({
        id: `existing-${i}`,
        url,
        preview: url,
      }));
    }
    return [];
  });
  const [docItems, setDocItems] = React.useState<DocItem[]>(() => {
    if (mode === 'edit' && property) {
      return property.documents.map((d, i) => ({
        id: `existing-doc-${i}`,
        url: d.url,
        name: d.name,
        isPublic: d.isPublic,
      }));
    }
    return [];
  });

  const [amenityInput, setAmenityInput] = React.useState('');
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [isDirty, setIsDirty] = React.useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = React.useState(false);
  const [outOfBoundsWarning, setOutOfBoundsWarning] = React.useState(false);

  // Image drag-reorder
  const dragImgSrc = React.useRef<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = React.useState<number | null>(null);

  // Image drop zone
  const imgInputRef = React.useRef<HTMLInputElement>(null);
  const docInputRef = React.useRef<HTMLInputElement>(null);

  // ── Dirty tracking helper ──
  const markDirty = () => setIsDirty(true);

  const setField = <K extends keyof FormState>(key: K, val: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: val }));
    markDirty();
    // Clear specific error
    if (errors[key]) setErrors(prev => { const e = { ...prev }; delete e[key]; return e; });
  };

  // ── Out-of-bounds check ──
  React.useEffect(() => {
    if (form.latitude !== null && form.longitude !== null) {
      setOutOfBoundsWarning(isOutsideOoty(form.latitude, form.longitude));
    } else {
      setOutOfBoundsWarning(false);
    }
  }, [form.latitude, form.longitude]);

  // ── Amenities ──
  const handleAmenityKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && amenityInput.trim()) {
      e.preventDefault();
      if (!form.amenities.includes(amenityInput.trim())) {
        setField('amenities', [...form.amenities, amenityInput.trim()]);
      }
      setAmenityInput('');
    }
  };
  const removeAmenity = (tag: string) => {
    setField('amenities', form.amenities.filter(a => a !== tag));
  };

  // ── Image file handling ──
  const processImageFiles = (files: FileList | File[]) => {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'));
    const newItems: ImageItem[] = arr.map(file => ({
      id: `new-img-${Date.now()}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
    }));
    setImageItems(prev => [...prev, ...newItems]);
    markDirty();
    if (errors.images) setErrors(prev => { const e = { ...prev }; delete e['images']; return e; });
  };

  const handleImgInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processImageFiles(e.target.files);
    e.target.value = '';
  };

  const handleImgDropZone = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) processImageFiles(e.dataTransfer.files);
  };

  // ── Image grid reorder ──
  const handleImgDragStart = (idx: number) => { dragImgSrc.current = idx; };
  const handleImgDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIdx(idx);
  };
  const handleImgDragLeave = () => setDragOverIdx(null);
  const handleImgReorderDrop = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIdx(null);
    if (dragImgSrc.current === null || dragImgSrc.current === idx) return;
    const items = [...imageItems];
    const [removed] = items.splice(dragImgSrc.current, 1);
    items.splice(idx, 0, removed);
    setImageItems(items);
    dragImgSrc.current = null;
    markDirty();
  };
  const removeImage = (id: string) => {
    setImageItems(prev => {
      const item = prev.find(i => i.id === id);
      if (item?.file && item.preview.startsWith('blob:')) URL.revokeObjectURL(item.preview);
      return prev.filter(i => i.id !== id);
    });
    markDirty();
  };

  // ── Document file handling ──
  const processDocFiles = (files: FileList | File[]) => {
    const arr = Array.from(files).filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    const newItems: DocItem[] = arr.map(file => ({
      id: `new-doc-${Date.now()}-${Math.random()}`,
      file,
      name: file.name,
      isPublic: true,
    }));
    setDocItems(prev => [...prev, ...newItems]);
    markDirty();
  };

  const handleDocInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processDocFiles(e.target.files);
    e.target.value = '';
  };

  const handleDocDropZone = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) processDocFiles(e.dataTransfer.files);
  };

  const removeDoc = (id: string) => {
    setDocItems(prev => prev.filter(d => d.id !== id));
    markDirty();
  };

  // ── Validation ──
  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e['title'] = 'Title is required';
    if (!form.price || parseFloat(form.price) <= 0) e['price'] = 'A valid price is required';
    if (!form.locality.trim()) e['locality'] = 'Locality is required';
    if (!form.description.trim()) e['description'] = 'Description is required';
    if (form.latitude === null || form.longitude === null) e['location'] = 'Click the map to set a location';
    if (imageItems.length === 0) e['images'] = 'At least one image is required';
    return e;
  };

  // ── Upload helpers ──
  const uploadImage = async (item: ImageItem, propId: string): Promise<string> => {
    if (item.url && !item.file) return item.url; // already uploaded
    if (!item.file) return item.preview;
    const ext = item.file.name.split('.').pop();
    const path = `${propId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('property-images').upload(path, item.file, { upsert: true });
    if (error) throw new Error(`Image upload failed: ${error.message}`);
    const { data: urlData } = supabase.storage.from('property-images').getPublicUrl(path);
    return urlData.publicUrl;
  };

  const uploadDocument = async (item: DocItem, propId: string): Promise<DocumentInfo> => {
    if (item.url && !item.file) return { name: item.name, url: item.url, isPublic: item.isPublic };
    if (!item.file) return { name: item.name, url: item.url ?? '#', isPublic: item.isPublic };
    const path = `${propId}/${Date.now()}-${item.file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const { error } = await supabase.storage.from('property-documents').upload(path, item.file, { upsert: true });
    if (error) throw new Error(`Document upload failed: ${error.message}`);
    const { data: urlData } = supabase.storage.from('property-documents').getPublicUrl(path);
    return { name: item.name, url: urlData.publicUrl, isPublic: item.isPublic };
  };

  // ── Save ──
  const handleSave = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Scroll to first error
      const firstKey = Object.keys(validationErrors)[0];
      document.getElementById(`field-${firstKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setSaving(true);
    try {
      const propId = mode === 'edit' && property?.id ? property.id : crypto.randomUUID();

      // Upload images
      const imageUrls: string[] = await Promise.all(imageItems.map(img => uploadImage(img, propId)));

      // Upload documents
      const documents: DocumentInfo[] = await Promise.all(docItems.map(doc => uploadDocument(doc, propId)));

      const dbRecord = {
        id: propId,
        type: form.type,
        title: form.title.trim(),
        description: form.description.trim(),
        price: parseFloat(form.price) || 0,
        locality: form.locality.trim(),
        latitude: form.latitude!,
        longitude: form.longitude!,
        plot_area_sqft: form.plotAreaSqft ? parseFloat(form.plotAreaSqft) : null,
        built_up_area_sqft: form.builtUpAreaSqft ? parseFloat(form.builtUpAreaSqft) : null,
        bhk: form.bhk ? parseInt(form.bhk) : null,
        floor_number: form.floorNumber ? parseInt(form.floorNumber) : null,
        amenities: form.amenities,
        images: imageUrls,
        documents,
        status: form.status,
        is_published: form.is_published,
        video_url: form.videoUrl.trim() || null,
        distance_from_town_km: form.distanceFromTownKm ? parseFloat(form.distanceFromTownKm) : 0,
        pin_category: form.type,
        pin_icon: getPinIcon(form.type),
        updated_at: new Date().toISOString(),
      };

      let dbError: any;
      if (mode === 'create') {
        const { error } = await supabase
          .from('properties')
          .insert({ ...dbRecord, created_at: new Date().toISOString() });
        dbError = error;
      } else {
        const { error } = await supabase
          .from('properties')
          .update(dbRecord)
          .eq('id', propId);
        dbError = error;
      }

      if (dbError) throw new Error(dbError.message);

      showToast('Property saved successfully', 'success');
      setIsDirty(false);
      onSaved();
    } catch (err: any) {
      console.error('Save error:', err);
      showToast(err.message || 'Failed to save property', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      onCancel();
    }
  };

  const ytId = getYouTubeId(form.videoUrl);

  return (
    <div className="flex flex-col h-full">
      {/* ── Form Header ── */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-neutral-100 shrink-0">
        <div>
          <h2 className="text-lg font-display font-black text-brand-charcoal">
            {mode === 'create' ? 'Add New Property' : 'Edit Property'}
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            {mode === 'create' ? 'Fill in the details below to list a new property' : `Editing: ${property?.title}`}
          </p>
        </div>
        <button
          onClick={handleCancel}
          className="h-9 px-4 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 flex items-center gap-2 transition-all cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
          Cancel
        </button>
      </div>

      {/* ── Scrollable Form Body ── */}
      <div className="flex-1 overflow-y-auto admin-scroll bg-neutral-50 p-6 space-y-5">

        {/* ── 1. Basic Details ── */}
        <Section title="Basic Details" icon={FileText}>
          {/* Property Type */}
          <Field label="Property Type" required>
            <div className="flex gap-2 flex-wrap">
              {(['flat', 'land', 'resort', 'tea_estate'] as PropertyType[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setField('type', t); }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${form.type === t
                      ? 'bg-brand-green text-white border-brand-green shadow-sm shadow-brand-green/20'
                      : 'bg-white text-neutral-600 border-neutral-200 hover:border-brand-green/40'
                    }`}
                >
                  {t === 'flat' ? 'Flat / Apartment' : t === 'land' ? 'Land / Plot' : t === 'resort' ? 'Resort' : 'Tea Estate'}
                </button>
              ))}
            </div>
          </Field>

          {/* Title */}
          <div id="field-title">
            <Field label="Property Title" error={errors.title} required>
              <input
                type="text"
                value={form.title}
                onChange={e => setField('title', e.target.value)}
                placeholder="e.g. Lakeview Vacant Plot"
                className={`${INPUT_CLASS} ${errors.title ? INPUT_ERROR_CLASS : ''}`}
              />
            </Field>
          </div>

          {/* Description */}
          <div id="field-description">
            <Field label="Description" error={errors.description} required>
              <textarea
                value={form.description}
                onChange={e => setField('description', e.target.value)}
                placeholder="Describe the property — surroundings, key highlights, access..."
                rows={4}
                className={`${INPUT_CLASS} resize-none ${errors.description ? INPUT_ERROR_CLASS : ''}`}
              />
            </Field>
          </div>

          {/* Price */}
          <div id="field-price">
            <Field label="Price (₹)" error={errors.price} required>
              <input
                type="number"
                value={form.price}
                onChange={e => setField('price', e.target.value)}
                placeholder="e.g. 8500000"
                min={0}
                className={`${INPUT_CLASS} ${errors.price ? INPUT_ERROR_CLASS : ''}`}
              />
              {form.price && parseFloat(form.price) > 0 && (
                <p className="text-[11px] text-brand-green font-mono mt-1.5 font-semibold">
                  ≈ {formatIndianCurrency(form.price)}
                </p>
              )}
            </Field>
          </div>

          {/* Locality */}
          <div id="field-locality">
            <Field label="Locality" error={errors.locality} required>
              <input
                type="text"
                value={form.locality}
                onChange={e => setField('locality', e.target.value)}
                placeholder="e.g. Fern Hill, Coonoor, Avalanche"
                className={`${INPUT_CLASS} ${errors.locality ? INPUT_ERROR_CLASS : ''}`}
              />
            </Field>
          </div>

          {/* Distance from town */}
          <Field label="Distance from Ooty Town (km)">
            <input
              type="number"
              value={form.distanceFromTownKm}
              onChange={e => setField('distanceFromTownKm', e.target.value)}
              placeholder="e.g. 5.2"
              min={0}
              step={0.1}
              className={INPUT_CLASS}
            />
          </Field>

          {/* Type-specific fields */}
          {form.type === 'flat' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <Field label="BHK">
                <input type="number" min={1} value={form.bhk} onChange={e => setField('bhk', e.target.value)}
                  placeholder="2" className={INPUT_CLASS} />
              </Field>
              <Field label="Built-up Area (sqft)">
                <input type="number" min={0} value={form.builtUpAreaSqft} onChange={e => setField('builtUpAreaSqft', e.target.value)}
                  placeholder="1200" className={INPUT_CLASS} />
              </Field>
              <Field label="Floor Number">
                <input type="number" min={0} value={form.floorNumber} onChange={e => setField('floorNumber', e.target.value)}
                  placeholder="3" className={INPUT_CLASS} />
              </Field>
            </div>
          )}
          {form.type === 'land' && (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
              <Field label="Plot Area (sqft)">
                <input type="number" min={0} value={form.plotAreaSqft} onChange={e => setField('plotAreaSqft', e.target.value)}
                  placeholder="9000" className={INPUT_CLASS} />
              </Field>
            </div>
          )}
          {form.type === 'resort' && (
            <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
              <Field label="Built-up Area (sqft)">
                <input type="number" min={0} value={form.builtUpAreaSqft} onChange={e => setField('builtUpAreaSqft', e.target.value)}
                  placeholder="12000" className={INPUT_CLASS} />
              </Field>
            </div>
          )}
          {form.type === 'tea_estate' && (
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <Field label="Plot Area (sqft)">
                <input type="number" min={0} value={form.plotAreaSqft} onChange={e => setField('plotAreaSqft', e.target.value)}
                  placeholder="40000" className={INPUT_CLASS} />
              </Field>
            </div>
          )}

          {/* Amenities */}
          <Field label="Amenities">
            <div className="flex flex-wrap gap-2 p-3 bg-neutral-50 border border-neutral-200 rounded-xl min-h-[44px]">
              {form.amenities.map(tag => (
                <span key={tag} className="flex items-center gap-1.5 bg-brand-green/10 text-brand-green text-xs font-semibold px-3 py-1 rounded-full border border-brand-green/20">
                  {tag}
                  <button onClick={() => removeAmenity(tag)} className="hover:text-rose-500 transition-colors cursor-pointer focus:outline-none">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={amenityInput}
                onChange={e => setAmenityInput(e.target.value)}
                onKeyDown={handleAmenityKeyDown}
                placeholder={form.amenities.length === 0 ? 'Type amenity, press Enter to add' : 'Add another...'}
                className="flex-1 min-w-[160px] bg-transparent text-sm font-sans focus:outline-none placeholder:text-neutral-300"
              />
            </div>
            <p className="text-[10px] text-neutral-400 mt-1">Press Enter to add each tag · Click × to remove</p>
          </Field>
        </Section>

        {/* ── 2. Status & Visibility ── */}
        <Section title="Status & Visibility" icon={ToggleRight}>
          <div className="flex flex-col sm:flex-row gap-5">
            {/* Status */}
            <Field label="Listing Status">
              <div className="relative">
                <select
                  value={form.status}
                  onChange={e => setField('status', e.target.value as PropertyStatus)}
                  className={`${INPUT_CLASS} pr-10 appearance-none cursor-pointer`}
                >
                  <option value="available">Available</option>
                  <option value="booked">Booked</option>
                  <option value="sold">Sold</option>
                </select>
                <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </Field>

            {/* Published toggle */}
            <div className="flex-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                Publication State
              </label>
              <button
                type="button"
                onClick={() => { setField('is_published', !form.is_published); }}
                className={`flex items-center gap-3 px-5 py-3 rounded-xl border-2 transition-all cursor-pointer w-full ${form.is_published
                    ? 'bg-brand-green/5 border-brand-green text-brand-green'
                    : 'bg-neutral-50 border-neutral-200 text-neutral-500'
                  }`}
              >
                {form.is_published
                  ? <ToggleRight className="w-5 h-5 shrink-0" />
                  : <ToggleLeft className="w-5 h-5 shrink-0" />}
                <div className="text-left">
                  <p className="text-sm font-bold">{form.is_published ? 'Published' : 'Draft'}</p>
                  <p className="text-[10px] opacity-70">
                    {form.is_published ? 'Visible on the public map' : 'Hidden from public — admin only'}
                  </p>
                </div>
              </button>
            </div>
          </div>
        </Section>

        {/* ── 3. Location ── */}
        <Section title="Location" icon={FileText}>
          <div id="field-location">
            {errors.location && (
              <p className="text-[11px] text-rose-500 mb-3 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.location}
              </p>
            )}
            <PropertyFormMap
              lat={form.latitude}
              lng={form.longitude}
              onCoordinateChange={(lat, lng) => {
                setForm(prev => ({ ...prev, latitude: lat, longitude: lng }));
                markDirty();
                if (errors.location) setErrors(prev => { const e = { ...prev }; delete e['location']; return e; });
              }}
            />
          </div>

          {/* Out-of-bounds warning */}
          {outOfBoundsWarning && (
            <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 font-medium">
                This location is outside the Ooty coverage area — please confirm this is correct before saving.
              </p>
            </div>
          )}

          {/* Manual lat/lng inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Latitude">
              <input
                type="number"
                step="0.000001"
                value={form.latitude ?? ''}
                onChange={e => {
                  const v = parseFloat(e.target.value);
                  setForm(prev => ({ ...prev, latitude: isNaN(v) ? null : v }));
                  markDirty();
                }}
                placeholder="11.4111"
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="Longitude">
              <input
                type="number"
                step="0.000001"
                value={form.longitude ?? ''}
                onChange={e => {
                  const v = parseFloat(e.target.value);
                  setForm(prev => ({ ...prev, longitude: isNaN(v) ? null : v }));
                  markDirty();
                }}
                placeholder="76.6907"
                className={INPUT_CLASS}
              />
            </Field>
          </div>
        </Section>

        {/* ── 4. Images ── */}
        <Section title="Images" icon={ImageIcon}>
          <div id="field-images">
            {errors.images && (
              <p className="text-[11px] text-rose-500 mb-3 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.images}
              </p>
            )}

            {/* Drop zone */}
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={handleImgDropZone}
              onClick={() => imgInputRef.current?.click()}
              className="border-2 border-dashed border-neutral-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-brand-green/40 hover:bg-brand-green/2 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-neutral-100 group-hover:bg-brand-green/10 flex items-center justify-center transition-colors">
                <Upload className="w-5 h-5 text-neutral-400 group-hover:text-brand-green transition-colors" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-neutral-600 group-hover:text-brand-green transition-colors">Drop images here or click to browse</p>
                <p className="text-xs text-neutral-400 mt-0.5">JPEG, PNG, WEBP · Multiple files allowed</p>
              </div>
              <input ref={imgInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleImgInputChange} />
            </div>

            {/* Thumbnail grid */}
            {imageItems.length > 0 && (
              <>
                <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                  Drag thumbnails to reorder · First image is the hero photo
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {imageItems.map((item, idx) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={() => handleImgDragStart(idx)}
                      onDragOver={e => handleImgDragOver(e, idx)}
                      onDragLeave={handleImgDragLeave}
                      onDrop={e => handleImgReorderDrop(e, idx)}
                      className={`relative group rounded-xl overflow-hidden aspect-square cursor-grab border-2 transition-all ${dragOverIdx === idx ? 'border-brand-green scale-105 shadow-lg' : 'border-transparent'
                        }`}
                    >
                      <img src={item.preview} alt="" className="w-full h-full object-cover" />
                      {idx === 0 && (
                        <div className="absolute top-1.5 left-1.5 bg-brand-green text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded-md shadow">
                          Hero
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
                      <button
                        onClick={e => { e.stopPropagation(); removeImage(item.id); }}
                        className="absolute top-1.5 right-1.5 w-6 h-6 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-50 cursor-pointer"
                      >
                        <X className="w-3 h-3 text-rose-500" />
                      </button>
                      <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="w-4 h-4 text-white drop-shadow-md" />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </Section>

        {/* ── 5. YouTube Video ── */}
        <Section title="Video (YouTube)" icon={Youtube}>
          <Field label="YouTube URL or Video ID">
            <input
              type="text"
              value={form.videoUrl}
              onChange={e => setField('videoUrl', e.target.value)}
              placeholder="https://www.youtube.com/watch?v=xxxxxx or youtu.be/xxxxxx"
              className={INPUT_CLASS}
            />
          </Field>
          {ytId && (
            <div className="flex items-start gap-4 p-3 bg-neutral-50 rounded-xl border border-neutral-100">
              <img
                src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
                alt="YouTube thumbnail"
                className="w-32 h-20 rounded-lg object-cover border border-neutral-200 shrink-0"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold text-brand-charcoal">Video Resolved</p>
                <p className="text-[11px] text-neutral-400 font-mono break-all">ID: {ytId}</p>
                <a
                  href={`https://www.youtube.com/watch?v=${ytId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-brand-green font-semibold hover:underline flex items-center gap-1"
                >
                  Open on YouTube ↗
                </a>
              </div>
            </div>
          )}
          {form.videoUrl && !ytId && (
            <p className="text-[11px] text-amber-600 flex items-center gap-1 font-medium">
              <AlertTriangle className="w-3.5 h-3.5" /> Could not extract a YouTube video ID from this URL.
            </p>
          )}
        </Section>

        {/* ── 6. Documents ── */}
        <Section title="Documents" icon={FileText}>
          {/* Drop zone */}
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={handleDocDropZone}
            onClick={() => docInputRef.current?.click()}
            className="border-2 border-dashed border-neutral-200 rounded-2xl p-6 flex flex-col items-center gap-2 cursor-pointer hover:border-brand-green/40 hover:bg-brand-green/2 transition-all group"
          >
            <Upload className="w-5 h-5 text-neutral-400 group-hover:text-brand-green transition-colors" />
            <p className="text-sm font-semibold text-neutral-600 group-hover:text-brand-green transition-colors">Drop PDF files here or click to browse</p>
            <p className="text-xs text-neutral-400">PDF documents · Multiple allowed</p>
            <input ref={docInputRef} type="file" multiple accept=".pdf,application/pdf" className="hidden" onChange={handleDocInputChange} />
          </div>

          {/* Document list */}
          {docItems.length > 0 && (
            <div className="space-y-2">
              {docItems.map(doc => (
                <div key={doc.id} className="flex items-center gap-3 px-4 py-3 bg-neutral-50 rounded-xl border border-neutral-100">
                  <FileText className="w-4 h-4 text-neutral-400 shrink-0" />
                  <span className="flex-1 text-sm text-neutral-700 font-medium truncate">{doc.name}</span>

                  {/* Public/Private toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      setDocItems(prev => prev.map(d => d.id === doc.id ? { ...d, isPublic: !d.isPublic } : d));
                      markDirty();
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer shrink-0 ${doc.isPublic
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-neutral-100 text-neutral-500 border-neutral-200'
                      }`}
                  >
                    {doc.isPublic ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                    {doc.isPublic ? 'Public' : 'Private'}
                  </button>

                  <button
                    onClick={() => removeDoc(doc.id)}
                    className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                  >
                    <X className="w-3.5 h-3.5 text-rose-400" />
                  </button>
                </div>
              ))}
              <p className="text-[10px] text-neutral-400 px-1">
                <span className="text-emerald-600 font-bold">Public</span> docs are directly downloadable by visitors.{' '}
                <span className="font-bold">Private</span> docs show as "available on request" only.
              </p>
            </div>
          )}
        </Section>

        {/* ── Save Button ── */}
        <div className="flex items-center gap-3 pt-1 pb-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2.5 px-8 py-3.5 bg-brand-green hover:bg-brand-green/90 disabled:opacity-60 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-green/20 active:scale-98 transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /><span>Saving...</span></>
            ) : (
              <><span>{mode === 'create' ? 'Create Property' : 'Save Changes'}</span></>
            )}
          </button>
          <button
            onClick={handleCancel}
            disabled={saving}
            className="px-6 py-3.5 text-sm font-semibold text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* ── Discard Confirmation Modal ── */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-scaleUp">
            <h3 className="text-base font-display font-black text-brand-charcoal">Discard unsaved changes?</h3>
            <p className="text-sm text-neutral-500 mt-2">Your changes haven't been saved. They will be lost if you leave now.</p>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => { setShowDiscardConfirm(false); onCancel(); }}
                className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-bold transition-all cursor-pointer"
              >
                Discard
              </button>
              <button
                onClick={() => setShowDiscardConfirm(false)}
                className="flex-1 py-2.5 border border-neutral-200 rounded-xl text-sm font-semibold text-neutral-600 hover:bg-neutral-50 transition-all cursor-pointer"
              >
                Keep Editing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

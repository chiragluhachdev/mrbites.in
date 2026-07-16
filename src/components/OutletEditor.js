import React, { useState } from 'react';
import { restaurantAPI, financeAPI } from '../api';
import ImagePicker from './ImagePicker';
import { X, Loader, Eye, EyeOff, Trash2 } from 'lucide-react';

const inputClass =
  'w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';

const Field = ({ label, hint, children }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
    {children}
    {hint && <p className="text-[11px] text-gray-400 font-medium mt-1">{hint}</p>}
  </div>
);

/**
 * Admin editor for one outlet — every field, including the ones a vendor can't
 * set themselves (rating) and the ones they can (payout, passkey).
 */
const OutletEditor = ({ outlet, onClose, onSaved }) => {
  const [form, setForm] = useState({
    name: outlet.name || '',
    location: outlet.location || '',
    description: outlet.description || '',
    waitTime: String(outlet.waitTime ?? 0),
    rating: String(outlet.rating ?? 4.5),
    ratingEnabled: outlet.ratingEnabled !== false,
    posEnabled: outlet.posEnabled === true,
    contactName: outlet.contactName || '',
    contactPhone: outlet.contactPhone || '',
    contactEmail: outlet.contactEmail || '',
  });
  const [payout, setPayout] = useState({
    accountHolder: outlet.payout?.accountHolder || '',
    bankName: outlet.payout?.bankName || '',
    ifsc: outlet.payout?.ifsc || '',
    pan: outlet.payout?.pan || '',
    accountNumber: '',
  });
  const [last4, setLast4] = useState('');
  const [passkey, setPasskey] = useState('');
  const [showPasskey, setShowPasskey] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(outlet.image || '');
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(outlet.bannerImage || outlet.image || '');
  const [hasOwnBanner, setHasOwnBanner] = useState(!!outlet.bannerImage);
  // Set when the admin resets the banner; applied on save.
  const [clearBanner, setClearBanner] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  // The account number is never returned in full; fetch its last four so the
  // admin can tell whether one is on file.
  React.useEffect(() => {
    (async () => {
      try {
        const res = await financeAPI.vendor({ restaurantId: outlet._id });
        setLast4(res.outlet?.payout?.accountNumberLast4 || '');
      } catch {
        /* not fatal — the field just shows as empty */
      }
    })();
  }, [outlet._id]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.location.trim()) {
      setError('Name and location are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const [card, banner] = await Promise.all([
        imageFile ? restaurantAPI.uploadImage(imageFile) : null,
        bannerFile ? restaurantAPI.uploadImage(bannerFile) : null,
      ]);

      const { accountNumber, ...payoutRest } = payout;
      const updates = {
        ...form,
        waitTime: Number(form.waitTime) || 0,
        rating: Number(form.rating) || 0,
        ratingEnabled: form.ratingEnabled,
        posEnabled: form.posEnabled,
        image: card ? card.url : outlet.image,
        // Blank means "keep the stored number" — sending '' would erase it.
        payout: accountNumber.trim() ? { ...payoutRest, accountNumber: accountNumber.trim() } : payoutRest,
      };
      if (banner) updates.bannerImage = banner.url;
      else if (clearBanner) updates.bannerImage = '';
      if (passkey.trim()) updates.vendorPasskey = passkey.trim();

      await restaurantAPI.updateRestaurant(outlet._id, updates);
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Could not save this outlet.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const typed = window.prompt(
      `Deleting "${outlet.name}" also deletes its entire menu. This cannot be undone.\n\n` +
        `Type the outlet name to confirm:`
    );
    if (typed === null) return;
    if (typed.trim() !== outlet.name) {
      setError('That name did not match — nothing was deleted.');
      return;
    }
    setDeleting(true);
    setError('');
    try {
      await restaurantAPI.deleteRestaurant(outlet._id);
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Could not delete this outlet.');
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Edit outlet</h3>
            <p className="text-xs text-gray-500 font-medium mt-0.5">{outlet.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm font-semibold">
              {error}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <label className="block text-xs font-semibold text-gray-600">Menu banner</label>
              {hasOwnBanner && (
                <button
                  type="button"
                  onClick={() => {
                    setBannerFile(null);
                    setBannerPreview(imagePreview);
                    setHasOwnBanner(false);
                    setClearBanner(true);
                  }}
                  className="text-[11px] font-bold text-gray-400 hover:text-red-600 transition-colors"
                >
                  Reset to card photo
                </button>
              )}
            </div>
            <ImagePicker
              value={bannerPreview}
              aspect="banner"
              label="Add a banner"
              hint={hasOwnBanner ? 'Wide header on the menu screen.' : 'Falling back to the card photo.'}
              onPick={(file, preview) => {
                setBannerFile(file);
                setBannerPreview(preview);
                setHasOwnBanner(true);
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Card photo</label>
            <ImagePicker
              value={imagePreview}
              aspect="square"
              label="Add a photo"
              hint="Shown in the outlet list."
              onPick={(file, preview) => {
                setImageFile(file);
                setImagePreview(preview);
                if (!hasOwnBanner) setBannerPreview(preview);
              }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Name">
              <input value={form.name} onChange={(e) => set({ name: e.target.value })} required className={inputClass} />
            </Field>
            <Field label="Location">
              <input value={form.location} onChange={(e) => set({ location: e.target.value })} required className={inputClass} />
            </Field>
          </div>

          <Field label="Description">
            <textarea rows="2" value={form.description} onChange={(e) => set({ description: e.target.value })} className={inputClass} />
          </Field>

          <div className="grid grid-cols-2 gap-4 max-w-xs">
            <Field label="Wait (min)">
              <input type="number" min="0" value={form.waitTime} onChange={(e) => set({ waitTime: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Rating" hint="Admin only.">
              <input type="number" step="0.1" min="0" max="5" value={form.rating} onChange={(e) => set({ rating: e.target.value })} className={inputClass} />
            </Field>
          </div>

          <label className="flex items-center justify-between gap-4 py-2">
            <div>
              <p className="text-sm font-semibold text-gray-800">Show this outlet's rating</p>
              <p className="text-xs text-gray-400 font-medium">Hide it for just this outlet without changing the number.</p>
            </div>
            <button
              type="button"
              onClick={() => set({ ratingEnabled: !form.ratingEnabled })}
              className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${form.ratingEnabled ? 'bg-brand-600' : 'bg-gray-300'}`}
              aria-pressed={form.ratingEnabled}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.ratingEnabled ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
            </button>
          </label>

          <label className="flex items-center justify-between gap-4 py-2 border-t border-gray-100 pt-3">
            <div>
              <p className="text-sm font-semibold text-gray-800">POS enabled</p>
              <p className="text-xs text-gray-400 font-medium">
                Gives this outlet the in-house counter POS for walk-in sales. Off for everyone by default.
              </p>
            </div>
            <button
              type="button"
              onClick={() => set({ posEnabled: !form.posEnabled })}
              className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${form.posEnabled ? 'bg-brand-600' : 'bg-gray-300'}`}
              aria-pressed={form.posEnabled}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.posEnabled ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
            </button>
          </label>

          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Contact</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Owner">
                <input value={form.contactName} onChange={(e) => set({ contactName: e.target.value })} className={inputClass} />
              </Field>
              <Field label="Phone">
                <input value={form.contactPhone} onChange={(e) => set({ contactPhone: e.target.value })} className={inputClass} />
              </Field>
              <Field label="Email">
                <input type="email" value={form.contactEmail} onChange={(e) => set({ contactEmail: e.target.value })} className={inputClass} />
              </Field>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Payout account</p>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Account holder">
                  <input value={payout.accountHolder} onChange={(e) => setPayout({ ...payout, accountHolder: e.target.value })} className={inputClass} />
                </Field>
                <Field label="Bank">
                  <input value={payout.bankName} onChange={(e) => setPayout({ ...payout, bankName: e.target.value })} className={inputClass} />
                </Field>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="IFSC">
                  <input value={payout.ifsc} onChange={(e) => setPayout({ ...payout, ifsc: e.target.value.toUpperCase() })} className={inputClass} />
                </Field>
                <Field label="PAN">
                  <input value={payout.pan} onChange={(e) => setPayout({ ...payout, pan: e.target.value.toUpperCase() })} className={inputClass} />
                </Field>
                <Field label="Account number" hint={last4 ? `Ends ${last4}. Blank keeps it.` : 'Not set.'}>
                  <input
                    value={payout.accountNumber}
                    onChange={(e) => setPayout({ ...payout, accountNumber: e.target.value })}
                    placeholder={last4 ? `•••• ${last4}` : 'Enter number'}
                    className={inputClass}
                  />
                </Field>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <Field label="Vendor passkey" hint="Blank leaves the current passkey untouched.">
              <div className="relative max-w-sm">
                <input
                  type={showPasskey ? 'text' : 'password'}
                  value={passkey}
                  onChange={(e) => setPasskey(e.target.value)}
                  placeholder="Set a new passkey"
                  className={`${inputClass} pr-10`}
                />
                <button type="button" onClick={() => setShowPasskey(!showPasskey)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                  {showPasskey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>
          </div>
        </form>

        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between gap-3">
          <button
            onClick={handleDelete}
            disabled={deleting || saving}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60"
          >
            {deleting ? <Loader size={15} className="animate-spin" /> : <Trash2 size={15} />}
            Delete outlet
          </button>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || deleting}
              className="px-4 py-2.5 rounded-lg text-sm font-bold bg-brand-600 text-white hover:bg-brand-700 transition-colors disabled:opacity-70 flex items-center gap-2"
            >
              {saving ? <><Loader size={15} className="animate-spin" /> Saving</> : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutletEditor;

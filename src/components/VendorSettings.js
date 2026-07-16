import React, { useState, useEffect, useCallback } from 'react';
import { restaurantAPI, financeAPI } from '../api';
import ImagePicker from './ImagePicker';
import { Loader, Store, Landmark, KeyRound, Eye, EyeOff, Check, Image as ImageIcon } from 'lucide-react';

const Section = ({ icon: Icon, title, description, children }) => (
  <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-6">
    <div className="px-5 py-4 border-b border-gray-200 flex items-start gap-3">
      <div className="w-9 h-9 rounded-lg bg-gray-50 text-gray-500 flex items-center justify-center shrink-0">
        <Icon size={16} />
      </div>
      <div>
        <h2 className="font-bold text-gray-900">{title}</h2>
        {description && <p className="text-xs text-gray-500 font-medium mt-0.5">{description}</p>}
      </div>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const Field = ({ label, hint, children }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
    {children}
    {hint && <p className="text-[11px] text-gray-400 font-medium mt-1">{hint}</p>}
  </div>
);

const inputClass =
  'w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';

/** A vendor manages their own outlet here. The API rejects edits to any other. */
const VendorSettings = () => {
  const [restaurantId, setRestaurantId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const [saved, setSaved] = useState('');
  const [error, setError] = useState('');

  const [outlet, setOutlet] = useState({
    name: '',
    location: '',
    description: '',
    waitTime: '',
    isOpen: true,
  });
  const [payout, setPayout] = useState({ accountHolder: '', bankName: '', ifsc: '', pan: '', accountNumber: '' });
  const [last4, setLast4] = useState('');
  const [passkey, setPasskey] = useState('');
  const [showPasskey, setShowPasskey] = useState(false);

  // Preview holds either the stored URL or a local blob until it's uploaded.
  const [cardPreview, setCardPreview] = useState('');
  const [cardFile, setCardFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState('');
  const [bannerFile, setBannerFile] = useState(null);
  const [hasOwnBanner, setHasOwnBanner] = useState(false);

  const flash = (key) => {
    setSaved(key);
    setTimeout(() => setSaved(''), 2500);
  };

  const load = useCallback(async () => {
    const vendor = JSON.parse(localStorage.getItem('vendor') || '{}');
    if (!vendor.restaurantId) {
      setError('No outlet is attached to this session. Try signing in again.');
      setLoading(false);
      return;
    }
    setRestaurantId(vendor.restaurantId);
    try {
      const [details, finance] = await Promise.all([
        restaurantAPI.getDetails(vendor.restaurantId),
        financeAPI.vendor(),
      ]);
      const r = details.restaurant;
      setOutlet({
        name: r.name || '',
        location: r.location || '',
        description: r.description || '',
        waitTime: String(r.waitTime ?? ''),
        isOpen: r.isOpen !== false,
      });
      setCardPreview(r.image || '');
      // Show the card image as the banner's stand-in when none is set, since
      // that is exactly what students currently see.
      setHasOwnBanner(!!r.bannerImage);
      setBannerPreview(r.bannerImage || r.image || '');
      const p = finance.outlet?.payout || {};
      setPayout({ accountHolder: p.accountHolder || '', bankName: p.bankName || '', ifsc: p.ifsc || '', pan: p.pan || '', accountNumber: '' });
      setLast4(p.accountNumberLast4 || '');
    } catch (err) {
      console.error('Settings load failed', err);
      setError('Could not load your outlet.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (key, updates) => {
    setSaving(key);
    setError('');
    try {
      await restaurantAPI.updateRestaurant(restaurantId, updates);
      flash(key);
      return true;
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Could not save. Please try again.');
      return false;
    } finally {
      setSaving('');
    }
  };

  const saveOutlet = (e) => {
    e.preventDefault();
    save('outlet', {
      name: outlet.name.trim(),
      location: outlet.location.trim(),
      description: outlet.description.trim(),
      waitTime: Number(outlet.waitTime) || 0,
    });
  };

  const saveImages = async (e) => {
    e.preventDefault();
    if (!cardFile && !bannerFile) return;
    setSaving('images');
    setError('');
    try {
      // Upload only what changed, then persist both URLs in one write.
      const [card, banner] = await Promise.all([
        cardFile ? restaurantAPI.uploadImage(cardFile) : null,
        bannerFile ? restaurantAPI.uploadImage(bannerFile) : null,
      ]);
      const updates = {};
      if (card) updates.image = card.url;
      if (banner) updates.bannerImage = banner.url;

      await restaurantAPI.updateRestaurant(restaurantId, updates);
      if (banner) setHasOwnBanner(true);
      setCardFile(null);
      setBannerFile(null);
      flash('images');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Could not upload. Please try again.');
    } finally {
      setSaving('');
    }
  };

  const resetBanner = async () => {
    if (await save('images', { bannerImage: '' })) {
      setHasOwnBanner(false);
      setBannerFile(null);
      setBannerPreview(cardPreview);
    }
  };

  const savePayout = async (e) => {
    e.preventDefault();
    // Blank means "leave the stored number alone" — we never receive it back, so
    // sending an empty string would wipe it.
    const { accountNumber, ...rest } = payout;
    const updates = { payout: accountNumber.trim() ? { ...rest, accountNumber: accountNumber.trim() } : rest };
    if (await save('payout', updates)) {
      if (accountNumber.trim()) setLast4(accountNumber.trim().slice(-4));
      setPayout((p) => ({ ...p, accountNumber: '' }));
    }
  };

  const savePasskey = async (e) => {
    e.preventDefault();
    if (!passkey.trim()) return;
    if (await save('passkey', { vendorPasskey: passkey.trim() })) setPasskey('');
  };

  const toggleOpen = async () => {
    const next = !outlet.isOpen;
    setOutlet((o) => ({ ...o, isOpen: next }));
    const ok = await save('open', { isOpen: next });
    if (!ok) setOutlet((o) => ({ ...o, isOpen: !next }));
  };

  const SaveButton = ({ id, children = 'Save changes' }) => (
    <button
      type="submit"
      disabled={saving === id}
      className="px-4 py-2.5 rounded-lg text-sm font-bold bg-brand-600 text-white hover:bg-brand-700 transition-colors disabled:opacity-70 flex items-center gap-2"
    >
      {saving === id ? (
        <><Loader size={15} className="animate-spin" /> Saving</>
      ) : saved === id ? (
        <><Check size={15} /> Saved</>
      ) : (
        children
      )}
    </button>
  );

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader size={32} className="animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-sm text-gray-500 font-medium mt-0.5">Your outlet, payouts and sign-in</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm font-semibold mb-6">
          {error}
        </div>
      )}

      {/* Open / closed */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="font-bold text-gray-900">Accepting orders</p>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            {outlet.isOpen
              ? 'Students can order from you right now.'
              : 'Your menu is visible but nobody can order.'}
          </p>
        </div>
        <button
          onClick={toggleOpen}
          disabled={saving === 'open'}
          className={`relative w-14 h-7 rounded-full transition-colors shrink-0 disabled:opacity-60 ${
            outlet.isOpen ? 'bg-brand-600' : 'bg-gray-300'
          }`}
          aria-pressed={outlet.isOpen}
          aria-label="Toggle accepting orders"
        >
          <span
            className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
              outlet.isOpen ? 'translate-x-8' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      <Section
        icon={ImageIcon}
        title="Photos"
        description="The banner is wide and short; the card photo is square. Different shapes, so they're set separately."
      >
        <form onSubmit={saveImages} className="space-y-5">
          <div>
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <label className="block text-xs font-semibold text-gray-600">Menu banner</label>
              {hasOwnBanner && (
                <button
                  type="button"
                  onClick={resetBanner}
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
              hint={
                hasOwnBanner
                  ? 'Header of your menu page. A wide shot works best — the middle stays visible, the edges may crop.'
                  : 'Currently using your card photo. A wide shot made for this space will crop far better.'
              }
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
              value={cardPreview}
              aspect="square"
              label="Add a photo"
              hint="Shown on the outlet list students browse."
              onPick={(file, preview) => {
                setCardFile(file);
                setCardPreview(preview);
                if (!hasOwnBanner) setBannerPreview(preview);
              }}
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={saving === 'images' || (!cardFile && !bannerFile)}
              className="px-4 py-2.5 rounded-lg text-sm font-bold bg-brand-600 text-white hover:bg-brand-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving === 'images' ? (
                <><Loader size={15} className="animate-spin" /> Uploading</>
              ) : saved === 'images' ? (
                <><Check size={15} /> Saved</>
              ) : (
                'Upload photos'
              )}
            </button>
          </div>
        </form>
      </Section>

      <Section icon={Store} title="Outlet details" description="What students see on your menu page">
        <form onSubmit={saveOutlet} className="space-y-4">
          <Field label="Name">
            <input value={outlet.name} onChange={(e) => setOutlet({ ...outlet, name: e.target.value })} required className={inputClass} />
          </Field>
          <Field label="Location">
            <input value={outlet.location} onChange={(e) => setOutlet({ ...outlet, location: e.target.value })} required className={inputClass} />
          </Field>
          <Field label="Description">
            <textarea rows="2" value={outlet.description} onChange={(e) => setOutlet({ ...outlet, description: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Typical wait (minutes)" hint="Shown on your menu so students know when to collect.">
            <input type="number" min="0" value={outlet.waitTime} onChange={(e) => setOutlet({ ...outlet, waitTime: e.target.value })} className={`${inputClass} max-w-[140px]`} />
          </Field>
          <div className="flex justify-end pt-1">
            <SaveButton id="outlet" />
          </div>
        </form>
      </Section>

      <Section
        icon={Landmark}
        title="Payout bank account"
        description="Where an admin sends your earnings. MR-Bites deducts nothing."
      >
        <form onSubmit={savePayout} className="space-y-4">
          <Field label="Account holder">
            <input value={payout.accountHolder} onChange={(e) => setPayout({ ...payout, accountHolder: e.target.value })} className={inputClass} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Bank">
              <input value={payout.bankName} onChange={(e) => setPayout({ ...payout, bankName: e.target.value })} className={inputClass} />
            </Field>
            <Field label="IFSC">
              <input value={payout.ifsc} onChange={(e) => setPayout({ ...payout, ifsc: e.target.value.toUpperCase() })} className={inputClass} />
            </Field>
          </div>
          <Field
            label="Account number"
            hint={last4 ? `Currently ending ${last4}. Leave blank to keep it.` : 'Stored securely and never shown again in full.'}
          >
            <input
              value={payout.accountNumber}
              onChange={(e) => setPayout({ ...payout, accountNumber: e.target.value })}
              placeholder={last4 ? `•••• ${last4}` : 'Enter account number'}
              className={inputClass}
            />
          </Field>
          <Field label="PAN">
            <input value={payout.pan} onChange={(e) => setPayout({ ...payout, pan: e.target.value.toUpperCase() })} className={`${inputClass} max-w-[220px]`} />
          </Field>
          <div className="flex justify-end pt-1">
            <SaveButton id="payout" />
          </div>
        </form>
      </Section>

      <Section icon={KeyRound} title="Sign-in passkey" description="Used with your outlet ID to reach this dashboard">
        <form onSubmit={savePasskey} className="space-y-4">
          <Field label="New passkey" hint="Anyone with this can manage your outlet. Changing it signs out nobody — old sessions stay valid until they expire.">
            <div className="relative max-w-sm">
              <input
                type={showPasskey ? 'text' : 'password'}
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                placeholder="Enter a new passkey"
                className={`${inputClass} pr-10`}
              />
              <button type="button" onClick={() => setShowPasskey(!showPasskey)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                {showPasskey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>
          <div className="flex justify-end">
            <SaveButton id="passkey">Update passkey</SaveButton>
          </div>
        </form>
      </Section>

      <p className="text-xs text-gray-400 text-center font-medium">
        Outlet ID <span className="font-mono">{restaurantId}</span>
      </p>
    </div>
  );
};

export default VendorSettings;

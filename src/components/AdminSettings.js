import React, { useState, useEffect } from 'react';
import { settingsAPI } from '../api';
import { Loader, Power, Check, ShieldCheck, Info, Star } from 'lucide-react';

const inputClass =
  'w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';

/** Platform-wide settings. Deliberately small — most configuration lives on the outlet. */
const AdminSettings = () => {
  const [settings, setSettings] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const [saved, setSaved] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await settingsAPI.get();
        setSettings(res.settings);
        setMessage(res.settings.pausedMessage || '');
      } catch (err) {
        console.error(err);
        setError('Could not load platform settings.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const flash = (key) => {
    setSaved(key);
    setTimeout(() => setSaved(''), 2500);
  };

  const save = async (key, updates, optimistic) => {
    setSaving(key);
    setError('');
    const previous = settings;
    if (optimistic) setSettings((s) => ({ ...s, ...optimistic }));
    try {
      const res = await settingsAPI.update(updates);
      setSettings(res.settings);
      flash(key);
    } catch (err) {
      console.error(err);
      setSettings(previous);
      setError(err.response?.data?.message || 'Could not save.');
    } finally {
      setSaving('');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader size={32} className="animate-spin text-brand-600" />
      </div>
    );
  }

  const paused = settings && !settings.orderingEnabled;
  const ratingsOn = settings ? settings.ratingsEnabled !== false : true;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-sm text-gray-500 font-medium mt-0.5">Platform-wide controls</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm font-semibold mb-6">
          {error}
        </div>
      )}

      {/* Master switch */}
      <div
        className={`border rounded-xl shadow-sm p-5 mb-6 ${
          paused ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200'
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                paused ? 'bg-amber-100 text-amber-700' : 'bg-brand-50 text-brand-600'
              }`}
            >
              <Power size={16} />
            </div>
            <div>
              <p className="font-bold text-gray-900">
                {paused ? 'Ordering is paused' : 'Ordering is live'}
              </p>
              <p className="text-xs text-gray-600 font-medium mt-0.5 leading-relaxed max-w-md">
                {paused
                  ? 'Every outlet reads as closed to students, whatever each vendor has set. Their own open/closed switches are untouched and come back exactly as they were.'
                  : 'Students can order from any outlet that is currently open. Pause this during exams, holidays or an incident.'}
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              save('ordering', { orderingEnabled: paused }, { orderingEnabled: paused })
            }
            disabled={saving === 'ordering'}
            className={`relative w-14 h-7 rounded-full transition-colors shrink-0 disabled:opacity-60 ${
              paused ? 'bg-gray-300' : 'bg-brand-600'
            }`}
            aria-pressed={!paused}
            aria-label="Toggle ordering"
          >
            <span
              className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                paused ? 'translate-x-1' : 'translate-x-8'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Global ratings switch */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Star size={16} />
            </div>
            <div>
              <p className="font-bold text-gray-900">
                {ratingsOn ? 'Ratings are shown' : 'Ratings are hidden'}
              </p>
              <p className="text-xs text-gray-600 font-medium mt-0.5 leading-relaxed max-w-md">
                {ratingsOn
                  ? 'Every outlet shows its star rating to students, unless a specific outlet has its own rating turned off.'
                  : 'No outlet shows a rating, whatever each outlet has set. Turn this back on to restore them.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => save('ratings', { ratingsEnabled: !ratingsOn }, { ratingsEnabled: !ratingsOn })}
            disabled={saving === 'ratings'}
            className={`relative w-14 h-7 rounded-full transition-colors shrink-0 disabled:opacity-60 ${
              ratingsOn ? 'bg-brand-600' : 'bg-gray-300'
            }`}
            aria-pressed={ratingsOn}
            aria-label="Toggle ratings"
          >
            <span
              className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                ratingsOn ? 'translate-x-8' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Paused message */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 className="font-bold text-gray-900">Pause message</h2>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            What students are told while ordering is paused.
          </p>
        </div>
        <form
          className="p-5 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            save('message', { pausedMessage: message });
          }}
        >
          <textarea
            rows="2"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className={inputClass}
            placeholder="Ordering is paused right now. Please check back later."
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving === 'message'}
              className="px-4 py-2.5 rounded-lg text-sm font-bold bg-brand-600 text-white hover:bg-brand-700 transition-colors disabled:opacity-70 flex items-center gap-2"
            >
              {saving === 'message' ? (
                <><Loader size={15} className="animate-spin" /> Saving</>
              ) : saved === 'message' ? (
                <><Check size={15} /> Saved</>
              ) : (
                'Save message'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Facts, not controls */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-2">
          <Info size={15} className="text-gray-400" />
          <h2 className="font-bold text-gray-900">How MR-Bites is configured</h2>
        </div>
        <dl className="divide-y divide-gray-100">
          {[
            ['Commission', 'None — MR-Bites keeps nothing from any order'],
            ['Student charges', 'None — students pay the menu price, with no tax or platform fee'],
            ['Payments', 'Prepaid online only; an order exists only once its payment verifies'],
            ['Vendor payouts', 'Manual bank transfers, recorded in Finance'],
          ].map(([label, value]) => (
            <div key={label} className="px-5 py-3 flex items-start justify-between gap-6">
              <dt className="text-sm text-gray-500 font-medium shrink-0">{label}</dt>
              <dd className="text-sm font-semibold text-gray-900 text-right">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="flex items-start gap-2.5 mt-6 px-1">
        <ShieldCheck size={15} className="text-gray-400 shrink-0 mt-0.5" />
        <p className="text-xs text-gray-400 font-medium leading-relaxed">
          The admin passkey is stored as a hash in the server environment, not in the database, so it can't be
          changed from here. Rotate it by updating <span className="font-mono">ADMIN_PASSKEY_HASH</span> in the
          backend and restarting.
        </p>
      </div>
    </div>
  );
};

export default AdminSettings;

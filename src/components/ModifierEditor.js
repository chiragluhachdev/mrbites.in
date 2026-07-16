import React, { useState } from 'react';
import { restaurantAPI } from '../api';

const COLORS = {
  primary: '#056548',
  primaryLight: 'rgba(5, 101, 72, 0.1)',
  surface: '#FFFFFF',
  background: '#F9FAFB',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  danger: '#DC2626',
  dangerLight: '#FEF2F2',
};

const emptyOption = () => ({ name: '', priceDiff: 0, isDefault: false, available: true });
const emptyGroup = () => ({
  name: '',
  description: '',
  type: 'single',
  required: false,
  min: 0,
  max: 1,
  active: true,
  options: [emptyOption()],
});

/**
 * Edits the modifier groups attached to one menu item. Groups are what the
 * customer sees as a customization sheet — "Size", "Add-ons", "Spice level".
 */
const ModifierEditor = ({ item, onClose, onSaved }) => {
  const [groups, setGroups] = useState(() =>
    (item.modifiers || []).map((g) => ({
      ...g,
      options: (g.options || []).map((o) => ({ ...o })),
    }))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const itemId = item.id || item._id;

  const patchGroup = (gi, patch) =>
    setGroups((prev) => prev.map((g, i) => (i === gi ? { ...g, ...patch } : g)));

  const patchOption = (gi, oi, patch) =>
    setGroups((prev) =>
      prev.map((g, i) =>
        i !== gi ? g : { ...g, options: g.options.map((o, j) => (j === oi ? { ...o, ...patch } : o)) }
      )
    );

  // A single-choice group can only have one default, so picking one clears the rest.
  const setDefault = (gi, oi, checked) =>
    setGroups((prev) =>
      prev.map((g, i) => {
        if (i !== gi) return g;
        if (g.type === 'single' && checked) {
          return { ...g, options: g.options.map((o, j) => ({ ...o, isDefault: j === oi })) };
        }
        return { ...g, options: g.options.map((o, j) => (j === oi ? { ...o, isDefault: checked } : o)) };
      })
    );

  const addGroup = () => setGroups((prev) => [...prev, emptyGroup()]);
  const removeGroup = (gi) => setGroups((prev) => prev.filter((_, i) => i !== gi));
  const addOption = (gi) =>
    setGroups((prev) => prev.map((g, i) => (i === gi ? { ...g, options: [...g.options, emptyOption()] } : g)));
  const removeOption = (gi, oi) =>
    setGroups((prev) =>
      prev.map((g, i) => (i !== gi ? g : { ...g, options: g.options.filter((_, j) => j !== oi) }))
    );

  const validate = () => {
    for (const g of groups) {
      if (!g.name.trim()) return 'Every group needs a name.';
      const named = g.options.filter((o) => o.name.trim());
      if (named.length === 0) return `"${g.name}" needs at least one option.`;
      if (g.type === 'multi' && Number(g.max) > 0 && Number(g.min) > Number(g.max)) {
        return `"${g.name}": minimum cannot exceed maximum.`;
      }
      if (g.type === 'multi' && Number(g.max) > named.length) {
        return `"${g.name}": maximum is higher than the number of options.`;
      }
    }
    return '';
  };

  const handleSave = async () => {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setError('');
    setSaving(true);
    try {
      // Drop blank option rows and normalise numbers before they hit the API.
      const payload = groups.map((g) => ({
        ...g,
        min: g.type === 'single' ? (g.required ? 1 : 0) : Number(g.min) || 0,
        max: g.type === 'single' ? 1 : Number(g.max) || 0,
        options: g.options
          .filter((o) => o.name.trim())
          .map((o) => ({ ...o, name: o.name.trim(), priceDiff: Number(o.priceDiff) || 0 })),
      }));
      await restaurantAPI.updateMenuItem(itemId, { modifiers: payload });
      onSaved && onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Could not save options.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div style={styles.backdrop} onClick={onClose} />
      <div style={styles.drawer}>
        <div style={styles.header}>
          <div>
            <h3 style={styles.title}>Customization Options</h3>
            <p style={styles.subtitle}>{item.name}</p>
          </div>
          <button onClick={onClose} style={styles.iconBtn}>✕</button>
        </div>

        <div style={styles.body} className="custom-scroll">
          {groups.length === 0 && (
            <div style={styles.empty}>
              <p style={{ margin: '0 0 4px', fontWeight: 600, color: COLORS.textPrimary }}>No options yet</p>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>
                Add a group like “Size” or “Add-ons” and customers will be asked to choose before adding this
                dish to their cart.
              </p>
            </div>
          )}

          {groups.map((g, gi) => (
            <div key={gi} style={styles.groupCard}>
              <div style={styles.groupHead}>
                <input
                  className="form-input"
                  style={{ ...styles.input, fontWeight: 600 }}
                  placeholder="Group name (e.g. Size)"
                  value={g.name}
                  onChange={(e) => patchGroup(gi, { name: e.target.value })}
                />
                <button onClick={() => removeGroup(gi)} style={styles.removeGroupBtn} title="Remove group">
                  ✕
                </button>
              </div>

              <div style={styles.row}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Choice</label>
                  <select
                    className="form-input"
                    style={styles.input}
                    value={g.type}
                    onChange={(e) =>
                      patchGroup(gi, {
                        type: e.target.value,
                        max: e.target.value === 'single' ? 1 : g.options.length,
                      })
                    }
                  >
                    <option value="single">Pick one</option>
                    <option value="multi">Pick many</option>
                  </select>
                </div>

                {g.type === 'multi' && (
                  <>
                    <div style={{ width: 80 }}>
                      <label style={styles.label}>Min</label>
                      <input
                        type="number"
                        min="0"
                        className="form-input"
                        style={styles.input}
                        value={g.min}
                        onChange={(e) => patchGroup(gi, { min: e.target.value })}
                      />
                    </div>
                    <div style={{ width: 80 }}>
                      <label style={styles.label}>Max</label>
                      <input
                        type="number"
                        min="0"
                        className="form-input"
                        style={styles.input}
                        value={g.max}
                        onChange={(e) => patchGroup(gi, { max: e.target.value })}
                      />
                    </div>
                  </>
                )}
              </div>

              <label style={styles.checkRow}>
                <input
                  type="checkbox"
                  checked={g.required}
                  onChange={(e) => patchGroup(gi, { required: e.target.checked })}
                />
                <span>Required — customer must choose before adding</span>
              </label>

              <div style={styles.optionsWrap}>
                <label style={styles.label}>Options</label>
                {g.options.map((o, oi) => (
                  <div key={oi} style={styles.optionRow}>
                    <input
                      className="form-input"
                      style={{ ...styles.input, flex: 1 }}
                      placeholder="Option name"
                      value={o.name}
                      onChange={(e) => patchOption(gi, oi, { name: e.target.value })}
                    />
                    <div style={styles.priceWrap}>
                      <span style={styles.pricePrefix}>₹</span>
                      <input
                        type="number"
                        className="form-input"
                        style={{ ...styles.input, width: 72, paddingLeft: 22 }}
                        placeholder="0"
                        value={o.priceDiff}
                        onChange={(e) => patchOption(gi, oi, { priceDiff: e.target.value })}
                      />
                    </div>
                    <label style={styles.miniCheck} title="Preselected by default">
                      <input
                        type="checkbox"
                        checked={!!o.isDefault}
                        onChange={(e) => setDefault(gi, oi, e.target.checked)}
                      />
                      <span>Default</span>
                    </label>
                    <label style={styles.miniCheck} title="Uncheck if sold out">
                      <input
                        type="checkbox"
                        checked={o.available !== false}
                        onChange={(e) => patchOption(gi, oi, { available: e.target.checked })}
                      />
                      <span>In stock</span>
                    </label>
                    <button
                      onClick={() => removeOption(gi, oi)}
                      style={styles.removeOptionBtn}
                      disabled={g.options.length === 1}
                      title="Remove option"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button onClick={() => addOption(gi)} style={styles.addOptionBtn}>+ Add option</button>
              </div>
            </div>
          ))}

          <button onClick={addGroup} style={styles.addGroupBtn}>+ Add option group</button>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.footer}>
          <button onClick={onClose} style={styles.cancelBtn}>Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ ...styles.saveBtn, opacity: saving ? 0.7 : 1 }}
            className="btn-primary"
          >
            {saving ? 'Saving...' : 'Save options'}
          </button>
        </div>
      </div>
    </>
  );
};

const styles = {
  backdrop: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 10000 },
  drawer: {
    position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: '560px',
    backgroundColor: COLORS.surface, boxShadow: '-4px 0 15px rgba(0,0,0,0.08)',
    zIndex: 10001, display: 'flex', flexDirection: 'column',
    animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  header: {
    padding: '1.25rem 1.5rem', borderBottom: `1px solid ${COLORS.border}`,
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  title: { margin: 0, fontSize: '1.15rem', fontWeight: 700, color: COLORS.textPrimary },
  subtitle: { margin: '2px 0 0', fontSize: '0.85rem', color: COLORS.textSecondary },
  iconBtn: {
    background: 'transparent', border: 'none', cursor: 'pointer', color: COLORS.textSecondary,
    padding: 6, borderRadius: 8, fontSize: '1rem', lineHeight: 1,
  },
  body: { flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', backgroundColor: COLORS.background },
  empty: {
    padding: '2rem 1.5rem', textAlign: 'center', color: COLORS.textSecondary,
    backgroundColor: COLORS.surface, border: `1px dashed ${COLORS.border}`, borderRadius: 12, marginBottom: 16,
  },
  groupCard: {
    backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}`,
    borderRadius: 12, padding: '1rem', marginBottom: '1rem',
  },
  groupHead: { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 },
  removeGroupBtn: {
    background: COLORS.dangerLight, color: COLORS.danger, border: 'none', cursor: 'pointer',
    width: 32, height: 32, borderRadius: 8, flexShrink: 0, fontSize: '0.8rem',
  },
  row: { display: 'flex', gap: 10, marginBottom: 12 },
  label: { display: 'block', fontSize: '0.75rem', fontWeight: 600, color: COLORS.textSecondary, marginBottom: 4 },
  input: {
    width: '100%', padding: '0.55rem 0.75rem', borderRadius: 8,
    border: `1px solid ${COLORS.border}`, fontSize: '0.875rem', color: COLORS.textPrimary,
    backgroundColor: COLORS.background, boxSizing: 'border-box',
  },
  checkRow: {
    display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem',
    color: COLORS.textPrimary, cursor: 'pointer', marginBottom: 12,
  },
  optionsWrap: { borderTop: `1px solid ${COLORS.border}`, paddingTop: 12 },
  optionRow: { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' },
  priceWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  pricePrefix: { position: 'absolute', left: 9, fontSize: '0.8rem', color: COLORS.textSecondary, zIndex: 1 },
  miniCheck: {
    display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem',
    color: COLORS.textSecondary, cursor: 'pointer', whiteSpace: 'nowrap',
  },
  removeOptionBtn: {
    background: 'transparent', color: COLORS.textSecondary, border: 'none',
    cursor: 'pointer', padding: 4, fontSize: '0.75rem',
  },
  addOptionBtn: {
    background: 'transparent', border: 'none', color: COLORS.primary,
    fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', padding: '6px 0',
  },
  addGroupBtn: {
    width: '100%', padding: '0.75rem', borderRadius: 10, border: `2px dashed ${COLORS.border}`,
    backgroundColor: COLORS.surface, color: COLORS.textSecondary, fontWeight: 600,
    fontSize: '0.875rem', cursor: 'pointer',
  },
  error: {
    padding: '0.75rem 1.5rem', backgroundColor: COLORS.dangerLight,
    color: COLORS.danger, fontSize: '0.8rem', fontWeight: 600,
  },
  footer: {
    padding: '1rem 1.5rem', borderTop: `1px solid ${COLORS.border}`,
    display: 'flex', gap: '1rem', backgroundColor: COLORS.background,
  },
  cancelBtn: {
    flex: 1, padding: '0.7rem', borderRadius: 8, border: `1px solid ${COLORS.border}`,
    backgroundColor: COLORS.surface, color: COLORS.textPrimary, fontWeight: 600,
    cursor: 'pointer', fontSize: '0.875rem',
  },
  saveBtn: {
    flex: 1, padding: '0.7rem', borderRadius: 8, border: 'none',
    fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem',
  },
};

export default ModifierEditor;

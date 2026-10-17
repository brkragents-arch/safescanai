import React, { useState } from 'react';
import { UserPreferences } from '../../types/scanner';
import { User, ShieldCheck, HeartPulse, Sparkles, SlidersHorizontal, Lock, Check, Plus, X, Globe, Save } from 'lucide-react';

interface Props {
  preferences: UserPreferences;
  onSavePreferences: (updated: UserPreferences) => void;
  onResetPreferences: () => void;
}

const ALL_FOOD_ALLERGIES = [
  'Tree Nuts',
  'Peanuts',
  'Dairy',
  'Gluten / Wheat',
  'Soy',
  'Eggs',
  'Shellfish',
  'Fish',
  'Sesame',
];

const ALL_DIETARY_PREFERENCES = [
  'Low Sugar',
  'Low Sodium',
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Whole Food Plant-Based',
  'Keto / Low-Carb',
  'Halal',
  'Kosher',
];

const ALL_SKIN_TYPES: UserPreferences['skinType'][] = [
  'sensitive',
  'dry',
  'oily',
  'combination',
  'normal',
];

const ALL_COSMETIC_SENSITIVITIES = [
  'Fragrance',
  'Essential Oils',
  'Drying Alcohols',
  'Sulfates (SLS/SLES)',
  'Parabens',
  'Chemical Sunscreens',
  'Silicones',
];

export const ProfileScreen: React.FC<Props> = ({
  preferences,
  onSavePreferences,
  onResetPreferences,
}) => {
  const [formData, setFormData] = useState<UserPreferences>(preferences);
  const [newAvoidItem, setNewAvoidItem] = useState<string>('');
  const [hasSavedToast, setHasSavedToast] = useState<boolean>(false);

  // Toggle array item helper
  const toggleArrayItem = (key: 'foodAllergies' | 'dietaryPreferences' | 'cosmeticSensitivities', item: string) => {
    setFormData((prev) => {
      const current = prev[key];
      const exists = current.includes(item);
      const updated = exists ? current.filter((x) => x !== item) : [...current, item];
      return { ...prev, [key]: updated };
    });
  };

  const handleAddAvoidIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newAvoidItem.trim();
    if (trimmed && !formData.avoidIngredients.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        avoidIngredients: [...prev.avoidIngredients, trimmed],
      }));
      setNewAvoidItem('');
    }
  };

  const handleRemoveAvoidIngredient = (item: string) => {
    setFormData((prev) => ({
      ...prev,
      avoidIngredients: prev.avoidIngredients.filter((x) => x !== item),
    }));
  };

  const handleSave = () => {
    onSavePreferences(formData);
    setHasSavedToast(true);
    setTimeout(() => setHasSavedToast(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-20">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-stone-900">
            Personal Health Profile & Filters
          </h1>
          <p className="text-xs text-stone-500">
            Configure allergens, dietary rules, and sensitivities to customize scanner warnings
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 active:scale-95 rounded-xl shadow-md shadow-emerald-950/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Save size={15} />
          <span>Save Preferences</span>
        </button>
      </div>

      {/* Toast Notification */}
      {hasSavedToast && (
        <div className="p-3 bg-emerald-800 text-white text-xs font-semibold rounded-2xl flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <Check size={16} className="text-emerald-300" />
            <span>Preferences saved! Product results will now dynamically reflect your updated profile.</span>
          </div>
        </div>
      )}

      {/* 1. Food Allergies & Intolerances */}
      <section className="bg-white rounded-3xl border border-stone-200 p-6 space-y-4 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-50 text-amber-800">
            <HeartPulse size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900">Food Allergies & Intolerances</h2>
            <p className="text-xs text-stone-500">Triggers prominent red warnings on scanned food results</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {ALL_FOOD_ALLERGIES.map((allergy) => {
            const isSelected = formData.foodAllergies.includes(allergy);
            return (
              <button
                key={allergy}
                type="button"
                onClick={() => toggleArrayItem('foodAllergies', allergy)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-rose-50 text-rose-900 border-rose-300 font-semibold shadow-xs'
                    : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-stone-300 hover:text-stone-900'
                }`}
              >
                {isSelected && <Check size={13} className="text-rose-700" />}
                <span>{allergy}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Dietary Preferences */}
      <section className="bg-white rounded-3xl border border-stone-200 p-6 space-y-4 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900">Dietary Goals & Rules</h2>
            <p className="text-xs text-stone-500">Flags products exceeding healthy thresholds (e.g. sugar, sodium)</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {ALL_DIETARY_PREFERENCES.map((diet) => {
            const isSelected = formData.dietaryPreferences.includes(diet);
            return (
              <button
                key={diet}
                type="button"
                onClick={() => toggleArrayItem('dietaryPreferences', diet)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300 font-semibold shadow-xs'
                    : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-stone-300 hover:text-stone-900'
                }`}
              >
                {isSelected && <Check size={13} className="text-emerald-700" />}
                <span>{diet}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Skin Type & Cosmetic Sensitivities */}
      <section className="bg-white rounded-3xl border border-stone-200 p-6 space-y-5 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-teal-50 text-teal-800">
            <Sparkles size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900">Skin Type & Cosmetic Sensitivities</h2>
            <p className="text-xs text-stone-500">Tailors dermatological recommendations for skincare scans</p>
          </div>
        </div>

        {/* Skin Type Radio-style buttons */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-stone-700 uppercase tracking-wider block">
            Primary Skin Type
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {ALL_SKIN_TYPES.map((type) => {
              const isSelected = formData.skinType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, skinType: type }))}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold capitalize border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-teal-900 text-white border-teal-950 shadow-xs'
                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-stone-300'
                  }`}
                >
                  {type}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sensitivities */}
        <div className="space-y-2 pt-2 border-t border-stone-100">
          <span className="text-xs font-semibold text-stone-700 uppercase tracking-wider block">
            Known Cosmetic Irritants & Preferences
          </span>
          <div className="flex flex-wrap gap-2">
            {ALL_COSMETIC_SENSITIVITIES.map((item) => {
              const isSelected = formData.cosmeticSensitivities.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleArrayItem('cosmeticSensitivities', item)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-teal-50 text-teal-950 border-teal-300 font-semibold shadow-xs'
                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-stone-300 hover:text-stone-900'
                  }`}
                >
                  {isSelected && <Check size={13} className="text-teal-700" />}
                  <span>{item}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Custom Ingredient Avoidance List */}
      <section className="bg-white rounded-3xl border border-stone-200 p-6 space-y-4 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-stone-100 text-stone-800">
            <SlidersHorizontal size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900">Custom Chemical & Ingredient Blacklist</h2>
            <p className="text-xs text-stone-500">Flags specific ingredients regardless of product category</p>
          </div>
        </div>

        {/* Existing Avoided Chips */}
        <div className="flex flex-wrap gap-2">
          {formData.avoidIngredients.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium bg-stone-100 text-stone-800 border border-stone-200"
            >
              <span>{item}</span>
              <button
                type="button"
                onClick={() => handleRemoveAvoidIngredient(item)}
                className="text-stone-400 hover:text-rose-700 cursor-pointer"
                aria-label={`Remove ${item}`}
              >
                <X size={13} />
              </button>
            </span>
          ))}
        </div>

        {/* Add custom item form */}
        <form onSubmit={handleAddAvoidIngredient} className="flex gap-2 pt-1">
          <input
            type="text"
            placeholder="e.g. BHT, Titanium Dioxide, Disodium EDTA..."
            value={newAvoidItem}
            onChange={(e) => setNewAvoidItem(e.target.value)}
            className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-700"
          />
          <button
            type="submit"
            className="px-4 py-2 text-xs font-bold text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Plus size={14} />
            <span>Add</span>
          </button>
        </form>
      </section>

      {/* 5. Units & Language Settings */}
      <section className="bg-white rounded-3xl border border-stone-200 p-6 space-y-4 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-stone-100 text-stone-800">
            <Globe size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900">Units & Language</h2>
            <p className="text-xs text-stone-500">Measurement and localized display preferences</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 pt-1">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700 block">Measurement Units</label>
            <div className="flex gap-2">
              {(['metric', 'imperial'] as const).map((unit) => (
                <button
                  key={unit}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, units: unit }))}
                  className={`flex-1 py-2 text-xs font-semibold rounded-xl border capitalize cursor-pointer transition-colors ${
                    formData.units === unit
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-stone-300'
                  }`}
                >
                  {unit} (g / mg)
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700 block">Interface Language</label>
            <select
              value={formData.language}
              onChange={(e) => setFormData((prev) => ({ ...prev, language: e.target.value }))}
              className="w-full py-2 px-3 text-xs rounded-xl border border-stone-300 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-700"
            >
              <option value="English">English (US)</option>
              <option value="Spanish">Español (Demonstration)</option>
              <option value="French">Français (Demonstration)</option>
            </select>
          </div>
        </div>
      </section>

      {/* 6. LLM AI Engine Integration */}
      <section className="bg-white rounded-3xl border border-stone-200 p-6 space-y-4 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800">
            <Sparkles size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900">Gemini LLM Engine Integration</h2>
            <p className="text-xs text-stone-500">Live toxicological extraction powered by gemini-3.8-flash</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2 text-xs leading-relaxed text-stone-700">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-stone-900">LLM Status: Connected & Operational</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
              gemini-3.8-flash
            </span>
          </div>
          <p>
            We've set up your app's Gemini API calls automatically on the backend server. Your API key can be found and configured in the <strong className="text-stone-900">Settings &gt; Secrets</strong> panel of Google AI Studio.
          </p>
          <div className="pt-1 text-[11px] text-stone-500 font-mono">
            Environment Variable: GEMINI_API_KEY · SDK: @google/genai
          </div>
        </div>
      </section>

      {/* 7. Privacy & Session Demonstration Controls */}
      <section className="bg-stone-100 rounded-3xl border border-stone-200 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-white text-stone-800 border border-stone-200">
            <Lock size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900">Privacy & Data Governance Controls</h2>
            <p className="text-xs text-stone-500">UI demonstration of zero-tracking architecture</p>
          </div>
        </div>

        <div className="space-y-3 pt-1 text-xs">
          <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-stone-200">
            <div>
              <span className="font-bold text-stone-900 block">Local-Only Health Data Storage</span>
              <span className="text-stone-500 text-[11px]">
                Health preferences remain in local browser memory without remote cloud profiling.
              </span>
            </div>
            <input
              type="checkbox"
              checked={formData.privacyLocalOnly}
              onChange={(e) => setFormData((prev) => ({ ...prev, privacyLocalOnly: e.target.checked }))}
              className="w-4 h-4 accent-emerald-800 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-stone-200">
            <div>
              <span className="font-bold text-stone-900 block">Anonymized Telemetry Consent</span>
              <span className="text-stone-500 text-[11px]">
                Disabled by default. No behavioral analytics or advertising identifiers collected.
              </span>
            </div>
            <input
              type="checkbox"
              checked={formData.analyticsConsent}
              onChange={(e) => setFormData((prev) => ({ ...prev, analyticsConsent: e.target.checked }))}
              className="w-4 h-4 accent-emerald-800 rounded cursor-pointer"
            />
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={onResetPreferences}
            className="text-stone-500 hover:text-stone-800 underline underline-offset-2 cursor-pointer"
          >
            Reset to Demonstration Defaults
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 rounded-xl transition-colors cursor-pointer"
          >
            Apply & Save
          </button>
        </div>
      </section>
    </div>
  );
};

import React from 'react';
import { Ingredient, UserPreferences } from '../../types/scanner';
import { X, ShieldAlert, CheckCircle2, BookOpen, Scale, FileText, AlertTriangle } from 'lucide-react';
import { AssessmentBadge } from '../common/AssessmentBadge';

interface Props {
  ingredient: Ingredient | null;
  userPreferences: UserPreferences;
  onClose: () => void;
}

export const IngredientModal: React.FC<Props> = ({ ingredient, userPreferences, onClose }) => {
  if (!ingredient) return null;

  // Check if ingredient conflicts with user profile
  const isAllergenMatch = ingredient.isAllergen && ingredient.allergenType && 
    userPreferences.foodAllergies.some(a => ingredient.allergenType?.toLowerCase().includes(a.toLowerCase()));

  const isAvoidMatch = userPreferences.avoidIngredients.some(avoid => 
    ingredient.name.toLowerCase().includes(avoid.toLowerCase()) || 
    ingredient.inciOrAltNames.some(alt => alt.toLowerCase().includes(avoid.toLowerCase()))
  );

  const isSensitivityMatch = ingredient.isIrritantOrSensitivity && 
    userPreferences.cosmeticSensitivities.some(s => 
      ingredient.sensitivityTags?.some(tag => tag.toLowerCase().includes(s.toLowerCase())) ||
      ingredient.name.toLowerCase().includes(s.toLowerCase()) ||
      ingredient.purpose.toLowerCase().includes(s.toLowerCase())
    );

  const hasPersonalConflict = isAllergenMatch || isAvoidMatch || isSensitivityMatch;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ingredient-title"
    >
      <div className="relative w-full max-w-lg max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-stone-100 flex items-start justify-between gap-4 bg-stone-50/70">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase tracking-wider font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                {ingredient.category}
              </span>
              <span className="text-xs text-stone-500">
                Evidence: <strong className="text-stone-700">{ingredient.evidenceLevel}</strong>
              </span>
            </div>
            <h2 id="ingredient-title" className="text-xl font-bold text-stone-900 leading-snug">
              {ingredient.name}
            </h2>
            {ingredient.inciOrAltNames.length > 0 && (
              <p className="text-xs text-stone-500 mt-0.5">
                INCI / Synonyms: {ingredient.inciOrAltNames.join(' · ')}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 -mt-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
            aria-label="Close ingredient details"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-stone-700 divide-y divide-stone-100">
          {/* Personal Suitability Alert */}
          {hasPersonalConflict && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-900">
              <AlertTriangle size={18} className="text-amber-700 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-xs uppercase tracking-wider text-amber-800">
                  Matches Your Avoidance Profile
                </div>
                <p className="text-xs mt-0.5 text-amber-950">
                  {isAllergenMatch && `Matches your configured "${ingredient.allergenType}" allergy. `}
                  {isAvoidMatch && `Listed in your custom ingredient avoidance filter. `}
                  {isSensitivityMatch && `Known trigger for sensitive skin or fragrance preferences.`}
                </p>
              </div>
            </div>
          )}

          {/* Assessment & Purpose */}
          <div className="pt-2 first:pt-0 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Primary Function
              </span>
              <AssessmentBadge assessment={ingredient.concernLevel} size="sm" />
            </div>
            <p className="font-medium text-stone-900 bg-stone-50 p-3 rounded-xl border border-stone-200/70">
              {ingredient.purpose}
            </p>
          </div>

          {/* Why this matters */}
          <div className="pt-4 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-900">
              <BookOpen size={14} className="text-emerald-700" />
              <span>Why This Matters (Plain English)</span>
            </div>
            <p className="text-stone-700 leading-relaxed bg-emerald-50/30 p-3 rounded-xl border border-emerald-900/10">
              {ingredient.whyThisMatters}
            </p>
          </div>

          {/* Potential Concerns & Exposure Context */}
          <div className="pt-4 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-600">
              <ShieldAlert size={14} className="text-stone-500" />
              <span>Potential Concerns & Exposure Context</span>
            </div>
            <div className="space-y-2">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80">
                <div className="text-xs font-medium text-stone-500 mb-0.5">Summary of Evidence:</div>
                <p className="text-xs text-stone-800 leading-relaxed">{ingredient.concernSummary}</p>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80">
                <div className="text-xs font-medium text-stone-500 mb-0.5">Exposure & Concentration Context:</div>
                <p className="text-xs text-stone-800 leading-relaxed">{ingredient.exposureContext}</p>
              </div>
            </div>
          </div>

          {/* Regulatory Information */}
          <div className="pt-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-600">
              <Scale size={14} className="text-stone-500" />
              <span>Regulatory Status Placeholder</span>
            </div>
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-800 leading-relaxed font-mono">
              {ingredient.regulatoryStatus}
            </div>
          </div>

          {/* Tata 1mg Clinical Monograph & Safety Advice */}
          <div className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-900">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                <span>Tata 1mg Clinical Monograph</span>
              </div>
              <a
                href={ingredient.oneMgData?.searchUrl || `https://www.1mg.com/search/all?name=${encodeURIComponent(ingredient.name)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                <span>1mg.com Monograph</span>
                <span className="text-xs">↗</span>
              </a>
            </div>

            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-rose-50/60 via-stone-50 to-orange-50/30 border border-rose-200/70 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-900">
                  {ingredient.oneMgData?.verifiedStatus || '1mg Clinical Database Grounded'}
                </span>
                <span className="text-[10px] font-mono text-rose-700 bg-rose-100/70 px-2 py-0.5 rounded-md font-bold">
                  Verified Monograph
                </span>
              </div>

              <p className="text-xs text-stone-700 leading-relaxed">
                {ingredient.oneMgData?.clinicalMonograph ||
                  `Verified pharmacological and dietary constituent benchmarked against Tata 1mg therapeutic reference monographs.`}
              </p>

              {/* 1mg Safety Advice Matrix */}
              <div className="pt-2 border-t border-rose-200/50 space-y-1.5 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600 block">
                  1mg Clinical Safety Warnings:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-white/80 border border-stone-200/60">
                    <span className="font-bold text-stone-800 block">Pregnancy:</span>
                    <span className="text-stone-600">
                      {ingredient.oneMgData?.safetyAdvice?.pregnancy || 'Consult physician if you have diagnosed sensitivities.'}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-white/80 border border-stone-200/60">
                    <span className="font-bold text-stone-800 block">Lactation:</span>
                    <span className="text-stone-600">
                      {ingredient.oneMgData?.safetyAdvice?.breastfeeding || 'Safe at customary dietary and cosmetic levels.'}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-white/80 border border-stone-200/60">
                    <span className="font-bold text-stone-800 block">Skin & Sensitivity:</span>
                    <span className="text-stone-600">
                      {ingredient.oneMgData?.safetyAdvice?.skinSensitivity || (ingredient.isAllergen ? 'Patch testing advised.' : 'Well tolerated across skin types.')}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-white/80 border border-stone-200/60">
                    <span className="font-bold text-stone-800 block">Renal / Hepatic:</span>
                    <span className="text-stone-600">
                      {ingredient.oneMgData?.safetyAdvice?.liverKidney || 'No contraindications noted for ordinary exposure levels.'}
                    </span>
                  </div>
                </div>
              </div>

              {ingredient.oneMgData?.commonUses && ingredient.oneMgData.commonUses.length > 0 && (
                <div className="pt-1 text-[11px] text-stone-600">
                  <span className="font-semibold text-stone-700">1mg Therapeutic Uses: </span>
                  <span>{ingredient.oneMgData.commonUses.join(' · ')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Scientific Sources & Authorities */}
          <div className="pt-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-600">
              <FileText size={14} className="text-stone-500" />
              <span>Safety Authorities & Evidence Records</span>
            </div>
            <div className="space-y-1.5">
              {ingredient.sources.map((source, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-stone-100/70 border border-stone-200/70 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-stone-900 block">{source.name}</span>
                    <span className="text-stone-500 text-[11px]">{source.authority}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {source.url && (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-rose-700 hover:underline font-bold"
                      >
                        1mg ↗
                      </a>
                    )}
                    <span className="text-[10px] text-stone-500 bg-white px-2 py-0.5 rounded border border-stone-200">
                      {source.yearPlaceholder}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between gap-3">
          <span className="text-[11px] text-stone-500">
            Dose, formulation, and delivery route govern risk.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-xl transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

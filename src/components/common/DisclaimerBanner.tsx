import React from 'react';
import { Info, ShieldAlert } from 'lucide-react';

interface Props {
  compact?: boolean;
}

export const DisclaimerBanner: React.FC<Props> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-stone-100 border border-stone-200 text-stone-600 text-xs leading-relaxed">
        <Info size={16} className="text-stone-500 shrink-0 mt-0.5" aria-hidden="true" />
        <p>
          <strong className="font-semibold text-stone-800">Demonstration Prototype:</strong> Ingredient presence alone does not establish toxicological risk. Dosage, application route, and individual biological tolerance dictate safety. Not medical advice.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-br from-stone-50 to-emerald-50/40 border border-emerald-900/10 text-stone-700 text-xs leading-relaxed space-y-2">
      <div className="flex items-center gap-2 text-emerald-900 font-semibold text-sm">
        <ShieldAlert size={18} className="text-emerald-700" />
        <span>Safety & Scientific Integrity Disclaimer</span>
      </div>
      <p>
        SafeScan AI is an educational UI prototype using realistic sample data. In scientific toxicology, <strong className="text-stone-900 font-medium">“the dose makes the poison”</strong>: an ingredient's mere presence on a label does not imply toxicity.
      </p>
      <div className="grid sm:grid-cols-3 gap-2 pt-1 text-[11px] text-stone-600">
        <div className="p-2 bg-white/70 rounded-lg border border-stone-200">
          <strong className="block text-stone-900 mb-0.5">Allergens vs Irritants</strong>
          Specific to immune systems (IgE-mediated) vs barrier sensitivity thresholds.
        </div>
        <div className="p-2 bg-white/70 rounded-lg border border-stone-200">
          <strong className="block text-stone-900 mb-0.5">Exposure Thresholds</strong>
          Formulation concentrations (ppm/%) determine dermal or metabolic impact.
        </div>
        <div className="p-2 bg-white/70 rounded-lg border border-stone-200">
          <strong className="block text-stone-900 mb-0.5">No Absolutes</strong>
          Never categorizes substances into binary “100% clean” or “toxic” buckets.
        </div>
      </div>
    </div>
  );
};

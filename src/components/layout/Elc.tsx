import React from 'react';
import { 
  FaEye, 
  FaBullseye, 
  FaCompass, 
  FaGem, 
  FaCheckCircle, 
  FaGavel, 
  FaLeaf, 
  FaBalanceScale 
} from 'react-icons/fa';

const coreValuesList = [
  {
    title: 'Justice & Fairness',
    description: 'Delivering unbiased, impartial, and lawful outcomes in all environment and land disputes.',
  },
  {
    title: 'Efficiency & Speed',
    description: 'Ensuring expeditious case resolution without unnecessary delays or procedural hurdles.',
  },
  {
    title: 'Proportionate Resolution',
    description: 'Applying remedies and dispute resolution mechanisms suitable to the weight of each case.',
  },
  {
    title: 'Accessibility & Inclusion',
    description: 'Guaranteeing equal access to judicial services for all citizens across Kenya without discrimination.',
  },
  {
    title: 'Sustainability & Protection',
    description: 'Preserving national ecosystems, land rights, and natural heritage for present and future generations.',
  },
  {
    title: 'Integrity & Accountability',
    description: 'Upholding high ethical standards, transparency, and professional excellence in judicial service.',
  },
];

const guidingPrinciplesList = [
  'Principles of Sustainable Development (Article 10 & Article 60 of the Constitution)',
  'Judicial Authority & Constitutional Values (Articles 159 & 232)',
  'Overriding Objective to facilitate just, expeditious, and accessible dispute resolution',
  'Public Participation, Intergenerational Equity, Precaution, & Polluter-Pays principles',
  'Active promotion of Alternative Dispute Resolution (ADR) for win-win outcomes',
];

const Elc: React.FC = () => {
  return (
    <div className="relative bg-slate-50 py-16 sm:py-20 text-slate-800 overflow-hidden">
      {/* Background Accent Glows */}
      <div className="absolute top-1/4 left-0 -translate-y-1/2 w-96 h-96 bg-[#C69A33]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-96 h-96 bg-[#061e14]/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16">
        
        {/* ================= HEADER ================= */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-900/10 border border-emerald-900/20 text-xs text-emerald-900 font-medium">
            <FaGavel className="text-[#C69A33]" />
            <span className="font-semibold uppercase tracking-wider">Institutional Overview</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-slate-900 tracking-tight">
            About the <span className="text-[#061e14]">Environment & Land Court</span>
          </h1>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
            The institutional foundation, strategic vision, mission, and guiding principles governing environment and land justice delivery in Kenya.
          </p>
        </div>

        {/* ================= VISION & MISSION CARDS ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Vision Card */}
          <div className="relative rounded-2xl bg-white border border-slate-200 shadow-md p-8 sm:p-10 space-y-6 hover:shadow-xl transition-all duration-300 overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#C69A33] to-[#061e14]" />
            <div className="flex items-center justify-between">
              <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-[#061e14] group-hover:bg-[#061e14] group-hover:text-[#D4AF37] transition-colors">
                <FaEye className="w-6 h-6" />
              </div>
              <span className="text-xs font-mono uppercase tracking-widest text-[#C69A33] bg-amber-50 px-3 py-1 rounded-full border border-amber-200 font-bold">
                Our Vision
              </span>
            </div>

            <blockquote className="text-xl sm:text-2xl font-serif font-bold text-slate-900 leading-snug border-l-4 border-[#C69A33] pl-4 py-1 italic">
              “A court of excellence in the delivery of environmental and land justice.”
            </blockquote>

            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              The ELC envisions a society where justice in the land and environmental sector is accessed and delivered to all without discrimination. The Court plays an important role as the fulcrum of dispute resolution in the environmental and land justice delivery ecosystem.
            </p>
          </div>

          {/* Mission Card */}
          <div className="relative rounded-2xl bg-[#061e14] border border-[#C69A33]/40 shadow-xl p-8 sm:p-10 space-y-6 text-white hover:shadow-2xl transition-all duration-300 overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#C69A33]" />
            <div className="flex items-center justify-between">
              <div className="p-3.5 rounded-xl bg-white/10 text-[#D4AF37] border border-white/10">
                <FaBullseye className="w-6 h-6" />
              </div>
              <span className="text-xs font-mono uppercase tracking-widest text-[#D4AF37] bg-white/10 px-3 py-1 rounded-full border border-white/20 font-bold">
                Our Mission
              </span>
            </div>

            <blockquote className="text-xl sm:text-2xl font-serif font-bold text-white leading-snug border-l-4 border-[#C69A33] pl-4 py-1 italic">
              “To resolve environment and land disputes fairly and expeditiously for peaceful co-existence and sustainable development.”
            </blockquote>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Through efficient judicial services, transparent proceedings, and constitutional fidelity, the ELC is dedicated to resolving complex land tenure and natural resource disputes while safeguarding public interest.
            </p>
          </div>

        </div>

        {/* ================= GUIDING PRINCIPLES ================= */}
        <div className="rounded-3xl bg-white border border-slate-200 shadow-lg p-8 sm:p-12 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-900/10 text-[#061e14]">
                <FaCompass className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
                  Guiding Principles
                </h2>
                <p className="text-xs text-[#C69A33] font-mono font-bold uppercase tracking-wider mt-0.5">
                  Constitutional Mandate & Legal Framework
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 self-start sm:self-auto">
              <FaBalanceScale className="text-[#C69A33]" />
              <span>Articles 10, 60, 159 & 232</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {guidingPrinciplesList.map((principle, idx) => (
              <div key={idx} className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 text-sm sm:text-base leading-relaxed">
                <FaCheckCircle className="w-5 h-5 text-[#C69A33] shrink-0 mt-0.5" />
                <span>{principle}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ================= CORE VALUES ================= */}
        <div className="space-y-8">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
            <div className="p-3 rounded-xl bg-[#061e14] text-[#D4AF37]">
              <FaGem className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-[#C69A33] font-mono font-bold uppercase tracking-wider">Our Ethics</p>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
                Core Values
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coreValuesList.map((value, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#C69A33]">
                    0{idx + 1}
                  </span>
                  <FaLeaf className="w-4 h-4 text-emerald-900/30" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 font-serif">
                  {value.title}
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Elc;
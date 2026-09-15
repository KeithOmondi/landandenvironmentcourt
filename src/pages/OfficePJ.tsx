import React, { useState } from 'react';
import { 
  FaGavel, 
  FaAward, 
  FaCheckCircle, 
  FaTasks, 
  FaTrophy, 
  FaQuoteLeft,
  FaCalendarAlt,
  FaTimes,
  FaIdCard,
  FaUserShield,
  FaMapMarkerAlt
} from 'react-icons/fa';

interface Judge {
  id: string;
  name: string;
  tenure: string;
  station?: string;
  shortBio: string;
  fullBio: string;
  keyContributions: string[];
  image: string;
}

const rolesList = [
  {
    category: 'Managing the Court',
    items: [
      'Responsible for the overall administration and management of the Environment and Land Court to ensure order and timely justice.',
      'Recommends policies and procedures that enhance court efficiency and accessibility nationwide.'
    ]
  },
  {
    category: 'Leadership & Governance',
    items: [
      'Elected by ELC Judges to serve a non-renewable five-year leadership term.',
      'Fosters harmonious relationships between Judges, Judicial Officers, and registry staff.'
    ]
  },
  {
    category: 'Policy & Innovation',
    items: [
      'Drives technological integration and e-filing implementation across all ELC stations.',
      'Promotes Alternative Dispute Resolution (ADR) for fair, expeditious land dispute resolution.'
    ]
  }
];

const achievementsList = [
  'Inauguration and leadership execution since election in 2022.',
  'Expanded specialized ELC stations to over 38 counties to bring land justice closer to citizens.',
  'Accelerated case clearance rates for long-standing land and environmental disputes under STAJ.',
  'Standardized ELC bench procedures and guidelines across all sub-registries.'
];



const OfficePJ: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'roles' | 'achievements'>('roles');
  const [selectedJudge, setSelectedJudge] = useState<Judge | null>(null);

  return (
    <div className="relative bg-slate-50 py-16 sm:py-20 text-slate-800 overflow-hidden">
      {/* Background Accent Glows */}
      <div className="absolute top-1/4 left-0 -translate-y-1/2 w-96 h-96 bg-[#C69A33]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-96 h-96 bg-[#061e14]/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16">
        
        {/* ================= HERO HEADER ================= */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-900/10 border border-emerald-900/20 text-xs text-emerald-900 font-medium">
            <FaGavel className="text-[#C69A33]" />
            <span className="font-semibold uppercase tracking-wider">Judicial Leadership</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-3xl font-serif font-bold text-slate-900 tracking-tight">
            Office of the <span className="text-[#061e14]">Principal Judge</span>
          </h1>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
            Leading the administration, strategic direction, and judicial management of the Environment and Land Court of Kenya.
          </p>
        </div>

        {/* ================= PRINCIPAL JUDGE PROFILE CARD ================= */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
            
            {/* Left Column: Full-Height Box Image */}
            <div className="lg:col-span-5 relative group min-h-[400px] lg:min-h-[520px] overflow-hidden bg-[#061e14]">
              <img 
                src="https://judiciary.go.ke/wp-content/uploads/2024/05/Hon.-Mr.-Justice-Oscar-Amugo-Angote.png" 
                alt="Hon. Justice Oscar Angote, MBS" 
                className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#061e14] via-[#061e14]/30 to-transparent" />
              
              <div className="absolute bottom-0 left-0 right-0 p-8 space-y-1.5 text-center sm:text-left z-10">
                <span className="inline-block px-3.5 py-1 rounded-full bg-[#C69A33] text-[#061e14] text-xs font-mono font-bold uppercase tracking-wider shadow">
                  Current Leadership
                </span>
                <h3 className="text-2xl font-serif font-bold text-white drop-shadow-md">
                  Hon. Justice Oscar Angote, MBS
                </h3>
                <p className="text-xs text-[#D4AF37] font-mono uppercase tracking-wider font-semibold">
                  Principal Judge, ELC Kenya
                </p>
              </div>
            </div>

            {/* Right Column: Bio & Context */}
            <div className="lg:col-span-7 p-8 sm:p-12 space-y-6 flex flex-col justify-between">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-[#C69A33] uppercase tracking-wider">
                  <FaAward className="w-4 h-4" />
                  <span>Constitutional Mandate</span>
                </div>

                <blockquote className="relative pl-6 border-l-4 border-[#C69A33] py-2 bg-amber-50/60 rounded-r-2xl">
                  <FaQuoteLeft className="absolute top-1 left-2 text-xl text-[#C69A33]/30" />
                  <p className="text-lg sm:text-xl font-serif italic text-slate-800 font-semibold leading-relaxed">
                    “Leading the management and administration of the court’s business, recommending policies that improve legal efficacy and access to land justice.”
                  </p>
                </blockquote>

                <div className="space-y-4 text-slate-600 text-sm sm:text-base leading-relaxed">
                  <p>
                    The Environment and Land Court is led by a Principal Judge who is elected by ELC Judges and serves a non-renewable five-year term. The Principal Judge oversees the structural governance, court station allocation, and policy enforcement across the Republic.
                  </p>
                  <p>
                    The current Principal Judge, <strong className="text-slate-900">Hon. Justice Oscar Angote, MBS</strong>, was elected and inaugurated as the Principal Judge of the Environment and Land Court in <strong className="text-slate-900">2022</strong>.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-4 text-xs font-mono">
                <div className="px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center gap-2">
                  <FaCalendarAlt className="text-[#C69A33]" />
                  <span>Term: 2022 – Present</span>
                </div>
                <div className="px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center gap-2">
                  <FaGavel className="text-[#C69A33]" />
                  <span>5-Year Non-Renewable Term</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ================= TABBED DETAILS SECTION ================= */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-8 sm:p-12 space-y-8">
          <div className="flex border-b border-slate-200 gap-6">
            <button
              onClick={() => setActiveTab('roles')}
              className={`pb-4 px-2 font-serif text-lg font-bold transition-all border-b-2 flex items-center gap-2 ${
                activeTab === 'roles'
                  ? 'border-[#061e14] text-[#061e14]'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <FaTasks className={activeTab === 'roles' ? 'text-[#C69A33]' : 'text-slate-400'} />
              <span>Roles of the Principal Judge</span>
            </button>

            <button
              onClick={() => setActiveTab('achievements')}
              className={`pb-4 px-2 font-serif text-lg font-bold transition-all border-b-2 flex items-center gap-2 ${
                activeTab === 'achievements'
                  ? 'border-[#061e14] text-[#061e14]'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <FaTrophy className={activeTab === 'achievements' ? 'text-[#C69A33]' : 'text-slate-400'} />
              <span>Achievements & Reforms</span>
            </button>
          </div>

          {activeTab === 'roles' && (
            <div className="space-y-6">
              <p className="text-sm text-slate-600">
                The Principal Judge carries executive administrative duties for the ELC in accordance with judicial governance frameworks:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {rolesList.map((group, idx) => (
                  <div key={idx} className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                    <h4 className="text-base font-bold font-serif text-slate-900 border-b border-slate-200 pb-2">
                      {group.category}
                    </h4>
                    <ul className="space-y-3">
                      {group.items.map((item, itemIdx) => (
                        <li key={itemIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                          <FaCheckCircle className="w-4 h-4 text-[#C69A33] shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="space-y-6">
              <p className="text-sm text-slate-600">
                Key strategic milestones achieved under the current tenure of the Office of the Principal Judge:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievementsList.map((achievement, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-sm sm:text-base leading-relaxed">
                    <div className="p-1.5 rounded-lg bg-[#061e14] text-[#D4AF37] shrink-0 mt-0.5">
                      <FaCheckCircle className="w-4 h-4" />
                    </div>
                    <span>{achievement}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>



      </div>

      {/* ================= JUDGE PROFILE / ID MODAL ================= */}
      {selectedJudge && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn"
          onClick={() => setSelectedJudge(null)}
        >
          <div 
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden relative transform transition-all duration-300 scale-100 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Header Bar */}
            <div className="bg-[#061e14] text-white px-6 py-4 flex items-center justify-between border-b border-[#C69A33]/30 shrink-0">
              <div className="flex items-center gap-2.5 text-xs font-mono tracking-wider uppercase text-[#D4AF37]">
                <FaIdCard className="text-lg" />
                <span>Judicial Profile Record</span>
              </div>
              <button 
                onClick={() => setSelectedJudge(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Close modal"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Content */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
              
              {/* ID Badge Header Card */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 relative">
                {/* Image */}
                <div className="relative w-28 h-36 sm:w-32 sm:h-40 rounded-xl overflow-hidden border-2 border-[#C69A33] shadow-md shrink-0 bg-slate-900">
                  <img 
                    src={selectedJudge.image} 
                    alt={selectedJudge.name} 
                    className="w-full h-full object-cover object-top"
                  />
                </div>

                {/* Info Text */}
                <div className="space-y-2 text-center sm:text-left flex-grow">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#061e14] text-[#D4AF37] text-[10px] font-mono font-bold uppercase tracking-wider">
                    <FaUserShield className="w-3 h-3" />
                    <span>Judicial Service Record</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-serif font-bold text-slate-900">
                    {selectedJudge.name}
                  </h3>
                  <div className="space-y-1 text-xs text-slate-600 font-mono">
                    <p className="flex items-center justify-center sm:justify-start gap-1.5 text-[#061e14] font-semibold">
                      <FaCalendarAlt className="text-[#C69A33]" />
                      <span>Tenure: {selectedJudge.tenure}</span>
                    </p>
                    {selectedJudge.station && (
                      <p className="flex items-center justify-center sm:justify-start gap-1.5 text-slate-500">
                        <FaMapMarkerAlt className="text-[#C69A33]" />
                        <span>{selectedJudge.station}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Detailed Bio */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#C69A33] flex items-center gap-2">
                  <FaGavel className="w-3.5 h-3.5" />
                  <span>Judicial Biography</span>
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
                  {selectedJudge.fullBio}
                </p>
              </div>

              {/* Key Contributions */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#061e14] flex items-center gap-2">
                  <FaTrophy className="w-3.5 h-3.5 text-[#C69A33]" />
                  <span>Key Administrative Milestones</span>
                </h4>
                <div className="grid grid-cols-1 gap-2.5">
                  {selectedJudge.keyContributions.map((item, index) => (
                    <div 
                      key={index}
                      className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-950/5 border border-emerald-900/10 text-xs text-slate-700"
                    >
                      <FaCheckCircle className="w-4 h-4 text-[#C69A33] shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedJudge(null)}
                className="px-5 py-2 rounded-xl bg-[#061e14] hover:bg-slate-800 text-white font-mono text-xs font-bold transition-all shadow-md"
              >
                Close Record
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default OfficePJ;
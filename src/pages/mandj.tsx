import React, { useState } from 'react';
import { 
  FaBalanceScale, 
  FaLandmark, 
  FaGavel, 
  FaTree, 
  FaLayerGroup, 
  FaCheckCircle, 
  FaBuilding, 
  FaShieldAlt,
  FaSitemap,
  FaChevronRight,
} from 'react-icons/fa';

const jurisdictionItems = [
  { title: 'Environment Planning & Protection', desc: 'Conservation frameworks and environmental impact assessments.' },
  { title: 'Climate Issues & Policy', desc: 'Litigation surrounding climate justice and sustainability regulations.' },
  { title: 'Land Use Planning & Zoning', desc: 'Compliance with spatial planning and zoning laws.' },
  { title: 'Land Title, Tenure & Boundaries', desc: 'Disputes over legal ownership, land rights, boundary adjustments.' },
  { title: 'Land Rates, Rents & Valuations', desc: 'Rating disputes, public valuation appeals, and rent collection cases.' },
  { title: 'Mining & Natural Resources', desc: 'Natural resource extraction rights, mineral claims, and royalties.' },
  { title: 'Compulsory Land Acquisition', desc: 'State land acquisition, compensation claims, and public interest takings.' },
  { title: 'Land Administration & Governance', desc: 'Challenging administrative decisions made by national land bodies.' }
];

const constitutionalArticles = [
  { article: 'Article 42', title: 'Clean & Healthy Environment', text: 'Every person has the right to a clean and healthy environment.' },
  { article: 'Article 69', title: 'State Environmental Obligations', text: 'State duties regarding natural resources, sustainable utilization, and tree cover.' },
  { article: 'Article 70', title: 'Enforcement of Environmental Rights', text: 'Power to apply to court for redress when environmental rights are threatened.' }
];

const specializedTribunals = [
  'Business Premises Rent Tribunal (BPRT)',
  'National Environment Tribunal (NET)',
  'Rent Restriction Tribunal (RRT)',
  'Co-operative Tribunal (Land-related disputes)'
];

const publicBodies = [
  'National Land Commission (NLC)',
  'National Environmental Complaints Committee (NECC)',
  'Energy and Petroleum Tribunal (EPT)',
  'County & Joint Physical Planning Liaison Committees',
  'Land Adjudication Committees & Boards',
  'Water Tribunal',
  'County Wildlife Conservation & Compensation Committees',
  'Mining Act Cabinet Secretary Appeals'
];

const Mandj: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'jurisdiction' | 'supervisory'>('jurisdiction');

  return (
    <div className="relative bg-slate-50 py-16 sm:py-20 text-slate-800 overflow-hidden">
      {/* Background Accent Glows */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-[#061e14]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#C69A33]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16">

        {/* ================= HERO / ESTABLISHMENT HEADER ================= */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/10 border border-emerald-900/20 text-xs text-emerald-900 font-mono font-bold uppercase tracking-wider">
            <FaLandmark className="text-[#C69A33]" />
            <span>Constitutional Establishment</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-slate-900 tracking-tight">
            Mandate & <span className="text-[#061e14]">Jurisdiction</span>
          </h1>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
            The Environment and Land Court (ELC) is established under <strong className="text-slate-900">Article 162(2)(a)</strong> of the Constitution of Kenya as a superior court of record equal status to the High Court.
          </p>
        </div>

        {/* ================= COURT HIERARCHY OVERVIEW CARD ================= */}
        <div className="bg-gradient-to-br from-[#061e14] to-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <FaBalanceScale className="w-64 h-64 text-[#C69A33]" />
          </div>

          <div className="relative z-10 space-y-8">
            <div className="max-w-2xl space-y-2">
              <span className="text-xs font-mono text-[#D4AF37] uppercase tracking-widest font-bold flex items-center gap-2">
                <FaSitemap /> Judicial Hierarchy & Status
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold">
                Superior Court of Equal Status
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                The ELC exercises exclusive original civil jurisdiction over land and environmental matters. Appeals from decisions of the ELC lie directly to the <strong className="text-white">Court of Appeal</strong> and ultimately the <strong className="text-white">Supreme Court of Kenya</strong>.
              </p>
            </div>

            {/* Hierarchy Pathway Visual */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/10 text-xs font-mono">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-[#D4AF37] font-bold">1. Subordinate Courts / Tribunals</span>
                <p className="text-slate-400 font-sans">Supervised by the ELC on land/environmental appeals.</p>
              </div>
              <div className="p-4 rounded-xl bg-[#C69A33]/20 border border-[#C69A33]/40 space-y-1">
                <span className="text-amber-300 font-bold">2. Environment & Land Court (ELC)</span>
                <p className="text-slate-200 font-sans">Exclusive original civil jurisdiction & supervisory powers.</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-[#D4AF37] font-bold">3. Court of Appeal / Supreme Court</span>
                <p className="text-slate-400 font-sans">Appellate jurisdiction over final decisions of the ELC.</p>
              </div>
            </div>
          </div>
        </div>

        {/* ================= CONSTITUTIONAL RIGHTS GRID ================= */}
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
              Constitutional Environmental Rights
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
              The ELC has original jurisdiction to enforce fundamental rights guaranteed under Chapter 5 of the Constitution of Kenya.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {constitutionalArticles.map((item, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3 hover:border-[#C69A33] transition-colors">
                <div className="inline-block px-3 py-1 rounded-lg bg-amber-50 text-[#C69A33] border border-amber-200 text-xs font-mono font-bold">
                  {item.article}
                </div>
                <h3 className="text-lg font-serif font-bold text-slate-900">{item.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ================= TABBED MANDATE & JURISDICTION SECTION ================= */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-8 sm:p-12 space-y-8">
          
          {/* Tabs Navigation */}
          <div className="flex border-b border-slate-200 gap-6">
            <button
              onClick={() => setActiveTab('jurisdiction')}
              className={`pb-4 px-2 font-serif text-lg font-bold transition-all border-b-2 flex items-center gap-2 ${
                activeTab === 'jurisdiction'
                  ? 'border-[#061e14] text-[#061e14]'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <FaTree className={activeTab === 'jurisdiction' ? 'text-[#C69A33]' : 'text-slate-400'} />
              <span>Civil Jurisdiction Core</span>
            </button>

            <button
              onClick={() => setActiveTab('supervisory')}
              className={`pb-4 px-2 font-serif text-lg font-bold transition-all border-b-2 flex items-center gap-2 ${
                activeTab === 'supervisory'
                  ? 'border-[#061e14] text-[#061e14]'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <FaShieldAlt className={activeTab === 'supervisory' ? 'text-[#C69A33]' : 'text-slate-400'} />
              <span>Supervisory & Appellate Role</span>
            </button>
          </div>

          {/* TAB 1: CIVIL JURISDICTION LIST */}
          {activeTab === 'jurisdiction' && (
            <div className="space-y-6">
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                As articulated under the Environment and Land Court Act, the court holds exclusive civil jurisdiction over matters involving land use, environmental protection, and property rights:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jurisdictionItems.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="p-2 rounded-xl bg-[#061e14] text-[#D4AF37] shrink-0 mt-0.5">
                      <FaCheckCircle className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-serif font-bold text-slate-900">{item.title}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: TRIBUNALS & PUBLIC BODIES */}
          {activeTab === 'supervisory' && (
            <div className="space-y-8">
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                The ELC exercises supervisory powers over subordinate courts, specialized dispute tribunals, and administrative public bodies making quasi-judicial decisions:
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Specialized Tribunals Box */}
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  <div className="flex items-center gap-2 text-slate-900 font-serif font-bold text-base border-b border-slate-200 pb-3">
                    <FaGavel className="text-[#C69A33]" />
                    <span>Specialized Tribunals under ELC Supervision</span>
                  </div>
                  <ul className="space-y-3">
                    {specializedTribunals.map((tribunal, idx) => (
                      <li key={idx} className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700">
                        <FaChevronRight className="w-3 h-3 text-[#C69A33] shrink-0" />
                        <span>{tribunal}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Quasi-Judicial Public Bodies Box */}
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  <div className="flex items-center gap-2 text-slate-900 font-serif font-bold text-base border-b border-slate-200 pb-3">
                    <FaBuilding className="text-[#C69A33]" />
                    <span>Quasi-Judicial Bodies & Liaison Committees</span>
                  </div>
                  <ul className="grid grid-cols-1 gap-2.5">
                    {publicBodies.map((body, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                        <FaLayerGroup className="w-3 h-3 text-[#061e14] shrink-0" />
                        <span>{body}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default Mandj;
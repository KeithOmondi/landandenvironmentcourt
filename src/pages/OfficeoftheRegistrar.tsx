import React, { useState } from 'react';
import { FaAward, FaCheckCircle } from 'react-icons/fa';

interface FunctionItem {
  number: number;
  text: string;
}

interface PreviousRegistrar {
  period: string;
  name: string;
  role: string;
  bio: string;
  image?: string;
}

const functionsList: FunctionItem[] = [
  { number: 1, text: 'Setting up of the main and sub-registries of the Court;' },
  { number: 2, text: 'Day to day administration and management of the Court;' },
  { number: 3, text: 'Supervising all support services in the Court including processing and distribution of case files;' },
  { number: 4, text: 'Monitoring of administrative and office procedures to uphold efficiency and quality of service;' },
  { number: 5, text: 'Planning, preparation and implementation of the budget of the Court;' },
  { number: 6, text: 'Preparation of reports and proposals on administrative issues as may be requested from time to time;' },
  { number: 7, text: 'Overseeing the procurement and disposal of assets;' },
  { number: 8, text: 'Acceptance, transmission, service and custody of documents in accordance with the law;' },
  { number: 9, text: 'Taxation of costs and assessment of court fees;' },
  { number: 10, text: 'Certification of any order, direction or decision as provided under the rules of procedure or as directed by the Presiding Judge;' },
  { number: 11, text: 'Keeping in custody records of proceedings and minutes of meetings of the Court;' },
  { number: 12, text: 'Management of the library of the Court; and' },
  { number: 13, text: 'Facilitation of access to judgments, rulings, and records of the Court.' }
];

const achievementsList = [
  'Implementation of full electronic case filing (e-Filing) and cause list automation across all ELC registries.',
  'Substantial reduction in land case backlogs through organized registry audit operations.',
  'Standardization of court returns reporting and daily station cause list monitoring.'
];

const previousRegistrars: PreviousRegistrar[] = [
  {
    period: '2020 - 2023',
    name: 'Hon. Pauline Mbulika',
    role: 'Former Registrar, ELC',
    bio: 'Hon. Pauline Mbulika served as the Registrar of the Environment and Land Court, steering critical registry automation and capacity expansion across sub-registries nationwide. Prior to her service at the ELC, she held judicial roles including Resident Magistrate and Deputy Registrar across various court stations.',
    image: ''
  },
  {
    period: '2016 - 2020',
    name: 'Hon. Anne Amwoma',
    role: 'Former Registrar, ELC',
    bio: 'Hon. Anne Amwoma provided foundational leadership during the structural setup and decentralization phase of the Environment and Land Court registries across Kenya, standardizing court returns and case management protocols.',
    image: ''
  }
];

const OfficeoftheRegistrar: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'functions' | 'achievements'>('functions');

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-16">

        {/* ================= SECTION 1: OVERVIEW ================= */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm space-y-6">
          <div className="flex flex-col lg:flex-row gap-10 items-center justify-between">
            <div className="space-y-4 lg:w-3/5">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#061e14]/10 border border-[#061e14]/20 text-xs font-mono font-bold text-[#061e14] uppercase tracking-widest">
                <FaAward className="text-[#C69A33]" />
                <span>Statutory Mandate</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900 tracking-tight">
                Office of the Registrar <span className="text-[#C69A33]">(ELC)</span>
              </h1>

              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                The Office of the Registrar of the Environment and Land Court is established under Section 24 of the ELC Act. The Registrar oversees the administration of all ELC matters, sub-registries, and registry operations. The office manages case files, coordinates scheduling, enforces registry procedures to ensure efficiency and high-quality service, and handles overall administrative supervision.
              </p>

              <p className="text-slate-600 text-sm leading-relaxed">
                In the administration, management, and representation of ELC activities, the Registrar is supported by Deputy Registrars and judicial staff deployed at every station and sub-registry across Kenya.
              </p>
            </div>

            <div className="lg:w-2/5 w-full flex justify-center">
              <div className="relative rounded-2xl overflow-hidden shadow-lg border-4 border-white bg-slate-900 group max-w-md">
                <img 
                  src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=800" 
                  alt="Judicial Bench" 
                  className="w-full h-64 object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#061e14]/90 via-transparent to-transparent flex flex-col justify-end p-6 text-white">
                  <span className="text-xs font-mono text-[#D4AF37] uppercase font-bold">Judicial Administration</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= SECTION 2: PROFILE ================= */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-stretch">
            
            {/* Left: Prominent Portrait Frame */}
            <div className="w-full lg:w-5/12 flex shrink-0">
              <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-slate-100 group">
                <img 
                  src="" 
                  alt="Hon. Registrar ELC" 
                  className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#061e14]/90 via-transparent to-transparent flex flex-col justify-end p-6 text-white">
                  <span className="inline-block w-fit px-3 py-1 rounded bg-[#C69A33] text-[10px] font-mono font-bold text-slate-900 uppercase tracking-widest mb-1">
                    CURRENT REGISTRAR
                  </span>
                  <h2 className="text-2xl font-serif font-bold text-white">
                    Hon. Registrar ELC
                  </h2>
                  <p className="text-xs font-mono text-[#D4AF37] uppercase tracking-wider">
                    REGISTRAR, ELC KENYA
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Biography & Education Info */}
            <div className="w-full lg:w-7/12 flex flex-col justify-between space-y-6 pt-2">
              <div className="space-y-4">
                <span className="text-xs font-mono font-bold text-[#C69A33] uppercase tracking-widest block">
                  REGISTRAR PROFILE & BIOGRAPHY
                </span>

                <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-sans first-letter:text-4xl first-letter:font-serif first-letter:font-bold first-letter:text-[#061e14] first-letter:mr-2 leading-none">
                  The Registrar of the Environment and Land Court is an Advocate of the High Court of Kenya with extensive experience in judicial administration, registry operations, and public service. Prior to appointment, the Registrar served across various capacities within magistrate courts and statutory judicial bodies.
                </p>

                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-sans">
                  In this administrative capacity, the Registrar leads key policy implementations, continuous e-filing digitisation, judicial officer capacity building, and coordination across all regional ELC sub-registries to ensure transparent and expedited land justice.
                </p>
              </div>

              {/* Bottom Qualifications Bar */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-[#C69A33]"></span>
                  <span>Bachelor of Laws (LL.B)</span>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-[#061e14]"></span>
                  <span>Post Graduate Diploma (KSL)</span>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-mono text-[#061e14] font-semibold">
                  <span>Advocate of the High Court</span>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* ================= SECTION 3: TABS (FUNCTIONS & ACHIEVEMENTS) ================= */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm space-y-6">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('functions')}
              className={`px-6 py-3 font-mono text-xs font-bold transition-all border-b-2 ${
                activeTab === 'functions'
                  ? 'border-[#061e14] text-[#061e14] bg-slate-50'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              Functions of The Registrar
            </button>
            <button
              onClick={() => setActiveTab('achievements')}
              className={`px-6 py-3 font-mono text-xs font-bold transition-all border-b-2 ${
                activeTab === 'achievements'
                  ? 'border-[#061e14] text-[#061e14] bg-slate-50'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              Achievements
            </button>
          </div>

          {activeTab === 'functions' && (
            <div className="space-y-4 animate-fadeIn">
              <p className="text-xs font-mono text-slate-500 uppercase tracking-wider">
                The Registrar performs duties delegated by the Presiding Judge and is specifically responsible for:
              </p>

              <ol className="space-y-2.5 pt-2">
                {functionsList.map((fn) => (
                  <li key={fn.number} className="flex items-start gap-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
                    <span className="font-mono text-xs font-bold text-[#C69A33] shrink-0 mt-0.5">
                      {fn.number}.
                    </span>
                    <span>{fn.text}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="space-y-4 animate-fadeIn">
              <p className="text-xs font-mono text-slate-500 uppercase tracking-wider">
                Key milestones achieved under the Office of the Registrar:
              </p>

              <ul className="space-y-3 pt-2">
                {achievementsList.map((ach, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
                    <FaCheckCircle className="text-[#061e14] w-4 h-4 shrink-0 mt-0.5" />
                    <span>{ach}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* ================= SECTION 4: PREVIOUS REGISTRARS (HIGH COURT STYLE) ================= */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm space-y-12">
          <div className="space-y-1">
            <h3 className="text-2xl font-serif font-bold text-slate-900">
              Previous Registrars
            </h3>
            <p className="text-xs font-mono text-slate-500 uppercase tracking-wider">
              Institutional leadership history
            </p>
          </div>

          <div className="space-y-12">
            {previousRegistrars.map((prev, idx) => (
              <div 
                key={idx}
                className="flex flex-col md:flex-row items-start gap-8 lg:gap-12 pb-12 border-b border-slate-100 last:border-0 last:pb-0"
              >
                {/* Large Portrait Frame with thin Gold Accent */}
                <div className="w-full sm:w-64 md:w-72 shrink-0">
                  <div className="relative aspect-[4/5] rounded-xl overflow-hidden border border-slate-200 shadow-sm ring-1 ring-[#C69A33]/30 bg-slate-100 group">
                    <img 
                      src={prev.image || ""} 
                      alt={prev.name} 
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                    />
                  </div>
                </div>

                {/* Timeline node line + Full details */}
                <div className="flex-1 relative pl-6 md:pl-8 border-l-2 border-[#C69A33]/40 space-y-3">
                  {/* Gold Timeline Dot */}
                  <div className="absolute -left-[9px] top-0.5 w-4 h-4 rounded-full bg-white border-2 border-[#C69A33] flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#061e14]" />
                  </div>

                  <div className="inline-block font-mono text-sm font-bold text-[#C69A33] tracking-wide">
                    {prev.period}
                  </div>

                  <h4 className="text-2xl font-serif font-bold text-slate-900 tracking-tight">
                    {prev.name}
                  </h4>

                  <p className="text-xs font-mono font-semibold text-slate-500 uppercase tracking-wider">
                    {prev.role}
                  </p>

                  <p className="text-slate-600 text-sm leading-relaxed pt-2 font-sans">
                    {prev.bio}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default OfficeoftheRegistrar;
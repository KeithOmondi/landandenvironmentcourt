import React from 'react';
import { 
  FaHistory, 
  FaLandmark, 
  FaBalanceScale, 
  FaGavel, 
  FaCheckCircle, 
  FaShieldAlt, 
  FaFileContract,
  FaCalendarAlt
} from 'react-icons/fa';

interface TimelineEvent {
  year: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
}

const timelineData: TimelineEvent[] = [
  {
    year: '2010',
    title: 'Constitutional Promulgation',
    subtitle: 'Article 162(2)(b)',
    description: 'The Constitution of Kenya 2010 established the Environment and Land Court as a specialized court with status equal to the High Court to hear land and environmental disputes.',
    icon: <FaLandmark className="w-4 h-4 text-[#C69A33]" />
  },
  {
    year: '2011',
    title: 'Statutory Enactment',
    subtitle: 'ELC Act No. 19 of 2011',
    description: 'Parliament enacted the Environment and Land Court Act, formally operationalizing the jurisdiction, composition, powers, and procedural rules of the court.',
    icon: <FaFileContract className="w-4 h-4 text-[#C69A33]" />
  },
  {
    year: '2012',
    title: 'Deployment of Judges',
    subtitle: 'First Judicial Appointments',
    description: 'The first cohort of specialized ELC Judges was sworn in, decentralizing land dispute resolution and relieving pressure from the mainstream High Court registries.',
    icon: <FaGavel className="w-4 h-4 text-[#C69A33]" />
  },
  {
    year: '2022+',
    title: 'Digital & Registry Transformation',
    subtitle: 'E-Filing & Cause List Automation',
    description: 'Transitioned to e-filing, virtual court hearings, and digital registry management to expedite land title determinations and environmental protection suits.',
    icon: <FaBalanceScale className="w-4 h-4 text-[#C69A33]" />
  }
];

const HistoryElc: React.FC = () => {
  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-16">

        {/* ================= HERO / HEADER SECTION ================= */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#061e14]/10 border border-[#061e14]/20 text-xs font-mono font-bold text-[#061e14] uppercase tracking-widest">
            <FaHistory className="text-[#C69A33]" />
            <span>Institutional Background</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-slate-900 tracking-tight">
            History of the <span className="text-[#C69A33]">Environment & Land Court</span>
          </h1>

          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Established to guarantee sustainable land governance, resolve property disputes, and protect constitutional environmental rights across the Republic of Kenya.
          </p>
        </div>

        {/* ================= OVERVIEW CARDS ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-sm space-y-4 relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-[#061e14] text-[#D4AF37] flex items-center justify-center shadow-md">
              <FaShieldAlt className="w-6 h-6" />
            </div>
            <span className="text-xs font-mono font-bold text-[#C69A33] uppercase tracking-wider block">
              Constitutional Mandate
            </span>
            <h2 className="text-2xl font-serif font-bold text-slate-900">
              Specialized Jurisdiction
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Prior to 2010, land disputes were handled within overburdened High Court divisions, leading to prolonged delays. The creation of the ELC ensured dedicated, expert judicial oversight over land tenure, compulsory acquisition, boundaries, planning, and environmental conservation.
            </p>
          </div>

          <div className="bg-gradient-to-br from-[#061e14] via-[#0b3323] to-slate-900 text-white rounded-3xl p-8 sm:p-10 shadow-lg space-y-4 relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-[#C69A33]/40 text-[#D4AF37] flex items-center justify-center backdrop-blur-md">
              <FaBalanceScale className="w-6 h-6" />
            </div>
            <span className="text-xs font-mono font-bold text-[#D4AF37] uppercase tracking-wider block">
              Equal Status
            </span>
            <h2 className="text-2xl font-serif font-bold text-amber-100">
              High Court Level Status
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Pursuant to Article 162(2) of the Constitution, the ELC holds status equal to the High Court. Appeals from the ELC lie directly to the Court of Appeal, enforcing binding precedents on land administration and environmental compliance.
            </p>
          </div>

        </div>

        {/* ================= TIMELINE SECTION ================= */}
        <div className="space-y-10 pt-6">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-serif font-bold text-slate-900">
              Key Historical Milestones
            </h3>
            <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">
              Evolution from constitutional inception to modern digital registry operations
            </p>
          </div>

          <div className="relative max-w-4xl mx-auto">
            {/* Central Vertical Line */}
            <div className="absolute left-4 sm:left-1/2 top-0 bottom-0 w-0.5 bg-slate-200 -translate-x-1/2 hidden sm:block" />

            <div className="space-y-8">
              {timelineData.map((item, idx) => {
                const isEven = idx % 2 === 0;
                return (
                  <div key={idx} className="relative flex flex-col sm:flex-row items-center group">
                    
                    {/* Left/Right Content Card */}
                    <div className={`w-full sm:w-1/2 ${isEven ? 'sm:pr-10 sm:text-right' : 'sm:pl-10 sm:ml-auto'}`}>
                      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-[#C69A33]/50 transition-all duration-300 space-y-2">
                        <div className={`flex items-center gap-2 ${isEven ? 'sm:justify-end' : 'justify-start'}`}>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[#061e14] font-mono text-xs font-bold">
                            <FaCalendarAlt className="text-[#C69A33] w-3 h-3" />
                            {item.year}
                          </span>
                          <span className="text-xs font-mono text-slate-400 font-semibold">
                            {item.subtitle}
                          </span>
                        </div>

                        <h4 className="text-base font-serif font-bold text-slate-900">
                          {item.title}
                        </h4>

                        <p className="text-xs text-slate-600 leading-relaxed font-sans">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    {/* Timeline Node Icon */}
                    <div className="absolute left-4 sm:left-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-[#061e14] border-4 border-white text-[#D4AF37] flex items-center justify-center shadow-md z-10 hidden sm:flex">
                      {item.icon}
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ================= SUMMARY FOOTER BANNER ================= */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="font-serif font-bold text-slate-900 text-lg">
              Jurisdictional Core Objectives
            </h4>
            <p className="text-xs text-slate-500 font-sans">
              Safeguarding public land, resolving title conflicts, and enforcing environmental protection laws.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 text-xs font-mono font-bold text-slate-700">
            <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl">
              <FaCheckCircle className="text-[#061e14]" /> Title Disputes
            </span>
            <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl">
              <FaCheckCircle className="text-[#061e14]" /> Environmental Writs
            </span>
            <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl">
              <FaCheckCircle className="text-[#061e14]" /> Compulsory Acquisition
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HistoryElc;
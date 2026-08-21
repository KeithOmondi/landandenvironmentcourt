import React from 'react';
import { 
  FaBalanceScale, 
  FaShieldAlt, 
  FaHandshake, 
  FaGavel, 
  FaUserCheck, 
  FaLightbulb, 
  FaHeart, 
  FaAward 
} from 'react-icons/fa';

interface ValueItem {
  icon: React.ReactNode;
  title: string;
  shortTag: string;
  description: string;
}

const valuesList: ValueItem[] = [
  {
    icon: <FaBalanceScale className="w-6 h-6 text-[#C69A33]" />,
    title: 'Equity & Fairness',
    shortTag: 'Impartiality',
    description: 'Delivering unbiased justice to all persons regardless of status, gender, or background.'
  },
  {
    icon: <FaShieldAlt className="w-6 h-6 text-[#C69A33]" />,
    title: 'Judicial Integrity',
    shortTag: 'Ethics',
    description: 'Upholding uncompromising ethical standards, transparency, and accountability in every ruling.'
  },
  {
    icon: <FaHandshake className="w-6 h-6 text-[#C69A33]" />,
    title: 'Accessibility',
    shortTag: 'Public Service',
    description: 'Ensuring court services, digital registries, and hearings are barrier-free for all citizens.'
  },
  {
    icon: <FaGavel className="w-6 h-6 text-[#C69A33]" />,
    title: 'Rule of Law',
    shortTag: 'Constitutionalism',
    description: 'Safeguarding constitutional rights, statutory procedures, and judicial independence.'
  },
  {
    icon: <FaUserCheck className="w-6 h-6 text-[#C69A33]" />,
    title: 'Professionalism',
    shortTag: 'Excellence',
    description: 'Executing judicial and administrative duties with competence, diligence, and respect.'
  },
  {
    icon: <FaLightbulb className="w-6 h-6 text-[#C69A33]" />,
    title: 'Innovation',
    shortTag: 'Modernization',
    description: 'Embracing e-filing, virtual courts, and modern technology to clear case backlogs.'
  }
];

const CoreValues: React.FC = () => {
  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">

        {/* ================= HEADER SECTION ================= */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#061e14]/10 border border-[#061e14]/20 text-xs font-mono font-bold text-[#061e14] uppercase tracking-widest">
            <FaAward className="text-[#C69A33]" />
            <span>Guiding Principles</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-slate-900 tracking-tight">
            Our <span className="text-[#C69A33]">Core Values</span>
          </h1>

          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            The foundational beliefs and ethical commitments that drive our service delivery, judicial conduct, and administrative processes.
          </p>
        </div>

        {/* ================= CORE VALUES GRID ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {valuesList.map((item, index) => (
            <div 
              key={index}
              className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm hover:shadow-xl hover:border-[#C69A33]/50 transition-all duration-300 flex flex-col justify-between space-y-6 group relative overflow-hidden"
            >
              {/* Top Accent Light Background */}
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-[#061e14]/5 rounded-full blur-xl group-hover:bg-[#061e14]/10 transition-colors" />

              <div className="space-y-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold text-[#C69A33] uppercase tracking-wider block">
                    {item.shortTag}
                  </span>
                  <h3 className="text-xl font-serif font-bold text-slate-900">
                    {item.title}
                  </h3>
                </div>

                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-sans">
                  {item.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 relative z-10 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Pillar 0{index + 1}</span>
                <span className="w-2 h-2 rounded-full bg-[#061e14]/20 group-hover:bg-[#C69A33] transition-colors" />
              </div>
            </div>
          ))}
        </div>

        {/* ================= BOTTOM BANNER ================= */}
        <div className="bg-gradient-to-r from-[#061e14] via-[#0b3323] to-slate-900 rounded-3xl p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-lg">
          <div className="space-y-2 text-center sm:text-left max-w-xl">
            <h4 className="font-serif font-bold text-amber-100 text-lg sm:text-xl">
              Commitment to Public Service
            </h4>
            <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
              These values guide every judicial officer and administrative staff member to ensure justice is administered without fear or favor.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/10 border border-[#C69A33]/40 text-xs font-mono font-bold text-[#D4AF37] shrink-0 backdrop-blur-md">
            <FaHeart className="text-[#C69A33]" />
            <span>Serving with Dedication</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CoreValues;
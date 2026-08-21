import React from 'react';
import { FaBullseye, FaEye, FaAward, FaBalanceScale, FaGavel, FaHandshake, FaShieldAlt } from 'react-icons/fa';

interface CoreValue {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const coreValues: CoreValue[] = [
  {
    icon: <FaBalanceScale className="w-5 h-5 text-[#C69A33]" />,
    title: 'Equity & Justice',
    description: 'Upholding impartial, fair, and consistent administration of justice for all individuals.'
  },
  {
    icon: <FaShieldAlt className="w-5 h-5 text-[#C69A33]" />,
    title: 'Integrity',
    description: 'Maintaining the highest standards of ethical conduct, transparency, and public trust.'
  },
  {
    icon: <FaHandshake className="w-5 h-5 text-[#C69A33]" />,
    title: 'Accessibility',
    description: 'Ensuring timely, efficient, and barrier-free access to court services across all stations.'
  },
  {
    icon: <FaGavel className="w-5 h-5 text-[#C69A33]" />,
    title: 'Rule of Law',
    description: 'Safeguarding constitutionalism, judicial independence, and due process.'
  }
];

const Missionandvision: React.FC = () => {
  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* ================= HEADER SECTION ================= */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#061e14]/10 border border-[#061e14]/20 text-xs font-mono font-bold text-[#061e14] uppercase tracking-widest">
            <FaAward className="text-[#C69A33]" />
            <span>Institutional Mandate</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-slate-900 tracking-tight">
            Our Mission, Vision & <span className="text-[#C69A33]">Core Values</span>
          </h1>

          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Guiding our commitment to delivering accessible, expeditious, and impartial judicial services to the public.
          </p>
        </div>

        {/* ================= MISSION & VISION CARDS ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* MISSION CARD */}
          <div className="relative bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-6 overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#061e14]/5 rounded-full blur-2xl group-hover:bg-[#061e14]/10 transition-colors" />

            <div className="space-y-4 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-[#061e14] text-[#D4AF37] flex items-center justify-center shadow-md">
                <FaBullseye className="w-7 h-7" />
              </div>

              <span className="text-xs font-mono font-bold text-[#C69A33] uppercase tracking-wider block">
                Our Purpose
              </span>

              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
                Our Mission
              </h2>

              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                To administer justice independently, impartially, efficiently, and accessibly, protecting constitutional rights and upholding the rule of law through automated registry workflows, standard practice directions, and effective case management.
              </p>
            </div>

            <div className="pt-6 border-t border-slate-100 relative z-10 flex items-center gap-2 text-xs font-mono font-bold text-[#061e14]">
              <span className="w-2 h-2 rounded-full bg-[#C69A33]" />
              <span>Timely & Accessible Service Delivery</span>
            </div>
          </div>

          {/* VISION CARD */}
          <div className="relative bg-gradient-to-br from-[#061e14] via-[#0b3323] to-slate-900 rounded-3xl p-8 sm:p-10 shadow-lg text-white flex flex-col justify-between space-y-6 overflow-hidden group">
            <div className="absolute -right-10 -bottom-10 w-36 h-36 bg-[#C69A33]/10 rounded-full blur-2xl" />

            <div className="space-y-4 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-[#C69A33]/40 text-[#D4AF37] flex items-center justify-center backdrop-blur-md">
                <FaEye className="w-7 h-7" />
              </div>

              <span className="text-xs font-mono font-bold text-[#D4AF37] uppercase tracking-wider block">
                Our Future
              </span>

              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-amber-100">
                Our Vision
              </h2>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                To be an exemplary, modern, and digitally integrated judicial institution that commands public trust, delivers equitable outcomes, and serves as a benchmark for judicial excellence.
              </p>
            </div>

            <div className="pt-6 border-t border-white/10 relative z-10 flex items-center gap-2 text-xs font-mono font-bold text-[#D4AF37]">
              <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
              <span>Digital Transformation & Judicial Integrity</span>
            </div>
          </div>

        </div>

        {/* ================= CORE VALUES GRID ================= */}
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-serif font-bold text-slate-900">
              Guiding Principles
            </h3>
            <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">
              The foundational pillars behind our everyday operations
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {coreValues.map((val, idx) => (
              <div 
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-[#C69A33]/50 transition-all duration-300 space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center">
                  {val.icon}
                </div>
                <h4 className="text-base font-serif font-bold text-slate-900">
                  {val.title}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">
                  {val.description}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Missionandvision;
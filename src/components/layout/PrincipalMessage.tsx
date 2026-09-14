import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FaQuoteLeft, 
  FaCheckCircle, 
  FaArrowRight, 
  FaGavel, 
  FaAward, 
  FaHistory, 
  FaUserTie, 
  FaLaptopCode,
  FaMapMarkerAlt,
  FaSitemap,
  FaLandmark,
  FaUsers
} from 'react-icons/fa';

// Data for the 3 featured showcase cards
const featuredHighlights = [
  {
    title: 'History of the Environment & Land Court',
    subtitle: 'Jurisdiction & Constitutional Evolution',
    icon: FaHistory,
    image: '',
    path: '/about/history',
    tag: 'Archive'
  },
  {
    title: 'Leadership & Governance',
    subtitle: 'Office of the Principal Judge & Committees',
    icon: FaUserTie,
    image: '',
    path: '/leadership/principal-judge',
    tag: 'Governance'
  },
  {
    title: 'ELC Registries & E-Filing',
    subtitle: 'Digital Case Management & Filings',
    icon: FaLaptopCode,
    image: '',
    path: '/registry/principal',
    tag: 'E-Services'
  }
];

// Data for ELC Key Statistics
const elcStats = [
  {
    value: '40',
    label: 'ELC Court Stations',
    description: 'Across Kenyan Counties',
    icon: FaMapMarkerAlt
  },
  {
    value: '5',
    label: 'Sub-Registries',
    description: 'Expanding Access to Land Justice',
    icon: FaSitemap
  },
  {
    value: '3',
    label: 'Specialized Divisions',
    description: 'Environment & Land Matters',
    icon: FaLandmark
  },
  {
    value: '61',
    label: 'ELC Judges',
    description: 'Serving the Republic',
    icon: FaUsers
  }
];

const PrincipalMessage: React.FC = () => {
  return (
    <section className="relative bg-slate-50 py-20 text-slate-800 overflow-hidden border-t border-slate-200">
      {/* Background Accent Glows */}
      <div className="absolute top-1/4 left-0 -translate-y-1/2 w-96 h-96 bg-[#C69A33]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-96 h-96 bg-emerald-900/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-24">
        
        {/* ================= SECTION 1: PRINCIPAL JUDGE KEYNOTE ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Image Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Gold Accent Ring behind the photo */}
              <div className="absolute -inset-3 rounded-3xl bg-gradient-to-tr from-[#C69A33] via-amber-200 to-emerald-800/20 opacity-30 blur-sm -rotate-2" />

              {/* Main Image Container */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-2xl">
                <img
                  src="https://judiciary.go.ke/wp-content/uploads/2024/05/Hon.-Mr.-Justice-Oscar-Amugo-Angote.png"
                  alt="Principal Judge ELC"
                  className="w-full h-[480px] object-cover object-top hover:scale-105 transition-transform duration-700"
                />

                {/* Gradient Overlay for badge contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                {/* Floating Leadership Badge */}
                <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-lg flex items-center justify-between text-slate-900">
                  <div>
                    <p className="text-[10px] text-[#C69A33] font-mono tracking-widest uppercase font-bold">Environment & Land Court</p>
                    <p className="text-sm font-bold">Republic of Kenya</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#061e14] text-[#C69A33]">
                    <FaAward className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Verified Pill */}
              <div className="absolute -top-4 -right-2 sm:-right-4 bg-[#061e14] text-[#D4AF37] border border-[#C69A33]/40 px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 shadow-xl z-20">
                <FaCheckCircle className="text-[#C69A33]" />
                <span>Office of the Principal Judge</span>
              </div>
            </div>
          </div>

          {/* Right Column: Editorial Text */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Tag Header */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-900/10 border border-emerald-900/20 text-xs text-emerald-900 font-medium">
              <FaGavel className="text-[#C69A33]" />
              <span className="font-semibold uppercase tracking-wider">Leadership Keynote</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-slate-900 tracking-tight leading-tight">
              A Message from the <span className="text-[#061e14]">Principal Judge</span>
            </h2>

            {/* Quote Block */}
            <div className="relative pl-6 border-l-4 border-[#C69A33] py-2 my-4 bg-amber-50/60 rounded-r-xl">
              <FaQuoteLeft className="absolute top-2 left-2 text-2xl text-[#C69A33]/30" />
              <p className="text-xl sm:text-2xl font-serif italic text-slate-800 font-semibold leading-relaxed">
                “Environment & Land Justice Delivered Promptly and Fairly”
              </p>
            </div>

            {/* Body Text */}
            <div className="space-y-4 text-slate-600 font-normal text-base sm:text-lg leading-relaxed">
              <p>
                The centrality of the Environment and Land Court (ELC) in the judicial system of Kenya is anchored in <strong className="text-slate-900">Article 162 (2)(b) of the Constitution</strong>, granting exclusive jurisdiction over environmental planning, land use, and title ownership disputes.
              </p>
              <p>
                In alignment with our institutional vision of <span className="text-emerald-900 font-semibold">Social Transformation through Access to Justice (STAJ)</span>, the ELC remains committed to upholding sustainable environmental governance and securing land rights across Kenya.
              </p>
            </div>

            {/* Hashtag Chips */}
            <div className="pt-2 flex flex-wrap gap-2 sm:gap-3">
              <span className="px-3 py-1.5 rounded-lg bg-slate-200/70 border border-slate-300 text-xs font-mono text-slate-700">
                #Article162
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-slate-200/70 border border-slate-300 text-xs font-mono text-slate-700">
                #STAJ_Vision
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-slate-200/70 border border-slate-300 text-xs font-mono text-slate-700">
                #ELC_Kenya
              </span>
            </div>

            {/* Signature & CTA */}
            <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <p className="text-base font-bold text-slate-900 font-serif">Hon. Principal Judge</p>
                <p className="text-xs text-[#C69A33] uppercase tracking-wider font-mono font-bold">Principal Judge, ELC Kenya</p>
              </div>

              <Link
                to="/leadership/principal-judge"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#061e14] hover:bg-[#0a2e1f] text-[#D4AF37] font-bold text-sm transition-all shadow-md group"
              >
                <span>Full Profile & Speeches</span>
                <FaArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

          </div>

        </div>

        {/* ================= SECTION 2: FEATURED SHOWCASE CARDS ================= */}
        <div>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-4 border-b border-slate-200 gap-4">
            <div>
              <p className="text-xs text-[#C69A33] font-mono uppercase tracking-widest font-bold">Court Operations</p>
              <h3 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 mt-1">
                Explore ELC Institutional Frameworks
              </h3>
            </div>
            <p className="text-sm text-slate-500 max-w-md">
              Access historical archives, leadership governance structures, and modern e-registry tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredHighlights.map((item, index) => {
              const Icon = item.icon;
              return (
                <Link
                  key={index}
                  to={item.path}
                  className="group relative rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-md hover:shadow-2xl transition-all duration-500 flex flex-col justify-between h-[360px]"
                >
                  {/* Background Image */}
                  <div className="absolute inset-0 overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 filter grayscale group-hover:grayscale-0"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-900/20 group-hover:opacity-90 transition-opacity" />
                  </div>

                  {/* Top Tag Bar */}
                  <div className="relative z-10 p-6 flex justify-between items-start">
                    <span className="px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/20 text-[10px] font-mono uppercase tracking-wider text-[#D4AF37]">
                      {item.tag}
                    </span>
                    <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md text-[#D4AF37] border border-white/20 group-hover:bg-[#C69A33] group-hover:text-[#061e14] transition-all">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Bottom Label Box */}
                  <div className="relative z-10 p-6">
                    <div className="bg-white/95 backdrop-blur-md p-5 rounded-xl border border-slate-100 shadow-xl group-hover:bg-[#061e14] transition-colors duration-500">
                      <h4 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-white transition-colors leading-snug">
                        {item.title}
                      </h4>
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-500 group-hover:text-[#D4AF37]">
                        <span>{item.subtitle}</span>
                        <FaArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ================= SECTION 3: ELC IMPACT STATISTICS BANNER ================= */}
        <div className="relative rounded-3xl bg-gradient-to-r from-[#061e14] via-[#0a2e1f] to-[#061e14] border border-[#C69A33]/30 p-8 sm:p-12 shadow-2xl overflow-hidden">
          {/* Subtle Background Geometric Lines */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#C69A33]/10 rounded-full blur-[90px] pointer-events-none" />

          <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-8 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
            {elcStats.map((stat, idx) => {
              const StatIcon = stat.icon;
              return (
                <div key={idx} className={`pt-6 sm:pt-0 ${idx !== 0 ? 'sm:pl-8' : ''} text-center sm:text-left space-y-2 group`}>
                  <div className="flex items-center justify-center sm:justify-start gap-3">
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[#C69A33] group-hover:scale-110 group-hover:bg-[#C69A33] group-hover:text-[#061e14] transition-all">
                      <StatIcon className="w-5 h-5" />
                    </div>
                    <span className="text-3xl sm:text-4xl lg:text-5xl font-serif font-extrabold text-white tracking-tight">
                      {stat.value}
                    </span>
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-[#D4AF37] font-serif">{stat.label}</h5>
                    <p className="text-xs text-slate-400 font-light mt-0.5">{stat.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
};

export default PrincipalMessage;
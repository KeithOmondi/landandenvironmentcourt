import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FaBalanceScale, 
  FaBriefcase, 
  FaBuilding, 
  FaFileAlt, 
  FaLandmark, 
  FaArrowRight 
} from 'react-icons/fa';

// Un-exported data array keeps React Fast Refresh happy
const quickNavCards = [
  { title: 'Establishment', icon: FaLandmark, path: '/about/history', tag: 'About' },
  { title: 'Mandate & Jurisdiction', icon: FaBriefcase, path: '/about/mandate', tag: 'Legal Scope' },
  { title: 'Office of Principal Judge', icon: FaBuilding, path: '/leadership/principal-judge', highlighted: true, tag: 'Leadership' },
  { title: 'Office of The Registrar', icon: FaLandmark, path: '/leadership/registrar', tag: 'Administration' },
  { title: 'HiCAC Advisory', icon: FaBalanceScale, path: '/leadership/advisory-committee', tag: 'Committee' },
  { title: 'Principal Registry', icon: FaFileAlt, path: '/registry/principal', tag: 'Records' },
];

const QuickNav: React.FC = () => {
  return (
    <section className="bg-slate-100/80 py-12 border-b border-slate-200">
      <div className="relative z-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickNavCards.map((card, index) => {
            const Icon = card.icon;
            
            // Middle column cards (indices 1 & 4)
            const isMiddleColumn = index % 3 === 1;

            return (
              <Link
                key={index}
                to={card.path}
                className={`relative group flex flex-col justify-between p-6 sm:p-7 rounded-2xl transition-all duration-500 ease-out border overflow-hidden ${
                  isMiddleColumn 
                    ? 'lg:translate-y-4 animate-[bounce_3s_infinite]' // Smoother, slower floating bounce
                    : 'lg:-translate-y-2'
                } hover:!translate-y-0 hover:!animate-none hover:shadow-xl ${
                  card.highlighted
                    ? 'bg-[#061e14] text-white border-[#C69A33] shadow-lg shadow-emerald-950/20'
                    : 'bg-white text-slate-800 border-slate-200 hover:border-[#C69A33] shadow-sm'
                }`}
              >
                {/* Top Gold Accent Bar */}
                <div 
                  className={`absolute top-0 left-0 right-0 h-1 transition-all duration-300 ${
                    card.highlighted ? 'bg-[#C69A33]' : 'bg-transparent group-hover:bg-[#C69A33]'
                  }`} 
                />

                <div>
                  {/* Header Row */}
                  <div className="flex items-center justify-between mb-5">
                    <div 
                      className={`p-3.5 rounded-xl transition-all duration-300 ${
                        card.highlighted
                          ? 'bg-[#C69A33] text-[#061e14] shadow-md'
                          : 'bg-slate-100 border border-slate-200 text-[#061e14] group-hover:bg-[#061e14] group-hover:text-[#D4AF37]'
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span 
                      className={`text-xs font-mono uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                        card.highlighted
                          ? 'text-[#D4AF37] bg-white/5 border-white/10'
                          : 'text-slate-500 bg-slate-100 border-slate-200'
                      }`}
                    >
                      {card.tag}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 
                    className={`text-base sm:text-lg font-bold leading-snug transition-colors ${
                      card.highlighted 
                        ? 'text-white group-hover:text-[#D4AF37]' 
                        : 'text-slate-900 group-hover:text-[#061e14]'
                    }`}
                  >
                    {card.title}
                  </h3>
                </div>

                {/* Action Row */}
                <div 
                  className={`mt-8 pt-4 border-t flex items-center justify-between text-xs sm:text-sm font-medium transition-colors ${
                    card.highlighted
                      ? 'border-white/10 text-slate-300 group-hover:text-white'
                      : 'border-slate-100 text-slate-500 group-hover:text-slate-900'
                  }`}
                >
                  <span className="tracking-wide">Explore Section</span>
                  <div 
                    className={`p-1.5 rounded-full transition-all ${
                      card.highlighted
                        ? 'bg-white/10 text-[#C69A33] group-hover:bg-[#C69A33] group-hover:text-[#061e14]'
                        : 'bg-slate-100 text-slate-600 group-hover:bg-[#061e14] group-hover:text-[#D4AF37]'
                    }`}
                  >
                    <FaArrowRight className="w-3 h-3 transform group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default QuickNav;
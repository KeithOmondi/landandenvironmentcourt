import React, { useState } from 'react';
import { 
  FaChevronDown, 
  FaChevronUp, 
  FaLandmark, 
  FaMapMarkedAlt,
  FaAward 
} from 'react-icons/fa';

interface CompositionMember {
  role: string;
  title: string;
}

interface RegionalCluster {
  id: string;
  name: string;
  stations: string;
}

const committeeComposition: CompositionMember[] = [
  { role: '1', title: 'The Presiding Judge of the Environment and Land Court, who is the Chairperson;' },
  { role: '2', title: 'Vice Chair elected amongst the nominated members of the Committee;' },
  { role: '3', title: 'Co-opted members of the ELC Advisory Committee;' },
  { role: '4', title: 'Presiding Judges nominated by the Presiding Judge through a rotational arrangement amongst Presiding Judges of the Court; and' },
  { role: '5', title: 'The Registrar of the Environment and Land Court.' }
];

const regionalClusters: RegionalCluster[] = [
  { id: 'central', name: 'Central Region', stations: 'Kerugoya, Nyeri, Nanyuki, and Murang\'a.' },
  { id: 'coast', name: 'Coast Region', stations: 'Mombasa, Malindi, and Kwale.' },
  { id: 'lower-eastern', name: 'Lower Eastern Region', stations: 'Machakos, Makueni, and Kitui.' },
  { id: 'upper-eastern', name: 'Upper Eastern Region', stations: 'Embu, Meru, and Isiolo.' },
  { id: 'lower-rift', name: 'Lower Rift Region', stations: 'Nakuru, Narok, Kericho, and Naivasha.' },
  { id: 'upper-rift', name: 'Upper Rift Region', stations: 'Eldoret, Kitale, and Kapenguria.' },
  { id: 'western', name: 'Western Region', stations: 'Kakamega, Bungoma, and Busia.' },
  { id: 'nyanza', name: 'Nyanza Region', stations: 'Kisumu, Kisii, Migori, and Siaya.' },
  { id: 'nairobi', name: 'Nairobi Region', stations: 'Milimani Environment & Land Court Divisions.' }
];

const ElcAdvisoryCommittee: React.FC = () => {
  const [openCluster, setOpenCluster] = useState<string | null>('central');

  const toggleCluster = (id: string) => {
    setOpenCluster((prev) => (prev === id ? null : id));
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-16">

        {/* ================= HERO / TOP SECTION ================= */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm space-y-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
            
            {/* Left Column: Advisory Committee Content */}
            <div className="space-y-6 lg:w-3/5">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#061e14]/10 border border-[#061e14]/20 text-xs font-mono font-bold text-[#061e14] uppercase tracking-widest">
                <FaAward className="text-[#C69A33]" />
                <span>Governance & Oversight</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-slate-900 tracking-tight">
                ELC Advisory Committee <span className="text-[#C69A33]">(ELCAC)</span>
              </h1>

              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                The Environment and Land Court Advisory Committee is established under Section 23(1) of the Environment and Land Court Act as the advisory body to the Presiding Judge. It makes recommendations to the Judicial Service Commission on judicial policy, practice, training, and capacity building for judges and officers of the court.
              </p>

              {/* Composition List */}
              <div className="space-y-3 pt-2">
                <h2 className="text-xs font-mono font-bold text-[#061e14] uppercase tracking-wider">
                  The committee comprises of:
                </h2>
                <ul className="space-y-2.5">
                  {committeeComposition.map((item) => (
                    <li key={item.role} className="flex items-start gap-3 text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
                      <span className="w-5 h-5 rounded-full bg-amber-50 border border-amber-200 text-[#061e14] font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {item.role}
                      </span>
                      <span>{item.title}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-xs text-slate-500 font-mono italic pt-2 border-t border-slate-100">
                The Chief Officer in the Office of the Presiding Judge provides secretariat services to the committee.
              </p>
            </div>

            {/* Right Column: Court Building Image Card */}
            <div className="lg:w-2/5 w-full">
              <div className="relative rounded-2xl overflow-hidden shadow-lg border-4 border-white bg-slate-900 group">
                <img 
                  src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=800" 
                  alt="Court Building" 
                  className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#061e14]/90 via-[#061e14]/30 to-transparent flex flex-col justify-end p-6 text-white">
                  <div className="flex items-center gap-2 text-[#D4AF37] font-mono text-xs font-bold uppercase tracking-wider mb-1">
                    <FaLandmark />
                    <span>Judicial Headquarters</span>
                  </div>
                  <h3 className="font-serif font-bold text-lg">
                    Milimani Law Courts & ELC Registry
                  </h3>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ================= REGIONAL CLUSTERS SECTION ================= */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm space-y-8">
          
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-mono font-bold text-[#C69A33] uppercase">
              <FaMapMarkedAlt />
              <span>Decentralized Operations</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
              ELC Regional Clusters
            </h2>

            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-sans">
              In line with the spirit of STAJ of inclusivity, shared leadership, and informed decision making, the ELCAC devolved its operations and supervisory roles by clustering Environment and Land Courts into regions. Nine regional clusters were established across the country, headed by chairpersons and convenors who are elected by Judges in the region. The clusters aim at streamlining and hastening communication, enhancing peer-review, and strengthening decision-making towards expeditious delivery of justice and improved performance in the Court.
            </p>
          </div>

          {/* Accordion List for Clusters */}
          <div className="space-y-3 pt-2">
            {regionalClusters.map((cluster) => {
              const isOpen = openCluster === cluster.id;
              return (
                <div 
                  key={cluster.id} 
                  className="rounded-2xl border border-slate-200 overflow-hidden transition-all duration-200"
                >
                  <button
                    onClick={() => toggleCluster(cluster.id)}
                    className="w-full flex items-center justify-between px-6 py-4 bg-slate-50 hover:bg-slate-100/80 text-left transition-colors"
                  >
                    <span className="font-serif font-bold text-slate-900 text-sm sm:text-base">
                      {cluster.name}
                    </span>
                    <span className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                      {isOpen ? <FaChevronUp className="w-3 h-3 text-[#C69A33]" /> : <FaChevronDown className="w-3 h-3" />}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-6 py-4 bg-white border-t border-slate-100 text-xs sm:text-sm text-slate-600 font-sans leading-relaxed">
                      {cluster.stations}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </div>
  );
};

export default ElcAdvisoryCommittee;
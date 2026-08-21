import React, { useState, useMemo } from 'react';
import { 
  FaGavel, 
  FaSearch, 
  FaFilter, 
  FaTimes, 
  FaIdCard, 
  FaUserShield, 
  FaGraduationCap, 
  FaAward, 
  FaBuilding,
  FaChevronRight,
  FaMapMarkerAlt,
} from 'react-icons/fa';

interface Judge {
  id: string;
  name: string;
  title: string;
  station: string;
  region: string;
  appointedYear: string;
  bio: string;
  education: string[];
  specializations: string[];
  image: string;
}

const judgesData: Judge[] = [
  {
    id: '1',
    name: 'Hon. Justice Oscar Angote, MBS',
    title: 'Principal Judge, ELC',
    station: 'Nairobi ELC Station',
    region: 'Nairobi',
    appointedYear: '2012',
    bio: 'Hon. Justice Oscar Angote serves as the Principal Judge of the Environment and Land Court of Kenya. He leads the administrative, operational, and strategic directions of ELC stations across the country.',
    education: ['Master of Laws (LL.M) - University of Nairobi', 'Bachelor of Laws (LL.B) - Moi University'],
    specializations: ['Land Use & Governance', 'Environmental Dispute Resolution', 'Judicial Administration'],
    image: '',
  },
  {
    id: '2',
    name: 'Hon. Lady Justice Lucy Mbugua',
    title: 'ELC Judge',
    station: 'Mombasa ELC Station',
    region: 'Coast',
    appointedYear: '2016',
    bio: 'Hon. Lady Justice Lucy Mbugua presides over major coastal land tenure disputes, compulsory acquisition appeals, and marine environment protection matters.',
    education: ['Bachelor of Laws (LL.B) - University of Nairobi', 'Postgraduate Diploma - Kenya School of Law'],
    specializations: ['Maritime & Coastal Land Rights', 'Compulsory Acquisition', 'Commercial Property Rights'],
    image: '',
  },
  {
    id: '3',
    name: 'Hon. Justice Anthony Ombwayo',
    title: 'ELC Judge',
    station: 'Kisumu ELC Station',
    region: 'Nyanza/Western',
    appointedYear: '2014',
    bio: 'Hon. Justice Anthony Ombwayo specializes in water basin environmental protection, customary land rights, and agricultural boundary dispute adjudication.',
    education: ['Master of Laws (LL.M) - University of London', 'Bachelor of Laws (LL.B) - Makerere University'],
    specializations: ['Water Resource Litigation', 'Customary Land Tenure', 'Environmental Impact Compliance'],
    image: '',
  },
  {
    id: '4',
    name: 'Hon. Justice Munyao Sila',
    title: 'ELC Judge',
    station: 'Nakuru ELC Station',
    region: 'Rift Valley',
    appointedYear: '2016',
    bio: 'Hon. Justice Munyao Sila handles complex forest reserve boundary litigations, public land recovery cases, and inter-county physical planning appeals.',
    education: ['Master of Laws in Environmental Law', 'Bachelor of Laws (LL.B) - University of Nairobi'],
    specializations: ['Forest & Wildlife Conservation Law', 'Public Land Recovery', 'Physical Planning'],
    image: '',
  },
  {
    id: '5',
    name: 'Hon. Lady Justice Ann Mwaura',
    title: 'ELC Judge',
    station: 'Nyeri ELC Station',
    region: 'Central',
    appointedYear: '2021',
    bio: 'Hon. Lady Justice Ann Mwaura oversees agricultural property title disputes, succession-related land claims, and communal water access rights.',
    education: ['Bachelor of Laws (LL.B)', 'Diploma in International Environmental Law'],
    specializations: ['Agricultural Land Valuation', 'Community Resource Rights', 'Alternative Dispute Resolution'],
    image: '',
  },
  {
    id: '6',
    name: 'Hon. Justice George Ong’udi',
    title: 'ELC Judge',
    station: 'Eldoret ELC Station',
    region: 'Rift Valley',
    appointedYear: '2018',
    bio: 'Hon. Justice George Ong’udi presides over urban development zoning cases, land rate disputes, and mineral extraction compensation claims.',
    education: ['Bachelor of Laws (LL.B) - Makerere University', 'Postgraduate Diploma - Kenya School of Law'],
    specializations: ['Mining & Natural Resources', 'Urban Zoning & Rates', 'Eminent Domain'],
    image: '',
  },
];

export const JudgesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [selectedJudge, setSelectedJudge] = useState<Judge | null>(null);

  const filteredJudges = useMemo(() => {
    return judgesData.filter((judge) => {
      const matchesSearch = 
        judge.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        judge.station.toLowerCase().includes(searchTerm.toLowerCase()) ||
        judge.title.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRegion = selectedRegion === 'All' || judge.region === selectedRegion;

      return matchesSearch && matchesRegion;
    });
  }, [searchTerm, selectedRegion]);

  return (
    <div className="relative bg-slate-50 min-h-screen text-slate-800 pb-20">
      
      {/* ================= HERO BANNER WITH BACKGROUND IMAGE ================= */}
      <div className="relative bg-[#061e14] text-white overflow-hidden py-20 lg:py-28">
        <div 
          className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-25"
          style={{ 
            backgroundImage: `url('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=1920')` 
          }} 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#061e14]/80 via-[#061e14]/90 to-[#061e14]" />
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#C69A33_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#C69A33]/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-[#C69A33]/40 backdrop-blur-md text-xs font-mono text-[#D4AF37] uppercase tracking-widest font-semibold">
            <FaGavel />
            <span>Judicial Bench</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold text-white tracking-tight max-w-4xl mx-auto">
            Judges of the <span className="text-[#D4AF37]">Environment & Land Court</span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed font-sans">
            Serving across various ELC stations nationwide to ensure accessible, fair, and expeditious resolution of land and environmental disputes.
          </p>

          <div className="pt-8 grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-2xl mx-auto text-center border-t border-white/10">
            <div>
              <span className="block text-2xl font-serif font-bold text-[#D4AF37]">50+</span>
              <span className="text-xs text-slate-400 font-mono">Serving Judges</span>
            </div>
            <div>
              <span className="block text-2xl font-serif font-bold text-[#D4AF37]">38+</span>
              <span className="text-xs text-slate-400 font-mono">County Stations</span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="block text-2xl font-serif font-bold text-[#D4AF37]">100%</span>
              <span className="text-xs text-slate-400 font-mono">E-Filing Integrated</span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= CONTROLS & SEARCH BAR ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-4 sm:p-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search by judge name or station..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#061e14] text-sm"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <FaFilter className="text-[#C69A33]" />
            <span className="text-xs font-mono font-bold text-slate-600 uppercase">Region:</span>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#061e14] font-medium text-slate-700"
            >
              <option value="All">All Regions</option>
              <option value="Nairobi">Nairobi</option>
              <option value="Coast">Coast</option>
              <option value="Rift Valley">Rift Valley</option>
              <option value="Nyanza/Western">Nyanza/Western</option>
              <option value="Central">Central</option>
            </select>
          </div>
        </div>
      </div>

      {/* ================= JUDGES GRID ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <h2 className="text-xl font-serif font-bold text-slate-900">
            Presiding Judicial Officers ({filteredJudges.length})
          </h2>
          <span className="text-xs font-mono text-slate-500">Click card for full profile record</span>
        </div>

        {filteredJudges.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 space-y-3">
            <FaGavel className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-slate-600 font-medium">No judges found matching your criteria.</p>
            <button 
              onClick={() => { setSearchTerm(''); setSelectedRegion('All'); }}
              className="text-xs text-[#C69A33] font-bold font-mono underline"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredJudges.map((judge) => (
              <div
                key={judge.id}
                onClick={() => setSelectedJudge(judge)}
                className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group cursor-pointer"
              >
                <div className="relative h-64 w-full bg-slate-900 overflow-hidden">
                  <img 
                    src={judge.image} 
                    alt={judge.name} 
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                  
                  <div className="absolute top-3 right-3 bg-[#061e14]/90 backdrop-blur-md border border-[#C69A33]/50 px-3 py-1 rounded-full text-[11px] font-mono font-bold text-[#D4AF37]">
                    Appointed {judge.appointedYear}
                  </div>

                  <div className="absolute bottom-3 left-3 right-3">
                    <span className="text-[10px] font-mono text-[#D4AF37] uppercase font-bold tracking-wider block">
                      {judge.title}
                    </span>
                    <h3 className="text-lg font-serif font-bold text-white group-hover:text-[#D4AF37] transition-colors">
                      {judge.name}
                    </h3>
                  </div>
                </div>

                <div className="p-6 flex flex-col justify-between flex-grow space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-slate-600 font-mono">
                      <FaBuilding className="text-[#C69A33]" />
                      <span>{judge.station}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                      {judge.bio}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-[#061e14] font-bold">
                    <span>View Profile</span>
                    <FaChevronRight className="w-3 h-3 text-[#C69A33] group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================= JUDGE DETAILS MODAL (NO IMAGE) ================= */}
      {selectedJudge && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn"
          onClick={() => setSelectedJudge(null)}
        >
          <div 
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden relative transform transition-all duration-300 scale-100 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#061e14] text-white px-6 py-4 flex items-center justify-between border-b border-[#C69A33]/30 shrink-0">
              <div className="flex items-center gap-2 text-xs font-mono tracking-wider uppercase text-[#D4AF37]">
                <FaIdCard className="text-lg" />
                <span>Judicial Credentials Record</span>
              </div>
              <button 
                onClick={() => setSelectedJudge(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Close modal"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
              
              {/* Header Info Block */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#061e14] text-[#D4AF37] text-xs font-mono font-bold uppercase">
                    <FaUserShield className="w-3.5 h-3.5" />
                    <span>{selectedJudge.title}</span>
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    Appointed: <strong className="text-slate-800">{selectedJudge.appointedYear}</strong>
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-serif font-bold text-slate-900">
                    {selectedJudge.name}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs text-slate-700 font-mono">
                  <div className="flex items-center gap-2 bg-white/80 p-2.5 rounded-xl border border-slate-200/80">
                    <FaBuilding className="text-[#C69A33] shrink-0" />
                    <span className="truncate">{selectedJudge.station}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/80 p-2.5 rounded-xl border border-slate-200/80">
                    <FaMapMarkerAlt className="text-[#C69A33] shrink-0" />
                    <span>Region: {selectedJudge.region}</span>
                  </div>
                </div>
              </div>

              {/* Bio Section */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#C69A33] flex items-center gap-2">
                  <FaGavel />
                  <span>Biography & Judicial Role</span>
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
                  {selectedJudge.bio}
                </p>
              </div>

              {/* Academic Qualifications */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#061e14] flex items-center gap-2">
                  <FaGraduationCap className="text-[#C69A33]" />
                  <span>Academic Qualifications</span>
                </h4>
                <ul className="space-y-1.5">
                  {selectedJudge.education.map((edu, index) => (
                    <li key={index} className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      {edu}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Key Jurisprudential Areas */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#061e14] flex items-center gap-2">
                  <FaAward className="text-[#C69A33]" />
                  <span>Key Jurisprudential Areas</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedJudge.specializations.map((spec, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1.5 rounded-xl bg-emerald-950/10 border border-emerald-900/20 text-xs font-medium text-emerald-900"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500 font-mono">
                Status: <span className="text-emerald-600 font-semibold">Active Judicial Officer</span>
              </span>
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

export default JudgesPage;
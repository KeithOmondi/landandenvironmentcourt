import React, { useState } from 'react';
import { 
  FaFolderOpen, 
  FaSearch, 
  FaGavel, 
  FaLaptopCode, 
  FaUserTie, 
  FaPhoneAlt, 
  FaEnvelope, 
  FaChevronRight, 
  FaTimes, 
  FaExternalLinkAlt 
} from 'react-icons/fa';

interface RegistryService {
  id: string;
  title: string;
  category: string;
  description: string;
  turnaroundTime: string;
  requirements: string[];
  actionLabel: string;
  externalLink?: string;
}

const registryServices: RegistryService[] = [
  {
    id: 'efiling',
    title: 'E-Filing & Case Lodgement',
    category: 'Filings',
    description: 'Submit new plaints, notices of motion, petitions, and supporting affidavits online through the Judiciary E-Filing portal.',
    turnaroundTime: 'Immediate (Instant Acknowledgement)',
    requirements: ['Valid Practicing Certificate / National ID', 'PDF Formatted Pleadings', 'Case Fee Payment via M-Pesa/Bank'],
    actionLabel: 'Launch E-Filing Portal',
    externalLink: 'https://efiling.judiciary.go.ke',
  },
  {
    id: 'tracking',
    title: 'Case Tracking & Status Inquiry',
    category: 'Public Services',
    description: 'Track the status of ongoing ELC matters, ruling dates, and judge allocations using your suit number.',
    turnaroundTime: 'Real-time Lookup',
    requirements: ['Valid ELC Case Number (e.g., ELC/E001/2026)', 'Party / Advocate Name'],
    actionLabel: 'Track Case Now',
  },
  {
    id: 'search-records',
    title: 'Official Search of Court Records',
    category: 'Registry Searches',
    description: 'Apply for official inspection of pending or archived land court files, decrees, and title dispute judgments.',
    turnaroundTime: '24–48 Hours',
    requirements: ['Formal Search Application (Form ELC-1)', 'Search Fee Payment receipt', 'ID Copy of Applicant'],
    actionLabel: 'Request File Search',
  },
  {
    id: 'fee-assessment',
    title: 'Court Fees Assessment & Receipting',
    category: 'Finance',
    description: 'Calculate official filing fees for injunctions, valuation-based land claims, and certified true copies.',
    turnaroundTime: 'Same Day Processing',
    requirements: ['Pleading Document Draft', 'Valuation Report (for high-value land suits)'],
    actionLabel: 'View Fee Schedule',
  },
];

const registryOfficials = [
  {
    role: 'Deputy Registrar, ELC Principal Registry',
    location: 'Milimani Law Courts, Block B',
    email: 'deputyregistrarelc@court.go.ke',
    phone: '+254 0730 181 050',
  },
  {
    role: 'Customer Care & Helpdesk Officer',
    location: 'Ground Floor, ELC Registry Wing',
    email: 'elchelpdesk@court.go.ke',
    phone: '+254 0730 181 051',
  },
];

export const ElcRegistry: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeService, setActiveService] = useState<RegistryService | null>(null);

  const filteredServices = registryServices.filter((service) =>
    service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 pb-20">
      
      {/* ================= HERO BANNER ================= */}
      <div className="relative bg-[#061e14] text-white overflow-hidden py-16 lg:py-20">
        <div className="absolute inset-0 bg-gradient-to-b from-[#061e14]/80 via-[#061e14]/90 to-[#061e14]" />
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#C69A33_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-[#C69A33]/40 backdrop-blur-md text-xs font-mono text-[#D4AF37] uppercase tracking-widest font-semibold">
            <FaFolderOpen />
            <span>Judicial Registry Operations</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-white tracking-tight">
            Environment & Land Court <span className="text-[#D4AF37]">Registry</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed font-sans">
            Access official filing procedures, fee assessment schedules, file searches, and registry contacts across all ELC stations.
          </p>
        </div>
      </div>

      {/* ================= SEARCH & QUICK ACTIONS ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-4 sm:p-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          
          <div className="relative w-full md:w-96">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <input
              type="text"
              placeholder="Search registry services, fees, e-filing..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#061e14]"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <a
              href="https://efiling.judiciary.go.ke"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 md:flex-none px-5 py-2.5 rounded-xl bg-[#C69A33] hover:bg-[#b0882b] text-white font-mono text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <FaLaptopCode /> Access E-Filing <FaExternalLinkAlt className="text-[10px]" />
            </a>
          </div>

        </div>
      </div>

      {/* ================= REGISTRY SERVICES GRID ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-6">
        <div className="border-b border-slate-200 pb-4">
          <h2 className="text-xl font-serif font-bold text-slate-900">
            Registry Services & Operations ({filteredServices.length})
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
            >
              <div className="space-y-3">
                <span className="inline-block px-2.5 py-1 rounded bg-[#061e14]/5 text-[#061e14] text-[10px] font-mono font-bold uppercase tracking-wider">
                  {service.category}
                </span>

                <h3 className="text-base font-serif font-bold text-slate-900 leading-snug">
                  {service.title}
                </h3>

                <p className="text-xs text-slate-600 font-sans leading-relaxed line-clamp-3">
                  {service.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="text-[11px] font-mono text-slate-400">
                  <span>Turnaround: </span>
                  <span className="text-slate-700 font-semibold">{service.turnaroundTime}</span>
                </div>

                <button
                  onClick={() => setActiveService(service)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-[#061e14] hover:text-white text-slate-800 text-xs font-mono font-semibold flex items-center justify-between transition-colors group"
                >
                  <span>{service.actionLabel}</span>
                  <FaChevronRight className="text-slate-400 group-hover:text-white transition-colors" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= DEPUTY REGISTRAR & STAFF DIRECTORY ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 space-y-6">
        <div className="border-b border-slate-200 pb-4">
          <h2 className="text-xl font-serif font-bold text-slate-900">
            Registry Leadership & Administration
          </h2>
          <p className="text-xs text-slate-500 font-sans">
            Direct lines to the Deputy Registrar and court registry helpdesk officers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {registryOfficials.map((officer, index) => (
            <div key={index} className="bg-white rounded-2xl border border-slate-200 p-6 flex items-start gap-4">
              <div className="p-3.5 rounded-2xl bg-[#061e14]/5 text-[#061e14] border border-[#061e14]/10 shrink-0">
                <FaUserTie className="w-6 h-6 text-[#C69A33]" />
              </div>

              <div className="space-y-1.5 text-xs font-mono">
                <h3 className="font-serif font-bold text-sm text-slate-900">{officer.role}</h3>
                <p className="text-slate-500">{officer.location}</p>

                <div className="pt-2 space-y-1 text-slate-700">
                  <p className="flex items-center gap-2">
                    <FaEnvelope className="text-[#C69A33]" />
                    <a href={`mailto:${officer.email}`} className="underline font-semibold">{officer.email}</a>
                  </p>
                  <p className="flex items-center gap-2">
                    <FaPhoneAlt className="text-[#C69A33]" />
                    <span>{officer.phone}</span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= SERVICE DETAILS MODAL ================= */}
      {activeService && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn"
          onClick={() => setActiveService(null)}
        >
          <div
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#061e14] text-white px-6 py-4 flex items-center justify-between border-b border-[#C69A33]/30">
              <div className="flex items-center gap-2 text-xs font-mono tracking-wider uppercase text-[#D4AF37]">
                <FaGavel />
                <span>Registry Service Details</span>
              </div>
              <button
                onClick={() => setActiveService(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <span className="px-2.5 py-1 rounded bg-[#061e14]/10 text-[#061e14] font-mono font-bold text-xs">
                {activeService.category}
              </span>

              <h3 className="text-xl font-serif font-bold text-slate-900">
                {activeService.title}
              </h3>

              <p className="text-xs text-slate-600 font-sans leading-relaxed">
                {activeService.description}
              </p>

              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-mono font-bold text-[#C69A33] uppercase">Filing Requirements</h4>
                <ul className="list-disc list-inside text-xs font-mono text-slate-700 space-y-1 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  {activeService.requirements.map((req, idx) => (
                    <li key={idx}>{req}</li>
                  ))}
                </ul>
              </div>

              <div className="text-xs font-mono text-slate-500">
                <strong>Expected Timeline:</strong> {activeService.turnaroundTime}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => setActiveService(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-mono text-xs font-semibold"
              >
                Close
              </button>
              {activeService.externalLink ? (
                <a
                  href={activeService.externalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2 rounded-xl bg-[#C69A33] hover:bg-[#b0882b] text-white font-mono text-xs font-bold flex items-center gap-2 transition-colors"
                >
                  Proceed to Portal <FaExternalLinkAlt />
                </a>
              ) : (
                <button
                  onClick={() => alert(`Redirecting to ${activeService.title} workflow...`)}
                  className="px-5 py-2 rounded-xl bg-[#061e14] hover:bg-slate-800 text-white font-mono text-xs font-bold"
                >
                  Initiate Request
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ElcRegistry;
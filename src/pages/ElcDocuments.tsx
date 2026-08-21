import React, { useState, useMemo } from 'react';
import { 
  FaFilePdf, 
  FaSearch, 
  FaFilter, 
  FaDownload, 
  FaEye, 
  FaFolder, 
  FaCalendarAlt, 
  FaTimes,
  FaFileAlt
} from 'react-icons/fa';

interface DocumentItem {
  id: string;
  title: string;
  category: string;
  station: string;
  date: string;
  fileSize: string;
  description: string;
  fileUrl: string;
}

const documentsData: DocumentItem[] = [
  {
    id: '1',
    title: 'ELC Practice Directions (2023)',
    category: 'Practice Directions',
    station: 'National / All Stations',
    date: '2023-05-12',
    fileSize: '1.4 MB',
    description: 'Updated guidelines for case management, e-filing procedures, and virtual court appearances across all ELC stations.',
    fileUrl: '#',
  },
  {
    id: '2',
    title: 'Environment & Land Court Rules, 2014',
    category: 'Acts & Rules',
    station: 'National / All Stations',
    date: '2014-11-20',
    fileSize: '3.2 MB',
    description: 'Comprehensive procedural rules governing pleadings, applications, and trial protocols in the ELC.',
    fileUrl: '#',
  },
  {
    id: '3',
    title: 'Cause List - Nairobi ELC (Week of Aug 24)',
    category: 'Cause Lists',
    station: 'Nairobi ELC Station',
    date: '2026-08-20',
    fileSize: '450 KB',
    description: 'Scheduled hearings, rulings, and judgments for Courts 1 through 6 at the Nairobi ELC station.',
    fileUrl: '#',
  },
  {
    id: '4',
    title: 'Land Registration Act Excerpt Guide',
    category: 'Guidelines',
    station: 'National / All Stations',
    date: '2022-01-15',
    fileSize: '2.1 MB',
    description: 'Reference guide detailing statutory requirements for land ownership disputes and title cancellations.',
    fileUrl: '#',
  },
  {
    id: '5',
    title: 'Mombasa Station Annual Operations Report',
    category: 'Reports',
    station: 'Mombasa ELC Station',
    date: '2025-12-10',
    fileSize: '5.8 MB',
    description: 'Performance statistics, case clearance rates, and environmental dispute analytics for the Coast region.',
    fileUrl: '#',
  },
];

export const ElcDocuments: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeDoc, setActiveDoc] = useState<DocumentItem | null>(null);

  const filteredDocs = useMemo(() => {
    return documentsData.filter((doc) => {
      const matchesSearch = 
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.station.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = selectedCategory === 'All' || doc.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  return (
    <div className="relative bg-slate-50 min-h-screen text-slate-800 pb-20">
      
      {/* ================= HERO BANNER ================= */}
      <div className="relative bg-[#061e14] text-white overflow-hidden py-16 lg:py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-[#061e14]/80 via-[#061e14]/90 to-[#061e14]" />
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#C69A33_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#C69A33]/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-[#C69A33]/40 backdrop-blur-md text-xs font-mono text-[#D4AF37] uppercase tracking-widest font-semibold">
            <FaFolder />
            <span>Document Repository</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-white tracking-tight max-w-3xl mx-auto">
            ELC <span className="text-[#D4AF37]">Documents </span>
          </h1>
        </div>
      </div>

      {/* ================= CONTROLS & SEARCH BAR ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-4 sm:p-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          
          <div className="relative w-full md:w-96">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search documents by title or station..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#061e14] text-sm"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <FaFilter className="text-[#C69A33]" />
            <span className="text-xs font-mono font-bold text-slate-600 uppercase">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#061e14] font-medium text-slate-700"
            >
              <option value="All">All Categories</option>
              <option value="Practice Directions">Practice Directions</option>
              <option value="Acts & Rules">Acts & Rules</option>
              <option value="Cause Lists">Cause Lists</option>
              <option value="Guidelines">Guidelines</option>
              <option value="Reports">Reports</option>
            </select>
          </div>

        </div>
      </div>

      {/* ================= DOCUMENTS GRID ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <h2 className="text-xl font-serif font-bold text-slate-900">
            Available Documents ({filteredDocs.length})
          </h2>
        </div>

        {filteredDocs.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 space-y-3">
            <FaFileAlt className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-slate-600 font-medium">No documents match your search criteria.</p>
            <button 
              onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }}
              className="text-xs text-[#C69A33] font-bold font-mono underline"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocs.map((doc) => (
              <div 
                key={doc.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between space-y-4 hover:shadow-lg transition-shadow duration-300"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#061e14]/10 text-[#061e14] text-[11px] font-mono font-bold">
                      <FaFilePdf className="text-red-600" />
                      {doc.category}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">{doc.fileSize}</span>
                  </div>

                  <h3 className="text-base font-serif font-bold text-slate-900 leading-snug">
                    {doc.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {doc.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span className="truncate max-w-[150px]">{doc.station}</span>
                    <span className="flex items-center gap-1">
                      <FaCalendarAlt className="text-[#C69A33]" />
                      {doc.date}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button 
                      onClick={() => setActiveDoc(doc)}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <FaEye /> Preview
                    </button>
                    <a 
                      href={doc.fileUrl} 
                      download
                      className="flex-1 py-2 px-3 rounded-xl bg-[#061e14] hover:bg-slate-800 text-white text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <FaDownload className="text-[#D4AF37]" /> Download
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================= PREVIEW MODAL ================= */}
      {activeDoc && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn"
          onClick={() => setActiveDoc(null)}
        >
          <div 
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#061e14] text-white px-6 py-4 flex items-center justify-between border-b border-[#C69A33]/30">
              <div className="flex items-center gap-2 text-xs font-mono tracking-wider uppercase text-[#D4AF37]">
                <FaFilePdf className="text-red-500 text-base" />
                <span>Document Details</span>
              </div>
              <button 
                onClick={() => setActiveDoc(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <span className="inline-block px-2.5 py-1 rounded-md bg-[#061e14]/10 text-[#061e14] text-xs font-mono font-bold">
                {activeDoc.category}
              </span>

              <h3 className="text-xl font-serif font-bold text-slate-900">
                {activeDoc.title}
              </h3>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs text-slate-600 font-mono">
                <p><strong>Station:</strong> {activeDoc.station}</p>
                <p><strong>Date Published:</strong> {activeDoc.date}</p>
                <p><strong>File Size:</strong> {activeDoc.fileSize}</p>
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-mono font-bold text-[#C69A33] uppercase">Summary</h4>
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                  {activeDoc.description}
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button 
                onClick={() => setActiveDoc(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-mono text-xs font-semibold"
              >
                Close
              </button>
              <a 
                href={activeDoc.fileUrl}
                download
                className="px-5 py-2 rounded-xl bg-[#061e14] hover:bg-slate-800 text-white font-mono text-xs font-bold flex items-center gap-2 transition-colors"
              >
                <FaDownload className="text-[#D4AF37]" /> Download File
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ElcDocuments;
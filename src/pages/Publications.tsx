import React, { useState, useMemo } from 'react';
import { 
  FaBookOpen, 
  FaSearch, 
  FaDownload, 
  FaEye, 
  FaTimes, 
  FaFilter, 
  FaCalendarAlt, 
  FaFileAlt,
  FaChevronRight,
  FaChevronLeft
} from 'react-icons/fa';

interface Publication {
  id: string;
  title: string;
  category: 'Practice Directions' | 'Guidelines & Manuals' | 'Reports' | 'Court Rules';
  year: string;
  fileSize: string;
  description: string;
  pages: {
    pageNumber: number;
    title: string;
    content: string;
  }[];
  coverStyle: {
    bgGradient: string;
    accentColor: string;
  };
}

const publicationsData: Publication[] = [
  {
    id: '1',
    title: 'Procedure for Processing of Pro Bono Fees',
    category: 'Guidelines & Manuals',
    year: '2022',
    fileSize: '2.4 MB',
    description: 'Comprehensive guidelines detailing administrative and financial workflows for reviewing and approving pro bono legal representation fees.',
    pages: [
      { pageNumber: 1, title: 'Preliminary Scope', content: 'Section 1: General Principles & Scope for Pro Bono Legal Representation within court registries.' },
      { pageNumber: 2, title: 'Verification Protocols', content: 'Section 2: Verification Procedures & Registry Submission Protocols for Advocate Fee Applications.' },
      { pageNumber: 3, title: 'Disbursement Schedules', content: 'Section 3: Fee Disbursement Workflows, Taxation Schedules, and Financial Audit Trails.' },
      { pageNumber: 4, title: 'Compliance Checklist', content: 'Section 4: Appendices, Statutory Claim Forms, and Standard Pro Bono Compliance Checklist.' }
    ],
    coverStyle: {
      bgGradient: 'from-[#061e14] via-[#0b3323] to-slate-900',
      accentColor: '#C69A33'
    }
  },
  {
    id: '2',
    title: 'Guide on Court Records Disposal',
    category: 'Guidelines & Manuals',
    year: '2021',
    fileSize: '1.8 MB',
    description: 'Standard operating procedures governing retention schedules, archival indexing, microfilming, and lawful destruction of aged court files.',
    pages: [
      { pageNumber: 1, title: 'Statutory Framework', content: 'Chapter 1: Statutory Framework and Constitutional Mandate for Court Records Management.' },
      { pageNumber: 2, title: 'Retention Schedules', content: 'Chapter 2: Classification Schedules, Case Retention Intervals, and Archival Indexing.' },
      { pageNumber: 3, title: 'Digital Preservation', content: 'Chapter 3: Digital Preservation, Microfilming Standards, and Electronic File Backup.' },
      { pageNumber: 4, title: 'Destruction Protocols', content: 'Chapter 4: Destruction Authorization Protocols, Public Notices, and Certificate Issuance.' }
    ],
    coverStyle: {
      bgGradient: 'from-slate-900 via-[#061e14] to-emerald-950',
      accentColor: '#D4AF37'
    }
  },
  {
    id: '3',
    title: 'Practice Directions to Standardize High Court Practice',
    category: 'Practice Directions',
    year: '2022',
    fileSize: '4.1 MB',
    description: 'Official practice directions issued to standardize filing protocols, case management timelines, and virtual court hearing decorum.',
    pages: [
      { pageNumber: 1, title: 'Commencement of Suits', content: 'Part A: Commencement of Proceedings, Electronic Service, and Summons Issuance.' },
      { pageNumber: 2, title: 'Case Management', content: 'Part B: Pre-Trial Case Management, Scheduling Orders, and Pre-Trial Conferences.' },
      { pageNumber: 3, title: 'Virtual Hearing Rules', content: 'Part C: Conduct of Virtual Hearings, Video Registry Decorum, and Evidence Upload.' },
      { pageNumber: 4, title: 'Execution & Taxation', content: 'Part D: Execution of Decrees, Bill of Costs Assessment, and Taxation Procedures.' }
    ],
    coverStyle: {
      bgGradient: 'from-emerald-950 via-[#061e14] to-slate-950',
      accentColor: '#C69A33'
    }
  }
];

const categories = ['All', 'Practice Directions', 'Guidelines & Manuals', 'Reports', 'Court Rules'];

const Publications: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activePublication, setActivePublication] = useState<Publication | null>(null);
  const [modalTurnedPage, setModalTurnedPage] = useState<number>(0);

  const filteredPublications = useMemo(() => {
    return publicationsData.filter((item) => {
      const matchesSearch = 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  const handleOpenReader = (pub: Publication) => {
    setActivePublication(pub);
    setModalTurnedPage(0);
  };

  return (
    <div className="relative bg-slate-50 min-h-screen text-slate-800 pb-24">

      {/* 3D REAL BOOK CSS ANIMATIONS */}
      <style>{`
        .perspective-1200 { perspective: 1200px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .origin-left { transform-origin: left center; }
        .origin-right { transform-origin: right center; }
        .backface-hidden { backface-visibility: hidden; }

        /* CARD HOVER ANIMATIONS */
        .book-container:hover .book-cover-left {
          transform: rotateY(-160deg);
        }
        .book-container:hover .book-page-leaf {
          transform: rotateY(-140deg);
          transition-delay: 0.08s;
        }

        /* REAL PAGE TURN FLIPPER IN MODAL */
        .modal-page-leaf {
          transition: transform 0.8s cubic-bezier(0.645, 0.045, 0.355, 1);
          transform-origin: left center;
        }
        .modal-page-turned {
          transform: rotateY(-180deg);
        }
      `}</style>

      {/* ================= HERO BANNER ================= */}
      <div className="relative bg-[#061e14] text-white overflow-hidden py-20 lg:py-28">
        <div 
          className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-25"
          style={{ 
            backgroundImage: `url('https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&q=80&w=1920')` 
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#061e14]/80 via-[#061e14]/90 to-[#061e14]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-[#C69A33]/40 backdrop-blur-md text-xs font-mono text-[#D4AF37] uppercase tracking-widest font-semibold">
            <FaBookOpen />
            <span>Interactive Judicial Library</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold text-white tracking-tight max-w-4xl mx-auto">
            ELC <span className="text-[#D4AF37]">Publications</span>
          </h1>

        </div>
      </div>

      {/* ================= CONTROLS ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-4 sm:p-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                placeholder="Search publications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#061e14] text-sm"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
              <FaFilter className="text-[#C69A33] shrink-0 hidden sm:block" />
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-[#061e14] text-[#D4AF37] shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ================= CARD GRID ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-8">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <h2 className="text-xl font-serif font-bold text-slate-900">
            Available Publications ({filteredPublications.length})
          </h2>
          <span className="text-xs font-mono text-slate-500">Hover book to open cover • Click to turn pages</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredPublications.map((pub) => (
            <div 
              key={pub.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
            >
              
              {/* 3D BOOK HOVER SPREAD */}
              <div className="flex justify-center py-8 perspective-1200">
                <div 
                  onClick={() => handleOpenReader(pub)}
                  className="book-container relative w-72 h-52 cursor-pointer transform-style-3d transition-transform duration-500 group-hover:scale-105"
                >

                  {/* RIGHT BASE PAGE */}
                  <div className="absolute right-0 w-36 h-52 bg-slate-100 rounded-r-md border-r-2 border-slate-400 shadow-xl p-3 flex flex-col justify-between text-slate-800">
                    <div className="space-y-1">
                      <span className="text-[7px] font-mono font-bold text-[#C69A33] uppercase">Right Inside Page</span>
                      <h4 className="text-[9px] font-serif font-bold text-slate-900 leading-tight">
                        {pub.title}
                      </h4>
                    </div>
                    <p className="text-[8px] font-sans text-slate-600 line-clamp-3 leading-relaxed bg-white/80 p-1.5 rounded border border-slate-200">
                      {pub.description}
                    </p>
                    <div className="text-[7px] font-mono text-slate-400 text-center border-t border-slate-300 pt-1">
                      Click to flip all pages
                    </div>
                  </div>

                  {/* LEFT INSIDE PAGE */}
                  <div className="absolute left-0 w-36 h-52 bg-amber-50 rounded-l-md border-l-2 border-slate-300 p-3 flex flex-col justify-between text-slate-700">
                    <div className="border-b border-amber-200/80 pb-1">
                      <span className="text-[7px] font-mono font-bold text-[#061e14] uppercase">Table of Contents</span>
                    </div>
                    <div className="space-y-1 my-auto text-[8px] font-mono text-slate-600">
                      {pub.pages.map((pg) => (
                        <div key={pg.pageNumber} className="truncate">• Page {pg.pageNumber}: {pg.title}</div>
                      ))}
                    </div>
                    <div className="text-[7px] font-mono text-slate-400 text-center border-t border-amber-200 pt-1">
                      Judiciary of Kenya
                    </div>
                  </div>

                  {/* MIDDLE PAPER LEAF */}
                  <div className="book-page-leaf absolute left-36 w-36 h-52 bg-white rounded-r-md border-r border-slate-300 shadow-md p-3 origin-left transform-style-3d transition-transform duration-700 ease-in-out pointer-events-none">
                    <div className="text-[7px] font-mono text-slate-400">Page 1</div>
                    <div className="w-full h-0.5 bg-slate-200 my-2" />
                    <div className="w-full h-0.5 bg-slate-200 my-2" />
                    <div className="w-3/4 h-0.5 bg-slate-200 my-2" />
                  </div>

                  {/* FRONT HARDCOVER */}
                  <div className={`book-cover-left absolute left-36 w-36 h-52 rounded-r-md shadow-2xl origin-left transform-style-3d transition-transform duration-700 ease-in-out bg-gradient-to-br ${pub.coverStyle.bgGradient} p-3 flex flex-col justify-between text-white border-l-4 border-[#C69A33]`}>
                    <div className="text-center space-y-1">
                      <div className="w-4 h-4 mx-auto rounded-full border border-[#D4AF37] flex items-center justify-center text-[6px] font-mono font-bold text-[#D4AF37]">
                        KE
                      </div>
                      <span className="block text-[6px] font-mono tracking-widest text-slate-300 uppercase">
                        Judiciary
                      </span>
                    </div>

                    <div className="my-auto text-center space-y-1">
                      <h3 className="text-[10px] font-serif font-bold text-amber-200 leading-tight">
                        {pub.title}
                      </h3>
                      <span className="inline-block px-1.5 py-0.5 rounded bg-[#C69A33] text-slate-950 font-mono text-[7px] font-bold">
                        {pub.year}
                      </span>
                    </div>

                    <div className="text-center border-t border-white/20 pt-1">
                      <span className="text-[6px] font-mono text-slate-300 uppercase">
                        Hover to Open
                      </span>
                    </div>
                  </div>

                </div>
              </div>

              {/* CARD DETAILS */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <span className="text-[10px] font-mono uppercase font-bold text-[#C69A33] tracking-wider block">
                  {pub.category}
                </span>
                <h3 className="text-base font-serif font-bold text-slate-900 line-clamp-2">
                  {pub.title}
                </h3>

                <div className="flex items-center justify-between text-xs font-mono text-slate-500 pt-1">
                  <span className="flex items-center gap-1">
                    <FaCalendarAlt className="text-[#C69A33]" /> {pub.year}
                  </span>
                  <span className="flex items-center gap-1">
                    <FaFileAlt className="text-slate-400" /> {pub.fileSize}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => handleOpenReader(pub)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono text-xs font-bold transition-all"
                  >
                    <FaEye className="text-[#061e14]" />
                    <span>Flip Book</span>
                  </button>

                  <button
                    onClick={() => alert(`Downloading ${pub.title}...`)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#061e14] hover:bg-slate-800 text-[#D4AF37] font-mono text-xs font-bold transition-all shadow-sm"
                  >
                    <FaDownload />
                    <span>PDF</span>
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>

      {/* ================= REAL 3D BOOK MODAL READER ================= */}
      {activePublication && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn"
          onClick={() => setActivePublication(null)}
        >
          <div 
            className="bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl max-w-5xl w-full overflow-hidden relative transform transition-all duration-300 max-h-[95vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#061e14] text-white px-6 py-4 flex items-center justify-between border-b border-[#C69A33]/30 shrink-0">
              <div className="flex items-center gap-2 text-xs font-mono tracking-wider uppercase text-[#D4AF37]">
                <FaBookOpen className="text-base" />
                <span>3D Interactive Hardcover Reader</span>
              </div>
              <button 
                onClick={() => setActivePublication(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            {/* REAL 3D BOOK BODY */}
            <div className="p-6 sm:p-10 overflow-y-auto space-y-6 flex-grow flex flex-col justify-between bg-slate-950">
              
              <div className="text-center space-y-1">
                <h3 className="text-xl font-serif font-bold text-amber-100">
                  {activePublication.title}
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  Click on page corners or use controls to flip pages
                </span>
              </div>

              {/* 3D DUAL-PAGE BOOK HARNESS */}
              <div className="relative perspective-1200 my-4 flex justify-center">
                <div className="w-full max-w-3xl min-h-[380px] bg-amber-50 rounded-xl border-4 border-amber-950/80 shadow-2xl grid grid-cols-2 relative transform-style-3d">
                  
                  {/* Spine Crease & Binding Line */}
                  <div className="absolute left-1/2 top-0 bottom-0 w-8 -translate-x-1/2 bg-gradient-to-r from-black/20 via-black/40 to-black/20 z-40 pointer-events-none rounded-sm" />

                  {/* LEFT STATIC PAGE BASE (Cover / TOC) */}
                  <div className="p-6 md:p-8 border-r border-amber-200 flex flex-col justify-between bg-amber-50 rounded-l-lg">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-amber-200 pb-2">
                        <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">Table of Contents</span>
                        <span className="text-[10px] font-mono text-[#061e14] font-bold">Judiciary Kenya</span>
                      </div>
                      <h4 className="font-serif font-bold text-slate-900 text-sm">
                        {activePublication.title}
                      </h4>
                      <div className="space-y-2 pt-2">
                        {activePublication.pages.map((pg) => (
                          <div 
                            key={pg.pageNumber} 
                            onClick={() => setModalTurnedPage(pg.pageNumber - 1)}
                            className={`text-xs font-mono cursor-pointer p-1.5 rounded transition-all ${
                              modalTurnedPage >= pg.pageNumber - 1 
                                ? 'text-[#061e14] font-bold bg-amber-100/80' 
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            Page {pg.pageNumber}: {pg.title}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="text-center text-[9px] font-mono text-slate-400 border-t border-amber-200/80 pt-2">
                      Republic of Kenya • Official Copy
                    </div>
                  </div>

                  {/* RIGHT STATIC PAGE BASE (Final Page / End) */}
                  <div className="p-6 md:p-8 flex flex-col justify-between bg-amber-50 rounded-r-lg">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-amber-200 pb-2">
                        <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">End of Document</span>
                        <span className="text-[10px] font-mono text-[#C69A33] font-bold">Complete</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-sans">
                        You have reached the end of the interactive preview pages for this publication. Download the full PDF for complete references and annexures.
                      </p>
                    </div>

                    <div className="text-center text-[9px] font-mono text-slate-400 border-t border-amber-200/80 pt-2">
                      Registry Index: {activePublication.id}
                    </div>
                  </div>

                  {/* STACK OF PHYSICAL FLIPPABLE PAGES */}
                  {activePublication.pages.map((page, index) => {
                    const isTurned = modalTurnedPage > index;
                    return (
                      <div
                        key={page.pageNumber}
                        onClick={() => {
                          if (isTurned) {
                            setModalTurnedPage(index);
                          } else {
                            setModalTurnedPage(index + 1);
                          }
                        }}
                        style={{ zIndex: activePublication.pages.length - index + 10 }}
                        className={`modal-page-leaf absolute left-1/2 top-0 bottom-0 w-1/2 bg-amber-50 rounded-r-lg border-r border-amber-300 shadow-md p-6 md:p-8 flex flex-col justify-between cursor-pointer transform-style-3d ${
                          isTurned ? 'modal-page-turned' : ''
                        }`}
                      >
                        {/* FRONT OF PAGE */}
                        <div className="backface-hidden space-y-4">
                          <div className="flex justify-between items-center border-b border-amber-200 pb-2">
                            <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">
                              Page {page.pageNumber}
                            </span>
                            <span className="text-[10px] font-mono text-[#C69A33] font-bold">
                              Click to Flip ➔
                            </span>
                          </div>

                          <h4 className="font-serif font-bold text-slate-900 text-sm">
                            {page.title}
                          </h4>

                          <div className="bg-white p-4 rounded-xl border border-amber-200/80 text-xs text-slate-800 font-mono leading-relaxed shadow-sm">
                            {page.content}
                          </div>
                        </div>

                        {/* BACK OF PAGE (REVERSE SIDE) */}
                        <div 
                          className="backface-hidden absolute inset-0 bg-amber-100/90 rounded-l-lg border-l border-amber-300 p-6 md:p-8 flex flex-col justify-between text-slate-700"
                          style={{ transform: 'rotateY(180deg)' }}
                        >
                          <div className="space-y-2">
                            <div className="flex justify-between items-center border-b border-amber-300 pb-2">
                              <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">
                                ↵ Click to Flip Back
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                Page {page.pageNumber} Reverse
                              </span>
                            </div>
                            <p className="text-[11px] font-mono text-slate-600">
                              Notes & Annotations for {page.title}
                            </p>
                          </div>
                          <div className="text-center text-[9px] font-mono text-slate-400">
                            Judicial Gazette
                          </div>
                        </div>

                      </div>
                    );
                  })}

                </div>
              </div>

              {/* CONTROLS */}
              <div className="flex items-center justify-between pt-2 max-w-3xl mx-auto w-full">
                <button
                  disabled={modalTurnedPage === 0}
                  onClick={() => setModalTurnedPage((prev) => Math.max(0, prev - 1))}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-mono text-xs font-bold transition-all border border-slate-700"
                >
                  <FaChevronLeft />
                  <span>Turn Back</span>
                </button>

                <div className="flex gap-2">
                  {activePublication.pages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setModalTurnedPage(idx + 1)}
                      className={`w-3.5 h-3.5 rounded-full transition-all ${
                        modalTurnedPage > idx ? 'bg-[#D4AF37] scale-125 shadow-md' : 'bg-slate-700 hover:bg-slate-600'
                      }`}
                    />
                  ))}
                </div>

                <button
                  disabled={modalTurnedPage >= activePublication.pages.length}
                  onClick={() => setModalTurnedPage((prev) => Math.min(activePublication.pages.length, prev + 1))}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C69A33] hover:bg-amber-600 disabled:opacity-30 text-slate-950 font-mono text-xs font-bold transition-all shadow-md"
                >
                  <span>Turn Next Page</span>
                  <FaChevronRight />
                </button>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between shrink-0">
              <button
                onClick={() => setActivePublication(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs font-bold transition-all"
              >
                Close Book
              </button>

              <button
                onClick={() => alert(`Downloading ${activePublication.title}`)}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#061e14] hover:bg-slate-800 text-[#D4AF37] border border-[#C69A33]/40 font-mono text-xs font-bold transition-all shadow-md"
              >
                <FaDownload />
                <span>Download PDF ({activePublication.fileSize})</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Publications;
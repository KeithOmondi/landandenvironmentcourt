import React, { useState, useEffect } from 'react';
import { 
  FaSearch, 
  FaGavel, 
  FaVideo, 
  FaFileAlt, 
  FaChevronRight, 
  FaBalanceScale,
  FaUniversity,
  FaChevronLeft,
} from 'react-icons/fa';
import { Link } from 'react-router-dom';

const slideImages = [
  'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=1920',
  'https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&q=80&w=1920',
  'https://images.unsplash.com/photo-1436450412740-6b988f486c6b?auto=format&fit=crop&q=80&w=1920'
];



const Hero: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'causelist' | 'judgments' | 'efiling'>('causelist');
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev === slideImages.length - 1 ? 0 : prev + 1));
    }, 6000);
    return () => clearInterval(slideInterval);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev === slideImages.length - 1 ? 0 : prev + 1));
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? slideImages.length - 1 : prev - 1));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    console.log(`Searching: ${searchQuery}`);
  };

  return (
    <div className="relative bg-[#061e14] text-white overflow-hidden">
      
      {/* HERO TOP SECTION */}
      <div className="relative flex items-center pt-12 pb-12 sm:pt-16 sm:pb-16">
        {/* Background Slider */}
        <div className="absolute inset-0 z-0">
          {slideImages.map((img, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === currentSlide ? 'opacity-100 scale-105' : 'opacity-0 scale-100'
              } transition-transform duration-[6000ms]`}
            >
              <img src={img} alt={`Court Slide ${index + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
          <div className="absolute inset-0 bg-gradient-to-r from-[#061e14] via-[#061e14]/95 to-[#061e14]/70" />
        </div>

        {/* Watermark */}
        <FaBalanceScale className="absolute right-[-5%] bottom-[-10%] text-[480px] text-white/[0.02] pointer-events-none select-none z-10" />

        {/* Main Hero Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Column */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/60 border border-[#C69A33]/30 text-xs sm:text-sm text-[#C69A33] backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-medium tracking-wide">Judiciary E-Services Portal Active</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-white tracking-tight leading-[1.15]">
                Enhancing <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB]">Access</span> to Justice for All
              </h1>

              <p className="text-gray-300 font-serif text-base sm:text-lg max-w-2xl font-light leading-relaxed">
                Welcome to the official website of the Environment and Land Court. Search daily cause lists, review judgments, and manage filings directly online.
              </p>

              {/* Quick Badges */}
              <div className="pt-4 grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-[#C69A33] backdrop-blur-md">
                    <FaGavel className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-gray-400">Jurisdiction</p>
                    <p className="text-sm font-semibold text-white">Constitutional</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-[#C69A33] backdrop-blur-md">
                    <FaVideo className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-gray-400">Hearings</p>
                    <p className="text-sm font-semibold text-white">Virtual Courts</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 col-span-2 sm:col-span-1">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-[#C69A33] backdrop-blur-md">
                    <FaUniversity className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-gray-400">Stations</p>
                    <p className="text-sm font-semibold text-white">Countrywide</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Search Card */}
            <div className="lg:col-span-5">
              <div className="bg-[#0b281c]/80 backdrop-blur-xl border border-[#C69A33]/30 rounded-2xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white tracking-wide">Quick Access Portal</h2>
                  <span className="text-[10px] bg-[#C69A33]/20 border border-[#C69A33]/40 text-[#D4AF37] px-2.5 py-1 rounded-full font-mono uppercase tracking-widest">
                    Self-Service
                  </span>
                </div>
                <p className="text-xs text-gray-300 mb-6">Access public records, court listings, and electronic filing modules.</p>

                {/* Tabs */}
                <div className="grid grid-cols-3 gap-1 bg-[#04140d] p-1 rounded-xl mb-6 text-xs font-medium border border-white/5">
                  <button
                    type="button"
                    onClick={() => setActiveTab('causelist')}
                    className={`py-2.5 px-3 rounded-lg transition-all ${
                      activeTab === 'causelist' ? 'bg-[#C69A33] text-[#061e14] font-bold shadow-md' : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    Cause List
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('judgments')}
                    className={`py-2.5 px-3 rounded-lg transition-all ${
                      activeTab === 'judgments' ? 'bg-[#C69A33] text-[#061e14] font-bold shadow-md' : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    Decisions
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('efiling')}
                    className={`py-2.5 px-3 rounded-lg transition-all ${
                      activeTab === 'efiling' ? 'bg-[#C69A33] text-[#061e14] font-bold shadow-md' : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    e-Filing
                  </button>
                </div>

                {/* Search Form */}
                <form onSubmit={handleSearch} className="space-y-4">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={
                        activeTab === 'causelist'
                          ? 'Search by Case No. or Party Name...'
                          : activeTab === 'judgments'
                          ? 'Search Judgments / Rulings...'
                          : 'Enter Case Reference No...'
                      }
                      className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-white/95 text-gray-900 placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#C69A33]"
                    />
                    <FaSearch className="absolute left-3.5 top-4 text-gray-400" />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-gradient-to-r from-[#C69A33] to-[#D4AF37] hover:brightness-110 text-[#061e14] font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group"
                  >
                    <span>
                      {activeTab === 'causelist' && 'Find Cause List'}
                      {activeTab === 'judgments' && 'Search Decisions'}
                      {activeTab === 'efiling' && 'Proceed to Portal'}
                    </span>
                    <FaChevronRight className="text-xs group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>

                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-gray-300">
                  <span>Need legal forms?</span>
                  <Link to="/media/documents" className="text-[#D4AF37] hover:underline flex items-center gap-1 font-semibold">
                    <FaFileAlt className="text-xs" /> Download Documents
                  </Link>
                </div>
              </div>
            </div>

          </div>

          {/* Slider Controls */}
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {slideImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentSlide ? 'w-8 bg-[#C69A33]' : 'w-2 bg-white/30 hover:bg-white/60'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button onClick={prevSlide} className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition text-xs backdrop-blur-md">
                <FaChevronLeft />
              </button>
              <button onClick={nextSlide} className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition text-xs backdrop-blur-md">
                <FaChevronRight />
              </button>
            </div>
          </div>
        </div>
      </div>

    

    </div>
  );
};

export default Hero;
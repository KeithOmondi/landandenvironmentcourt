import React, { useState, useMemo } from 'react';
import {  
  FaSearch, 
  FaFilter, 
  FaEye, 
  FaGavel, 
  FaBuilding, 
  FaClock, 
  FaTimes,
  FaFilePdf,
  FaExclamationCircle
} from 'react-icons/fa';

interface CauseListItem {
  id: string;
  caseNumber: string;
  parties: string;
  presidingJudge: string;
  courtRoom: string;
  station: string;
  date: string;
  time: string;
  caseType: string;
  activity: string; // e.g., Hearing, Ruling, Judgment, Notice Motion
  status: 'Scheduled' | 'In Progress' | 'Adjourned' | 'Concluded';
  fileUrl: string;
}

const mockCauseList: CauseListItem[] = [
  {
    id: '1',
    caseNumber: 'ELC/E001/2024',
    parties: 'Kamau Njenga vs. County Government of Nairobi & 2 Others',
    presidingJudge: 'Hon. Justice A. Ong’udi',
    courtRoom: 'Court 1 (Milimani ELC)',
    station: 'Nairobi ELC',
    date: '2026-08-21',
    time: '09:00 AM',
    caseType: 'Land Boundary Dispute',
    activity: 'Hearing',
    status: 'Scheduled',
    fileUrl: '#',
  },
  {
    id: '2',
    caseNumber: 'ELC/A142/2023',
    parties: 'Rift Valley Farmers Co-op vs. Registrar of Titles',
    presidingJudge: 'Hon. Justice C. Yano',
    courtRoom: 'Court 3 (Milimani ELC)',
    station: 'Nairobi ELC',
    date: '2026-08-21',
    time: '10:30 AM',
    caseType: 'Title Cancellation Appeal',
    activity: 'Ruling',
    status: 'In Progress',
    fileUrl: '#',
  },
  {
    id: '3',
    caseNumber: 'ELC/MISC/089/2025',
    parties: 'National Environment Management Authority (NEMA) vs. Apex Developers Ltd',
    presidingJudge: 'Hon. Justice S. Okong’o',
    courtRoom: 'Court 2 (Mombasa ELC)',
    station: 'Mombasa ELC',
    date: '2026-08-21',
    time: '11:00 AM',
    caseType: 'Environmental Degradation Order',
    activity: 'Injunction Application',
    status: 'Scheduled',
    fileUrl: '#',
  },
  {
    id: '4',
    caseNumber: 'ELC/045/2022',
    parties: 'Wanjiku Mwangi vs. Peter Ochieng & Land Registrar Nakuru',
    presidingJudge: 'Hon. Justice Y. Angima',
    courtRoom: 'Court 1 (Nakuru ELC)',
    station: 'Nakuru ELC',
    date: '2026-08-22',
    time: '09:30 AM',
    caseType: 'Adverse Possession Claim',
    activity: 'Judgment',
    status: 'Scheduled',
    fileUrl: '#',
  },
  {
    id: '5',
    caseNumber: 'ELC/E310/2024',
    parties: 'Kisumu Green Belt Conservation Trust vs. Municipal Board',
    presidingJudge: 'Hon. Justice M. Komingoi',
    courtRoom: 'Court 2 (Kisumu ELC)',
    station: 'Kisumu ELC',
    date: '2026-08-22',
    time: '02:00 PM',
    caseType: 'Public Riparian Reserve Dispute',
    activity: 'Mention',
    status: 'Scheduled',
    fileUrl: '#',
  },
];

export const CauseList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStation, setSelectedStation] = useState('All');
  const [selectedDate, setSelectedDate] = useState('2026-08-21');
  const [selectedActivity, setSelectedActivity] = useState('All');
  const [activeCase, setActiveCase] = useState<CauseListItem | null>(null);

  const filteredList = useMemo(() => {
    return mockCauseList.filter((item) => {
      const matchesSearch =
        item.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.parties.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.presidingJudge.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStation = selectedStation === 'All' || item.station === selectedStation;
      const matchesDate = !selectedDate || item.date === selectedDate;
      const matchesActivity = selectedActivity === 'All' || item.activity === selectedActivity;

      return matchesSearch && matchesStation && matchesDate && matchesActivity;
    });
  }, [searchTerm, selectedStation, selectedDate, selectedActivity]);

  const getStatusBadge = (status: CauseListItem['status']) => {
    switch (status) {
      case 'In Progress':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Adjourned':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'Concluded':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 pb-20">
      
      {/* ================= HERO BANNER ================= */}
      <div className="relative bg-[#061e14] text-white overflow-hidden py-16 lg:py-20">
        <div className="absolute inset-0 bg-gradient-to-b from-[#061e14]/80 via-[#061e14]/90 to-[#061e14]" />
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#C69A33_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-[#C69A33]/40 backdrop-blur-md text-xs font-mono text-[#D4AF37] uppercase tracking-widest font-semibold">
            <FaGavel />
            <span>Daily Court Schedule</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-white tracking-tight">
            Environment & Land Court <span className="text-[#D4AF37]">Cause List</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed font-sans">
            Search daily proceedings, hearing schedules, presiding judges, and court room allocations across ELC stations.
          </p>
        </div>
      </div>

      {/* ================= CONTROLS & FILTERS ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-4 sm:p-6 space-y-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Search input */}
            <div className="relative">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
              <input
                type="text"
                placeholder="Search case #, parties, judge..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#061e14]"
              />
            </div>

            {/* Date filter */}
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#061e14] font-mono text-slate-700"
              />
            </div>

            {/* Station dropdown */}
            <div className="flex items-center gap-2">
              <FaBuilding className="text-[#C69A33] shrink-0" />
              <select
                value={selectedStation}
                onChange={(e) => setSelectedStation(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-[#061e14] font-medium text-slate-700"
              >
                <option value="All">All Stations</option>
                <option value="Nairobi ELC">Nairobi ELC</option>
                <option value="Mombasa ELC">Mombasa ELC</option>
                <option value="Nakuru ELC">Nakuru ELC</option>
                <option value="Kisumu ELC">Kisumu ELC</option>
              </select>
            </div>

            {/* Activity dropdown */}
            <div className="flex items-center gap-2">
              <FaFilter className="text-[#C69A33] shrink-0" />
              <select
                value={selectedActivity}
                onChange={(e) => setSelectedActivity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-[#061e14] font-medium text-slate-700"
              >
                <option value="All">All Activities</option>
                <option value="Hearing">Hearing</option>
                <option value="Ruling">Ruling</option>
                <option value="Judgment">Judgment</option>
                <option value="Mention">Mention</option>
                <option value="Injunction Application">Injunction Application</option>
              </select>
            </div>

          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-mono text-slate-500">
            <span>Showing <strong>{filteredList.length}</strong> scheduled items</span>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedStation('All');
                setSelectedDate('');
                setSelectedActivity('All');
              }}
              className="text-[#C69A33] font-bold underline hover:text-[#061e14]"
            >
              Clear Filters
            </button>
          </div>

        </div>
      </div>

      {/* ================= CAUSE LIST TABLE / CARDS ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-6">
        
        {filteredList.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 space-y-3">
            <FaExclamationCircle className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-slate-600 font-medium">No cause list items match your filter criteria.</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#061e14] text-white text-[11px] font-mono uppercase tracking-wider">
                    <th className="py-4 px-6">Time & Room</th>
                    <th className="py-4 px-6">Case Number & Parties</th>
                    <th className="py-4 px-6">Presiding Judge</th>
                    <th className="py-4 px-6">Activity</th>
                    <th className="py-4 px-6 text-center">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      
                      {/* Time & Room */}
                      <td className="py-4 px-6 align-top font-mono">
                        <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                          <FaClock className="text-[#C69A33]" />
                          <span>{item.time}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">{item.courtRoom}</div>
                        <div className="text-[10px] text-slate-400 font-semibold">{item.station}</div>
                      </td>

                      {/* Case Number & Parties */}
                      <td className="py-4 px-6 align-top max-w-xs sm:max-w-md">
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[#061e14] font-mono font-bold text-[11px] mb-1">
                          {item.caseNumber}
                        </span>
                        <p className="font-semibold text-slate-900 leading-snug line-clamp-2">
                          {item.parties}
                        </p>
                        <span className="text-[10px] font-mono text-slate-400 block mt-1">
                          Type: {item.caseType}
                        </span>
                      </td>

                      {/* Presiding Judge */}
                      <td className="py-4 px-6 align-top font-serif font-bold text-slate-800">
                        {item.presidingJudge}
                      </td>

                      {/* Activity */}
                      <td className="py-4 px-6 align-top">
                        <span className="px-2.5 py-1 rounded-md bg-[#061e14]/5 border border-[#061e14]/10 text-[#061e14] font-mono font-bold text-[11px]">
                          {item.activity}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-6 align-top text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full border text-[10px] font-mono font-bold uppercase tracking-wider ${getStatusBadge(item.status)}`}>
                          {item.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 align-top text-right space-x-2">
                        <button
                          onClick={() => setActiveCase(item)}
                          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors inline-flex items-center gap-1 text-[11px] font-mono"
                          title="View Details"
                        >
                          <FaEye /> Details
                        </button>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* ================= CASE DETAILS MODAL ================= */}
      {activeCase && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn"
          onClick={() => setActiveCase(null)}
        >
          <div 
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#061e14] text-white px-6 py-4 flex items-center justify-between border-b border-[#C69A33]/30">
              <div className="flex items-center gap-2 text-xs font-mono tracking-wider uppercase text-[#D4AF37]">
                <FaGavel />
                <span>Cause List Summary</span>
              </div>
              <button 
                onClick={() => setActiveCase(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded bg-[#061e14]/10 text-[#061e14] font-mono font-bold text-xs">
                  {activeCase.caseNumber}
                </span>
                <span className={`px-2.5 py-1 rounded-full border text-[10px] font-mono font-bold uppercase ${getStatusBadge(activeCase.status)}`}>
                  {activeCase.status}
                </span>
              </div>

              <h3 className="text-base font-serif font-bold text-slate-900 leading-snug">
                {activeCase.parties}
              </h3>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs font-mono text-slate-700">
                <p><strong>Presiding Judge:</strong> {activeCase.presidingJudge}</p>
                <p><strong>Court Station:</strong> {activeCase.station} ({activeCase.courtRoom})</p>
                <p><strong>Date & Time:</strong> {activeCase.date} at {activeCase.time}</p>
                <p><strong>Scheduled Activity:</strong> {activeCase.activity}</p>
                <p><strong>Category:</strong> {activeCase.caseType}</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button 
                onClick={() => setActiveCase(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-mono text-xs font-semibold"
              >
                Close
              </button>
              <a 
                href={activeCase.fileUrl} 
                download
                className="px-4 py-2 rounded-xl bg-[#061e14] hover:bg-slate-800 text-white font-mono text-xs font-bold flex items-center gap-2"
              >
                <FaFilePdf className="text-red-400" /> Download Cause List PDF
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CauseList;
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaChevronDown, 
  FaBars, 
  FaTimes, 
  FaSearch, 
  FaBalanceScale 
} from 'react-icons/fa';
import logo from '../../assets/logo.png.jpg'; // Update path to your local logo asset

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const toggleDropdown = (menu: string) => {
    setOpenDropdown(openDropdown === menu ? null : menu);
  };

  const toggleMobileMenu = () => {
    setIsOpen(!isOpen);
    setOpenDropdown(null);
  };

  return (
    <header className="w-full font-sans sticky top-0 z-50 shadow-md">
    

      {/* Main Navigation Bar */}
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo from assets */}
            <Link to="/" className="flex items-center flex-shrink-0">
              <img src={logo} alt="The High Court of Kenya Logo" className="h-14 w-auto object-contain" />
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center space-x-1 text-sm font-medium text-gray-800">
              {/* Home (Gold active highlight) */}
              <Link to="/" className="px-3 py-2 text-[#B8860B] font-semibold hover:text-[#966d08]">
                Home
              </Link>

              {/* About Us Dropdown */}
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('about')}
                  className="flex items-center px-3 py-2 hover:text-[#B8860B] transition"
                >
                  About Us
                  <FaChevronDown className={`ml-1 h-3 w-3 transition-transform ${openDropdown === 'about' ? 'rotate-180' : ''}`} />
                </button>
                {openDropdown === 'about' && (
                  <div className="absolute left-0 mt-2 w-56 bg-white rounded-sm shadow-xl border border-gray-100 py-2 z-50">
                    <Link to="/about/mandate" className="block px-4 py-2 hover:bg-gray-50 hover:text-[#B8860B]">Mandate and Jurisdiction</Link>
                    <Link to="/about/history" className="block px-4 py-2 hover:bg-gray-50 hover:text-[#B8860B]">History of ELC</Link>
                    <Link to="/about/vision" className="block px-4 py-2 hover:bg-gray-50 hover:text-[#B8860B]">Vision, Mission and Motto</Link>

                  </div>
                )}
              </div>

              {/* Leadership Dropdown */}
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('leadership')}
                  className="flex items-center px-3 py-2 hover:text-[#B8860B] transition"
                >
                  Leadership
                  <FaChevronDown className={`ml-1 h-3 w-3 transition-transform ${openDropdown === 'leadership' ? 'rotate-180' : ''}`} />
                </button>
                {openDropdown === 'leadership' && (
                  <div className="absolute left-0 mt-2 w-64 bg-white rounded-sm shadow-xl border border-gray-100 py-2 z-50">
                    <Link to="/leadership/principal-judge" className="block px-4 py-2 hover:bg-gray-50 hover:text-[#B8860B]">Office of The Principal Judge</Link>
                    {/* <Link to="/leadership/presiding-judges" className="block px-4 py-2 hover:bg-gray-50 hover:text-[#B8860B]">Presiding Judges</Link>  */}
                    <Link to="/leadership/advisory-committee" className="block px-4 py-2 hover:bg-gray-50 hover:text-[#B8860B]">ELC Advisory Committee</Link>
                    <Link to="/leadership/registrar" className="block px-4 py-2 hover:bg-gray-50 hover:text-[#B8860B]">Office of The Registrar</Link>
                  </div>
                )}
              </div>

              {/* Judges */}
              <Link to="/elc-judges" className="px-3 py-2 hover:text-[#B8860B] transition">
                Judges
              </Link>

              {/* Court Registry Dropdown */}
              <div className="relative">
                 <Link to="/elc-registry" className="px-3 py-2 hover:text-[#B8860B] transition">
                Court Registry
              </Link>
              </div>

              {/* Principal Registry 
              <Link to="/registry/principal" className="px-3 py-2 hover:text-[#B8860B] transition">
                Principal Registry
              </Link>*/}

              {/* Media Center Dropdown */}
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('media')}
                  className="flex items-center px-3 py-2 hover:text-[#B8860B] transition"
                >
                  Media Center
                  <FaChevronDown className={`ml-1 h-3 w-3 transition-transform ${openDropdown === 'media' ? 'rotate-180' : ''}`} />
                </button>
                {openDropdown === 'media' && (
                  <div className="absolute left-0 mt-2 w-52 bg-white rounded-sm shadow-xl border border-gray-100 py-2 z-50">
                    <Link to="/media/news" className="block px-4 py-2 hover:bg-gray-50 hover:text-[#B8860B]">News</Link>
                    <Link to="/media/events" className="block px-4 py-2 hover:bg-gray-50 hover:text-[#B8860B]">Events</Link>
                    <Link to="/media/publications" className="block px-4 py-2 hover:bg-gray-50 hover:text-[#B8860B]">Publications</Link>
                    <Link to="/media/documents" className="block px-4 py-2 hover:bg-gray-50 hover:text-[#B8860B]">Documents</Link>
                    <Link to="/media/tributes" className="block px-4 py-2 hover:bg-gray-50 hover:text-[#B8860B]">Tributes</Link>
                  </div>
                )}
              </div>

              {/* Contact Us */}
              <Link to="/contact" className="px-3 py-2 hover:text-[#B8860B] transition">
                Contact Us
              </Link>
            </div>

            {/* Right Action Items: Search Icon & Bordered e-Filing Button */}
            <div className="hidden lg:flex items-center space-x-5">
              <button className="text-gray-600 hover:text-[#0A2E1F] p-1 focus:outline-none" aria-label="Search">
                <FaSearch className="w-4 h-4" />
              </button>

              <Link
                to="/efiling"
                className="flex items-center gap-2 px-4 py-2 border-2 border-[#0A2E1F] text-[#0A2E1F] font-semibold text-sm hover:bg-[#0A2E1F] hover:text-white transition-all rounded-sm"
              >
                <FaBalanceScale className="text-lg" />
                <span>e-Filing</span>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden text-gray-800 hover:text-[#0A2E1F] focus:outline-none"
            >
              {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>
          </div>

          {/* Mobile Navigation Menu */}
          {isOpen && (
            <div className="lg:hidden py-4 border-t border-gray-200 bg-white">
              <div className="space-y-1 text-sm font-medium">
                <Link to="/" className="block px-3 py-2 text-[#B8860B] font-bold">
                  Home
                </Link>

                {/* Mobile About Dropdown */}
                <button
                  onClick={() => toggleDropdown('mobile-about')}
                  className="flex items-center justify-between w-full px-3 py-2 text-gray-700"
                >
                  About Us
                  <FaChevronDown className={`h-3 w-3 transition-transform ${openDropdown === 'mobile-about' ? 'rotate-180' : ''}`} />
                </button>
                {openDropdown === 'mobile-about' && (
                  <div className="pl-6 space-y-1 text-gray-600">
                    <Link to="/about/mandate" className="block py-1">Mandate and Jurisdiction</Link>
                    <Link to="/about/history" className="block py-1">History of the High Court</Link>
                    <Link to="/about/vision" className="block py-1">Vision, Mission and Motto</Link>
                    <Link to="/about/values" className="block py-1">Core Values</Link>
                  </div>
                )}

                {/* Mobile Leadership Dropdown */}
                <button
                  onClick={() => toggleDropdown('mobile-leadership')}
                  className="flex items-center justify-between w-full px-3 py-2 text-gray-700"
                >
                  Leadership
                  <FaChevronDown className={`h-3 w-3 transition-transform ${openDropdown === 'mobile-leadership' ? 'rotate-180' : ''}`} />
                </button>
                {openDropdown === 'mobile-leadership' && (
                  <div className="pl-6 space-y-1 text-gray-600">
                    <Link to="/leadership/principal-judge" className="block py-1">Office of The Principal Judge</Link>
                    <Link to="/leadership/presiding-judges" className="block py-1">Presiding Judges</Link>
                    <Link to="/leadership/advisory-committee" className="block py-1">High Court Advisory Committee</Link>
                    <Link to="/leadership/registrar" className="block py-1">Office of The Registrar</Link>
                    <Link to="/leadership/deputy-registrars" className="block py-1">Deputy Registrars</Link>
                  </div>
                )}

                <Link to="/judges" className="block px-3 py-2 text-gray-700">Judges</Link>
                <Link to="/registry/principal" className="block px-3 py-2 text-gray-700">Principal Registry</Link>
                <Link to="/contact" className="block px-3 py-2 text-gray-700">Contact Us</Link>

                <div className="pt-2">
                  <Link
                    to="/efiling"
                    className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-[#0A2E1F] text-[#0A2E1F] font-semibold text-sm rounded-sm"
                  >
                    <FaBalanceScale className="text-lg" />
                    <span>e-Filing</span>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
import { FaPhoneAlt, FaRegClock } from 'react-icons/fa';

const Header = () => {
  return (
    <header className="w-full font-sans">
      {/* Top Bar */}
      <div className="bg-[#0D2F20] text-white px-6 py-2 text-xs sm:text-sm">
        {/* Contact (Left) & Hours (Right) */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0 w-full">
          <div className="flex items-center gap-2">
            <FaPhoneAlt className="text-[#C69A33]" />
            <span className='tel=2540730181000 cursor-pointer'>Call on: +254 0730 181 000</span>
          </div>
          <div className="flex items-center gap-2">
            <FaRegClock className="text-[#C69A33]" />
            <span>Open Hours: Mon - Fri 8.00 am - 5.00 pm</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
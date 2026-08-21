import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import Navbar from './Navbar';

const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Persistent Header */}
      <Header />
      <Navbar />

      {/* Dynamic Page Content */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Persistent Footer */}
      <Footer />
    </div>
  );
};

export default MainLayout;
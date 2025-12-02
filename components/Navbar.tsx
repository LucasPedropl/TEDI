import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface NavbarProps {
  isAdmin?: boolean;
  onLogout?: () => void;
}

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
  isButton?: boolean;
  onClick?: () => void;
}

const NavLink: React.FC<NavLinkProps> = ({ to, children, isButton = false, onClick }) => {
  if (isButton) {
    return (
      <Link
        to={to}
        className="bg-white text-tedi-dark px-4 py-2 rounded-full font-semibold hover:bg-gray-200 transition-colors inline-block text-center"
        onClick={onClick}
      >
        {children}
      </Link>
    );
  }
  return (
    <Link
      to={to}
      className="text-white hover:text-gray-200 transition-colors block md:inline-block"
      onClick={onClick}
    >
      {children}
    </Link>
  );
};

const Navbar: React.FC<NavbarProps> = ({ isAdmin = false, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onLogout) {
      onLogout();
      navigate('/');
    }
  };

  const closeMenu = () => setIsMobileMenuOpen(false);

  const ScrollLink = ({ to, children }: { to: string, children: React.ReactNode }) => {
    // If on home page, render simple anchor for smooth scroll interaction
    if (isHome) {
      return (
        <a 
          href={`#${to}`} 
          className="text-white hover:text-gray-200 transition-colors block md:inline-block cursor-pointer"
          onClick={closeMenu}
        >
          {children}
        </a>
      );
    }
    // If on other pages, render Link to root with hash
    return (
      <Link 
        to={`/#${to}`} 
        className="text-white hover:text-gray-200 transition-colors block md:inline-block"
        onClick={closeMenu}
      >
        {children}
      </Link>
    );
  };

  // Admin Navbar
  if (isAdmin) {
    return (
      <header className="bg-tedi-light shadow-md">
        <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
          <div>
            <Link to="/admin" className="text-white text-2xl font-bold">
              GERAS - Painel Admin
            </Link>
          </div>
          <div className="flex gap-3">
            <Link
              to="/"
              className="bg-tedi-dark hover:bg-tedi-hover text-white px-4 py-2 rounded-full font-semibold transition-colors"
            >
              Página Inicial
            </Link>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full font-semibold transition-colors"
            >
              Sair
            </button>
          </div>
        </nav>
      </header>
    );
  }

  // Public Navbar
  return (
    <header className="bg-tedi-dark shadow-md sticky top-0 z-50">
      <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
        <div>
          <Link to="/" className="block group hover:opacity-90 transition-opacity">
          <span className="text-white text-2xl font-bold block leading-tight">GERAS</span>
          <p className="text-white text-sm hidden sm:block group-hover:text-gray-100 transition-colors">
            Repositório do Projeto TEDI
          </p>
          </Link>
        </div>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-6">
          <NavLink to="/" onClick={closeMenu}>Início</NavLink>
          <ScrollLink to="materiais">Materiais</ScrollLink>
          <ScrollLink to="/sobre">Sobre</ScrollLink>
          <NavLink to="/login" isButton onClick={closeMenu}>Login Admin</NavLink>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-white focus:outline-none p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"}></path>
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden px-6 pt-2 pb-4 space-y-4 bg-tedi-light border-t border-tedi-accent">
          <NavLink to="/" onClick={closeMenu}>Início</NavLink>
          <ScrollLink to="materiais">Materiais</ScrollLink>
          <ScrollLink to="sobre">Sobre</ScrollLink>
          <div className="pt-2">
            <NavLink to="/login" isButton onClick={closeMenu}>Login Admin</NavLink>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
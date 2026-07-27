'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/atoms/Button';
import { HandCoins, Globe, Menu, X, ChevronRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export const LandingHeader = () => {
  const { user, isLoading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getDashboardRoute = () => {
    if (!user) return '/dashboard';
    if (user.platformRole === 'ADMIN') return '/admin/dashboard';
    if (user.platformRole === 'BANK_OFFICER') return '/bank-officer/dashboard';
    return '/dashboard'; // Default member router handles specific group roles
  };

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ${
        scrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-sm py-4' 
          : 'bg-transparent py-8'
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-6 sm:px-12 lg:px-24 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 font-bold text-xl tracking-tight group">
          <span className={`inline-flex w-10 h-10 rounded-full items-center justify-center shadow-lg transition-transform group-hover:scale-105 ${scrolled ? 'bg-[#0F4C36]' : 'bg-[#C68D5D]'}`}>
            <HandCoins className="w-5 h-5 text-white" />
          </span>
          <span className={scrolled ? 'text-zinc-900' : 'text-white'}>VSLA Connect</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-10 text-[13px] font-bold tracking-wide uppercase">
          <Link href="/" className={`${scrolled ? 'text-zinc-600 hover:text-[#0F4C36]' : 'text-white/90 hover:text-white'} transition-colors`}>Home</Link>
          <Link href="#features" className={`${scrolled ? 'text-zinc-600 hover:text-[#0F4C36]' : 'text-white/80 hover:text-white'} transition-colors`}>About Us</Link>
          <Link href="#how-it-works" className={`${scrolled ? 'text-zinc-600 hover:text-[#0F4C36]' : 'text-white/80 hover:text-white'} transition-colors`}>Process</Link>
          <Link href="#impact" className={`${scrolled ? 'text-zinc-600 hover:text-[#0F4C36]' : 'text-white/80 hover:text-white'} transition-colors`}>Impact</Link>
          <Link href="#news" className={`${scrolled ? 'text-zinc-600 hover:text-[#0F4C36]' : 'text-white/80 hover:text-white'} transition-colors`}>Blog</Link>
        </div>

        {/* Desktop CTA */}
        <div className="hidden lg:flex items-center gap-8 text-[13px] font-bold uppercase">
          <span className={`flex items-center gap-1.5 ${scrolled ? 'text-zinc-600' : 'text-white/90'}`}>
            <Globe className="w-4 h-4" /> ENG
          </span>
          {!isLoading && (
            user ? (
              <Link href={getDashboardRoute()}>
                <Button variant="primary" className={`rounded-full border-none shadow-xl px-8 py-3.5 text-white font-bold hover:-translate-y-0.5 transition-transform ${scrolled ? 'bg-[#0F4C36] hover:bg-[#0c3d2c]' : 'bg-[#C68D5D] hover:bg-[#b07b4d]'}`}>
                  Dashboard
                </Button>
              </Link>
            ) : (
              <div className="flex items-center gap-6">
                <Link href="/login" className={`${scrolled ? 'text-zinc-800 hover:text-[#0F4C36]' : 'text-white hover:text-[#C68D5D]'} transition-colors flex items-center gap-1`}>
                  Login <ChevronRight className="w-4 h-4" />
                </Link>
                <Link href="/register">
                  <Button variant="primary" className={`rounded-full border-none shadow-xl px-8 py-3.5 text-white font-bold hover:-translate-y-0.5 transition-transform ${scrolled ? 'bg-[#0F4C36] hover:bg-[#0c3d2c]' : 'bg-[#C68D5D] hover:bg-[#b07b4d]'}`}>
                    Get Started
                  </Button>
                </Link>
              </div>
            )
          )}
        </div>

        {/* Mobile Toggle */}
        <div className="lg:hidden z-50">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className={scrolled ? 'text-zinc-900' : 'text-white'}>
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white/95 backdrop-blur-xl text-zinc-900 shadow-2xl flex flex-col p-8 gap-6 font-bold text-sm lg:hidden border-b border-zinc-200">
          <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#0F4C36] transition-colors">Home</Link>
          <Link href="#features" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#0F4C36] transition-colors">About Us</Link>
          <Link href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#0F4C36] transition-colors">Process</Link>
          <Link href="#impact" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#0F4C36] transition-colors">Impact</Link>
          <Link href="#news" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-[#0F4C36] transition-colors">News</Link>
          
          <div className="h-px bg-zinc-200 my-2"></div>
          
          {!isLoading && (
            user ? (
              <Link href={getDashboardRoute()} onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="primary" className="w-full rounded-full bg-[#0F4C36] hover:bg-[#0c3d2c] shadow-lg text-white font-bold py-4">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <div className="flex flex-col gap-4">
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full rounded-full border-zinc-300 py-4 hover:bg-zinc-50">
                    Login
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="primary" className="w-full rounded-full bg-[#0F4C36] hover:bg-[#0c3d2c] shadow-lg text-white font-bold py-4">
                    Register
                  </Button>
                </Link>
              </div>
            )
          )}
        </div>
      )}
    </nav>
  );
};

"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsHidden(true);
      } else {
        setIsHidden(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <motion.nav 
        initial={{ opacity: 0, y: -20 }}
        animate={{ 
          opacity: isHidden ? 0 : 1, 
          y: isHidden ? -100 : 0 
        }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full fixed top-0 z-50 px-6 md:px-12 py-8 flex justify-between items-center pointer-events-auto transition-colors"
      >
        <Link href="/" onClick={closeMenu} className="relative z-50 flex items-center">
          <Image 
            src="/logo.png" 
            alt="QueueTopia Logo" 
            width={200} 
            height={200} 
            className="w-24 md:w-32 h-auto object-contain"
            priority
          />
        </Link>
        
        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-12 text-[10px] font-bold tracking-[0.2em] text-white/70 uppercase">
          <Link href="/simulator" className="hover:text-white transition-colors">Simulator</Link>
          <Link href="/resources" className="hover:text-white transition-colors">Resources</Link>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="text-white border border-white/20 rounded-full px-6 py-2 hover:bg-white hover:text-black transition-all">
            Open Source
          </a>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button 
          onClick={toggleMenu}
          className="md:hidden relative z-50 text-white p-2 -mr-2"
          aria-label="Toggle Menu"
        >
          {isOpen ? <X strokeWidth={1.5} size={24} /> : <Menu strokeWidth={1.5} size={24} />}
        </button>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: "-100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "-100%" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-40 bg-[#050505] flex flex-col items-center justify-center gap-10 px-6"
          >
            <div className="flex flex-col items-center gap-8 text-sm font-bold tracking-[0.2em] text-white/70 uppercase mt-12">
              <Link href="/" onClick={closeMenu} className="hover:text-white transition-colors">Home</Link>
              <Link href="/simulator" onClick={closeMenu} className="hover:text-white transition-colors">Simulator</Link>
              <Link href="/resources" onClick={closeMenu} className="hover:text-white transition-colors">Resources</Link>
              <a href="https://github.com" target="_blank" rel="noreferrer" onClick={closeMenu} className="text-white border border-white/20 rounded-full px-8 py-4 hover:bg-white hover:text-black transition-all mt-4">
                View on GitHub
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
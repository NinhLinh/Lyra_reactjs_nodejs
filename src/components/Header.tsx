import React, {useState, useEffect, useRef, useCallback} from 'react';
import {useAuth} from '../context/AuthContext';
import {useLocation, Link} from 'react-router-dom';
import {FiSearch, FiShoppingCart, FiUser} from "react-icons/fi";
import SearchPopup from './SearchPopup';
import Cart from './Cart';
import { useCart } from '../context/CartContext';

const TRANSPARENT_TOP_ROUTES = ['/'];

type ActivePopup = 'search' | 'cart' | 'user' | null;

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [isTop, setIsTop] = useState(true);
  const [openDropdown, setOpenDropdown] = useState(false);
  const [activePopup, setActivePopup] = useState<ActivePopup>(null);

  const lastScrollY = useRef(0);
  const menuRef = useRef(null);
  const cartRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const {user, logout} = useAuth();
  const { cart, isCartOpen, openCart, closeCart } = useCart();
  const location = useLocation();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const isTransparentRoute = TRANSPARENT_TOP_ROUTES.includes(location.pathname);
  const hasBackground = !isTop || !isTransparentRoute;

  useEffect(() => {
    if (activePopup === 'cart') {
      openCart();
    } else {
      closeCart();
    }
  }, [activePopup]);

  const togglePopup = (popup: ActivePopup) => {
    setActivePopup(prev => (prev === popup ? null : popup));
    setMobileOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: any) => {
      if (menuRef.current && !(menuRef.current as any).contains(e.target)) {
        setMobileOpen(false);
        setOpenDropdown(false);
      }
      if (
        cartRef.current && !cartRef.current.contains(e.target) &&
        userRef.current && !userRef.current.contains(e.target)
      ) {
        setActivePopup(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsTop(currentScrollY === 0);
      if (currentScrollY > lastScrollY.current && currentScrollY > 80) {
        setShowHeader(false);
      } else {
        setShowHeader(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsTop(window.scrollY === 0);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) setOpenDropdown(false);
  }, [mobileOpen]);

  const handleSearchClose = useCallback(() => setActivePopup(null), []);

  const NavLinksRight = ({onClick}: { onClick?: () => void }) => (
    <div className="flex items-center lg:gap-4">
      <div className="inline-block p-2 rounded transition hover:bg-white/20 hover:backdrop-blur-2xl cursor-pointer"
           onClick={(e) => {
             e.stopPropagation();
             togglePopup('search');
             if (onClick) onClick();
           }}
      >
        <FiSearch className="text-xl"/>
      </div>

      <div className="h-[36px] relative" ref={cartRef}>
        <div className="inline-block p-2 rounded transition hover:bg-white/20 hover:backdrop-blur-2xl cursor-pointer relative"
             onClick={(e) => {
               e.stopPropagation();
               togglePopup('cart');
             }}
        >
          <FiShoppingCart className="text-xl"/>

          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
              {totalItems > 9 ? '9+' : totalItems}
            </span>
          )}
        </div>

        {activePopup === 'cart' && (
          <div className="absolute right-[-50%] lg:right-0 top-full mt-2 w-96 z-50"
            onClick={(e) => e.stopPropagation()}>
            <Cart/>
          </div>
        )}
      </div>

      <div className="relative" ref={userRef}>
        <div className="inline-block p-2 rounded transition hover:bg-white/20 cursor-pointer"
             onClick={(e) => {
               e.stopPropagation();
               togglePopup('user');
             }}
        >
          <FiUser className="text-xl"/>
        </div>

        {activePopup === 'user' && (
          <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded-md shadow-lg z-50 overflow-hidden">
            {user ? (
              <>
                {user.role === 'admin' && (
                  <a href="/admin" className="block px-4 py-2 hover:bg-gray-100">
                    Admin
                  </a>
                )}

                <a href="/my-profile" className="block px-4 py-2 hover:bg-gray-100">
                  My Profile
                </a>

                <a href="/orders" className="block px-4 py-2 hover:bg-gray-100">
                  Order History
                </a>

                <button
                  onClick={() => {
                    logout();
                    setActivePopup(null);
                    window.location.href = "/";
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setActivePopup(null);
                  window.location.href = "/auth";
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                Login
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const NavLinksLeft = ({onClick}: { onClick?: () => void }) => {
    const items = [
      {label: 'All', href: '/products'},
      {label: 'Electronics', href: '/category/electronics'},
      {label: 'Books', href: '/category/books'},
    ];

    return (
      <>
        <div className="relative group">
          <div className="flex items-center gap-1 py-2 cursor-pointer justify-between lg:justify-start"
               onClick={(e) => {
                 e.stopPropagation();
                 if (window.innerWidth < 1024) {
                   setOpenDropdown(prev => !prev);
                 }
               }}
          >
            Products
            <svg
              className={`w-4 h-4 transition-transform duration-200 lg:group-hover:rotate-180 ${openDropdown ? "rotate-180" : ""}`}
              fill="currentColor" viewBox="0 0 20 20"
            >
              <path fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
              />
            </svg>
          </div>

          <div className={`lg:absolute lg:left-0 lg:top-full lg:w-40 lg:shadow-lg lg:rounded-md bg-white/20 lg:bg-white text-white lg:text-black transition-all duration-200
            ${openDropdown ? "block lg:opacity-100 lg:visible" : "hidden lg:opacity-0 lg:invisible"} lg:block lg:group-hover:opacity-100 lg:group-hover:visible`}>
            {items.map((item, i) => (
              <Link key={i} to={item.href} className="block px-4 py-2 hover:bg-gray-100" onClick={onClick}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <Link to="/about-us" className="block py-2 hover:underline underline-offset-4" onClick={onClick}>About Us</Link>
        <Link to="/services" className="block py-2 hover:underline underline-offset-4" onClick={onClick}>Services</Link>
        <Link to="/wishlist" className="block py-2 hover:underline underline-offset-4" onClick={onClick}>Wishlist</Link>
      </>
    );
  };

  return (
    <>
      <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 border-b
        ${showHeader ? 'translate-y-0' : '-translate-y-full'}
        ${hasBackground
        ? 'bg-white backdrop-blur-md shadow-md border-white/20 text-black'
        : 'bg-transparent border-transparent text-white'
      }`}
      >
        <nav className="container mx-auto flex items-center justify-between p-4 relative">
          <div className="hidden lg:flex items-center space-x-8">
            <NavLinksLeft/>
          </div>
          <div className="flex items-center gap-4 lg:hidden">
            <button className="text-3xl"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMobileOpen(prev => !prev);
                      setActivePopup(null);
                    }}
            >
              {mobileOpen ? '×' : '☰'}
            </button>
          </div>

          <Link to="/"
             className="absolute left-1/2 transform -translate-x-1/2 text-3xl md:text-4xl font-semibold uppercase">
            Lyra
          </Link>

          <div className="flex items-center space-x-10">
            <NavLinksRight/>
          </div>
        </nav>

        {mobileOpen && (
          <div ref={menuRef}
               onClick={(e) => e.stopPropagation()}
               className="lg:hidden bg-white/20 backdrop-blur-md p-6 space-y-4"
          >
            <NavLinksLeft onClick={() => setMobileOpen(false)}/>
          </div>
        )}
      </header>

      {activePopup === 'search' && <SearchPopup onClose={handleSearchClose}/>}
    </>
  );
};

export default Header;

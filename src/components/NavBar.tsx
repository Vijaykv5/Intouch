import React, { useState, useCallback, useRef } from "react";
import {
  Search,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  LogOut,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useUser } from "@civic/auth/react";

interface NavBarProps {
  goToCreatorSignupPage: () => void;
}

export default function NavBar({
  goToCreatorSignupPage,
}: NavBarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
  const { signIn, user, signOut } = useUser();
  const [signingIn, setSigningIn] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);

  const handleSignIn = useCallback(() => {
    setSigningIn(true);
    Promise.resolve(signIn())
      .finally(() => setSigningIn(false));
  }, [signIn]);

  const handleSignOut = useCallback(() => {
    signOut();
    setDropdownOpen(false);
    setMobileDropdownOpen(false);
  }, [signOut]);

  // Close dropdown on outside click
  // Desktop
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);
  // Mobile
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        mobileDropdownRef.current &&
        !mobileDropdownRef.current.contains(event.target as Node)
      ) {
        setMobileDropdownOpen(false);
      }
    }
    if (mobileDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileDropdownOpen]);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 transition-colors duration-300">
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-800">
            InTouch
          </h1>
        </div>
        <div className="hidden md:flex items-center space-x-4">
          {/* <a
            href="#"
            className="text-gray-600 hover:text-gray-800 transition duration-300"
          >
            For Creators
          </a> */}
        </div>
        <div className="hidden md:flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Find creators"
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
          </div>
          {!user && (
            <button
              onClick={handleSignIn}
              className={`px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition duration-300 relative overflow-hidden ${signingIn ? 'opacity-80 cursor-not-allowed' : ''}`}
              disabled={signingIn}
            >
              {signingIn ? (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="block w-5 h-5 rounded-full bg-gradient-to-r from-blue-400 via-blue-200 to-blue-400 animate-pulse" />
                </span>
              ) : (
                'Sign In'
              )}
              {/* <span className={signingIn ? 'invisible' : ''}>Sign In</span> */}
            </button>
          )}
          {user && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((open) => !open)}
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-800 rounded-full hover:bg-gray-200 transition duration-300 focus:outline-none"
              >
                {/* Avatar */}
                <img
                  src={user.picture || "/default-avatar.png"}
                  alt="avatar"
                  className="w-8 h-8 rounded-full object-cover mr-2 border border-gray-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/default-avatar.png";
                  }}
                />
                <span className="mr-2">
                  {user.email ? user.email : "Account"}
                </span>
                {dropdownOpen ? (
                  <ChevronUp size={18} />
                ) : (
                  <ChevronDown size={18} />
                )}
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50 border border-gray-100">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
          {/* Only show Join as creator if not signed in */}
          {!user && (
            <button
              onClick={goToCreatorSignupPage}
              className="px-4 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition duration-300"
            >
              Join as creator
            </button>
          )}
        </div>
        <button
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>
      {isMenuOpen && (
        <div className="md:hidden bg-white py-4 transition-colors duration-300">
          <div className="container mx-auto px-4 space-y-4">
            {/* <a
              href="#"
              className="block text-gray-600 hover:text-gray-800 transition duration-300"
            >
              For Creators
            </a> */}
            <div className="relative">
              <input
                type="text"
                placeholder="Find experts"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
            </div>
            {!user && (
              <button
                onClick={handleSignIn}
                className={`w-full px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition duration-300 text-center relative overflow-hidden ${signingIn ? 'opacity-80 cursor-not-allowed' : ''}`}
                disabled={signingIn}
              >
                {signingIn ? (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="block w-5 h-5 rounded-full bg-gradient-to-r from-blue-400 via-blue-200 to-blue-400 animate-pulse" />
                  </span>
                ) : (
                  'Sign In'
                )}
                {/* <span className={signingIn ? 'invisible' : ''}>Sign In</span> */}
              </button>
            )}
            {user && (
              <div className="relative" ref={mobileDropdownRef}>
                <button
                  onClick={() => setMobileDropdownOpen((open) => !open)}
                  className="flex items-center w-full px-4 py-2 bg-gray-100 text-gray-800 rounded-full hover:bg-gray-200 transition duration-300 focus:outline-none"
                >
                  {/* Avatar */}
                  <img
                    src={user.picture || "/default-avatar.png"}
                    alt="avatar"
                    className="w-8 h-8 rounded-full object-cover mr-2 border border-gray-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "/default-avatar.png";
                    }}
                  />
                  <span className="mr-2">
                    {user.email ? user.email : "Account"}
                  </span>
                  {mobileDropdownOpen ? (
                    <ChevronUp size={18} />
                  ) : (
                    <ChevronDown size={18} />
                  )}
                </button>
                {mobileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50 border border-gray-100">
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <LogOut className="mr-2 h-4 w-4" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}
            {/* Only show Join as creator if not signed in */}
            {!user && (
              <button
                onClick={goToCreatorSignupPage}
                className="w-full px-4 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition duration-300"
              >
                Become a creator
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

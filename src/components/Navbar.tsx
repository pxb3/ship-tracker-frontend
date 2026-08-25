'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LoginModal } from './LoginModal';
import { SignupModal } from './SignupModal';
import { ProfileModal } from './ProfileModal';

interface NavbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onClear: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onFocus: () => void;
  showTypingSpinner: boolean;
  showSpinnerLabel?: boolean;
}

export function Navbar({
  searchTerm,
  onSearchChange,
  onClear,
  onKeyDown,
  onFocus,
  showTypingSpinner,
  showSpinnerLabel = false,
}: NavbarProps) {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSwitchToSignup = () => {
    setShowLoginModal(false);
    setShowSignupModal(true);
  };

  const handleSwitchToLogin = () => {
    setShowSignupModal(false);
    setShowLoginModal(true);
  };

  const handleLogout = async () => {
    setShowUserDropdown(false);
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };

    if (showUserDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserDropdown]);

  return (
    <>
      <nav className="absolute top-0 left-0 right-0 z-[6000] bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg pointer-events-auto">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Title */}
            <div className="flex items-center flex-shrink-0">
              <h1 className="text-white text-base sm:text-xl font-bold">
                <span className="hidden xs:inline">Ship Tracker</span>
                <span className="xs:hidden">Ships</span>
              </h1>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl mx-2 sm:mx-4 md:mx-8">
              <div className="ship-search-container relative">
                <div className="flex gap-1 sm:gap-2">
                  <input
                    aria-label="Search ships by name or MMSI"
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder="Search ships…"
                    className="text-white flex-1 px-2 py-1.5 sm:px-4 sm:py-2 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent text-sm sm:text-base"
                    onFocus={onFocus}
                    onClick={(e) => {
                      e.stopPropagation();
                      onFocus();
                    }}
                  />
                  {searchTerm ? (
                    <button
                      onClick={onClear}
                      className="text-white bg-blue-500 hover:bg-blue-600 px-2 py-1.5 sm:px-4 sm:py-2 rounded-md transition-colors text-sm sm:text-base flex-shrink-0"
                      aria-label="Clear search"
                    >
                      <span className="hidden sm:inline">Clear</span>
                      <span className="sm:hidden">✕</span>
                    </button>
                  ) : null}
                </div>

                {showTypingSpinner ? (
                  <div
                    className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-white rounded-md shadow-lg p-3 text-gray-600 dark:text-gray-600 flex items-center justify-center"
                    aria-live="polite"
                  >
                    <div className="flex items-center gap-2">
                      <svg width="20" height="20" viewBox="0 0 32 32" aria-hidden="true">
                        <g transform="translate(16,16)">
                          <circle
                            cx="0"
                            cy="0"
                            r="12"
                            fill="none"
                            stroke="#0078ff"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeDasharray="60"
                            strokeDashoffset="20"
                            opacity="0.95"
                          />
                          <animateTransform
                            attributeName="transform"
                            attributeType="XML"
                            type="rotate"
                            from="0"
                            to="360"
                            dur="1s"
                            repeatCount="indefinite"
                          />
                        </g>
                      </svg>
                      {showSpinnerLabel ? (
                        <div className="text-[13px] text-gray-700 dark:text-gray-700">Searching…</div>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
              {loading ? (
                <div className="text-white text-xs sm:text-sm">Loading...</div>
              ) : isAuthenticated && user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="flex items-center gap-1 sm:gap-2 bg-white text-blue-600 px-2 py-1.5 sm:px-4 sm:py-2 rounded-md hover:bg-blue-50 transition-colors font-medium text-sm sm:text-base"
                  >
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <span className="hidden md:inline truncate max-w-[120px]">{user.email}</span>
                    <span className="md:hidden">Menu</span>
                    <svg
                      className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {showUserDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-[6100] border border-gray-200">
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          setShowProfileModal(true);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        Profile
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="bg-white text-blue-600 px-2 py-1.5 sm:px-4 sm:py-2 rounded-md hover:bg-blue-50 transition-colors font-medium text-sm sm:text-base flex-shrink-0"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => setShowSignupModal(true)}
                    className="bg-blue-800 text-white px-2 py-1.5 sm:px-4 sm:py-2 rounded-md hover:bg-blue-900 transition-colors font-medium text-sm sm:text-base flex-shrink-0"
                  >
                    <span className="hidden xs:inline">Sign Up</span>
                    <span className="xs:hidden">Join</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Modals */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToSignup={handleSwitchToSignup}
      />
      <SignupModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        onSwitchToLogin={handleSwitchToLogin}
      />
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
    </>
  );
}

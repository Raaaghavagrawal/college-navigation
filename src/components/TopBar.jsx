import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { IconButton, Button } from './UiComponents/Button.jsx';
import { FiMapPin, FiLogOut, FiUser, FiMail, FiPhone, FiSettings } from 'react-icons/fi';

export function TopBar({ onCenterOnUser, onLogout, userEmail, userPhone }) {
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowAccountMenu(false);
      }
    };

    if (showAccountMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAccountMenu]);

  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className="relative z-30 flex items-center justify-between gap-3 px-4 py-2 md:px-6 md:py-3 bg-slate-900/70 border-b border-slate-800/80 backdrop-blur-xl shadow-lg shadow-black/50"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#6a11cb] to-[#2575fc] shadow-lg shadow-indigo-500/40">
          <FiMapPin className="text-xl text-white" />
        </div>
        <div className="leading-tight font-orbitron">
          <div className="text-base font-semibold tracking-tight text-slate-50 md:text-xl">
            Bhhraman
          </div>
          <div className="text-xs text-slate-400 md:text-sm">
            Smart campus navigation for GL Bajaj
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <Button
          variant="secondary"
          size="sm"
          className="hidden md:inline-flex"
          onClick={onCenterOnUser}
        >
          <FiMapPin className="text-sm" />
          <span>Recenter</span>
        </Button>

        {/* Account Button with Dropdown */}
        <div className="relative" ref={menuRef}>
          <Button
            variant="secondary"
            size="sm"
            className="hidden md:inline-flex"
            onClick={() => setShowAccountMenu(!showAccountMenu)}
          >
            <FiUser className="text-sm" />
            <span>Account</span>
          </Button>

          {/* Account Dropdown Menu */}
          <AnimatePresence>
            {showAccountMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900/95 border border-slate-700/80 backdrop-blur-xl shadow-2xl shadow-black/60 overflow-hidden z-[100]"
              >
                {/* User Info Header */}
                <div className="p-4 bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border-b border-slate-700/50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-[#6a11cb] to-[#2575fc] shadow-lg">
                      <FiUser className="text-xl text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-50 truncate">
                        {userEmail || 'Guest User'}
                      </div>
                      <div className="text-xs text-slate-400">
                        GL Bajaj Student
                      </div>
                    </div>
                  </div>
                </div>

                {/* User Details */}
                <div className="p-3 space-y-2">
                  {userEmail && (
                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800/40">
                      <FiMail className="text-slate-400 text-sm flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">Email</div>
                        <div className="text-xs text-slate-200 truncate">{userEmail}</div>
                      </div>
                    </div>
                  )}
                  {userPhone && (
                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800/40">
                      <FiPhone className="text-slate-400 text-sm flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">Phone</div>
                        <div className="text-xs text-slate-200">{userPhone}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Menu Actions */}
                <div className="p-2 border-t border-slate-700/50">
                  <button
                    onClick={() => {
                      setShowAccountMenu(false);
                      // Add settings handler here if needed
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800/60 hover:text-white transition-colors"
                  >
                    <FiSettings className="text-sm" />
                    <span>Account Settings</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowAccountMenu(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-rose-400 hover:bg-rose-900/20 hover:text-rose-300 transition-colors"
                  >
                    <FiLogOut className="text-sm" />
                    <span>Logout</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.header>
  );
}

TopBar.propTypes = {
  onCenterOnUser: PropTypes.func,
  onLogout: PropTypes.func,
  userEmail: PropTypes.string,
  userPhone: PropTypes.string,
};

export default TopBar;

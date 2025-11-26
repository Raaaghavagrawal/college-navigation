import React, { useEffect, useState } from 'react';
import { IconButton } from './UiComponents/Button.jsx';
import { FiMoon, FiSun } from 'react-icons/fi';

export function ThemeToggle() {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const stored = window.localStorage.getItem('bh_theme');
    if (stored === 'light' || stored === 'dark') {
      setTheme(stored);
      document.documentElement.dataset.theme = stored;
    } else {
      document.documentElement.dataset.theme = 'dark';
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('bh_theme', theme);
  }, [theme]);

  const toggle = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <IconButton
      label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      onClick={toggle}
    >
      {theme === 'dark' ? (
        <FiSun className="text-lg text-amber-300" />
      ) : (
        <FiMoon className="text-lg text-slate-200" />
      )}
    </IconButton>
  );
}

export default ThemeToggle;

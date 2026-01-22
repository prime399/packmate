'use client';

import { useTheme } from '@/hooks/useTheme';

// Requirements: 1.6, 3.1 - Sun/moon toggle switch matching TuxMate style

export function ThemeToggle() {
  const { theme, toggleTheme, isHydrated } = useTheme();

  if (!isHydrated) {
    return (
      <div className="switch" style={{ opacity: 0 }}>
        <div className="w-12 h-6 rounded-full bg-[var(--bg-tertiary)]" />
      </div>
    );
  }

  return (
    <label className="switch">
      <input
        className="switch__input"
        type="checkbox"
        role="switch"
        checked={theme === 'dark'}
        onChange={toggleTheme}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      />
      <span className="switch__icon">
        <span className="switch__icon-part switch__icon-part--1"></span>
        <span className="switch__icon-part switch__icon-part--2"></span>
        <span className="switch__icon-part switch__icon-part--3"></span>
        <span className="switch__icon-part switch__icon-part--4"></span>
        <span className="switch__icon-part switch__icon-part--5"></span>
        <span className="switch__icon-part switch__icon-part--6"></span>
        <span className="switch__icon-part switch__icon-part--7"></span>
        <span className="switch__icon-part switch__icon-part--8"></span>
        <span className="switch__icon-part switch__icon-part--9"></span>
        <span className="switch__icon-part switch__icon-part--10"></span>
        <span className="switch__icon-part switch__icon-part--11"></span>
      </span>
      <span className="switch__sr">Toggle theme</span>
    </label>
  );
}

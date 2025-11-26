import React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';

export function Button({ children, variant = 'primary', size = 'md', className, ...rest }) {
  const base =
    'inline-flex items-center justify-center rounded-xl font-medium transition-transform transition-shadow duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent focus-visible:ring-sky-400 disabled:opacity-60 disabled:cursor-not-allowed active:scale-95';

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2.5',
  }[size];

  const variantClasses = {
    primary:
      'bg-gradient-to-r from-[#6a11cb] to-[#2575fc] text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:scale-[1.02]',
    secondary:
      'bg-slate-800/80 text-slate-100 border border-slate-600/60 hover:bg-slate-700/90',
    ghost:
      'bg-transparent text-slate-200 hover:bg-slate-800/70 border border-transparent',
    outline:
      'bg-transparent text-slate-100 border border-slate-600 hover:bg-slate-800/70',
    success:
      'bg-emerald-500/90 text-slate-950 hover:bg-emerald-500 shadow-lg shadow-emerald-500/30',
    danger:
      'bg-rose-500/90 text-white hover:bg-rose-500 shadow-lg shadow-rose-500/40',
  }[variant];

  return (
    <button className={clsx(base, sizeClasses, variantClasses, className)} {...rest}>
      {children}
    </button>
  );
}

Button.propTypes = {
  children: PropTypes.node,
  variant: PropTypes.oneOf(['primary', 'secondary', 'ghost', 'outline', 'success', 'danger']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
};

export function IconButton({ label, className, children, ...rest }) {
  const base =
    'inline-flex items-center justify-center rounded-full p-2 text-slate-100 bg-slate-800/80 hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent transition-transform duration-150 hover:scale-105';
  return (
    <button
      type="button"
      aria-label={label}
      className={clsx(base, className)}
      {...rest}
    >
      {children}
    </button>
  );
}

IconButton.propTypes = {
  label: PropTypes.string.isRequired,
  className: PropTypes.string,
  children: PropTypes.node,
};

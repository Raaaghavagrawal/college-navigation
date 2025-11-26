import React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';

export function Card({ className, children, padding = 'md', ...rest }) {
  const paddingClass =
    padding === 'sm' ? 'p-3' : padding === 'lg' ? 'p-6' : 'p-4';

  return (
    <div
      className={clsx(
        'rounded-2xl bg-slate-900/70 border border-slate-700/70 shadow-lg shadow-black/40 backdrop-blur-xl',
        paddingClass,
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

Card.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  padding: PropTypes.oneOf(['sm', 'md', 'lg']),
};

export function Badge({ children, color = 'default', className }) {
  const base =
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium';
  const colorClass =
    color === 'success'
      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
      : color === 'danger'
      ? 'bg-rose-500/10 text-rose-300 border border-rose-500/40'
      : color === 'accent'
      ? 'bg-sky-500/15 text-sky-300 border border-sky-500/40'
      : 'bg-slate-700/60 text-slate-200 border border-slate-500/60';

  return <span className={clsx(base, colorClass, className)}>{children}</span>;
}

Badge.propTypes = {
  children: PropTypes.node,
  color: PropTypes.oneOf(['default', 'success', 'danger', 'accent']),
  className: PropTypes.string,
};

export function Modal({ isOpen, onClose, title, children, footer }) {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 backdrop-blur-xl"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg rounded-2xl bg-slate-900/95 border border-slate-700 shadow-2xl shadow-black/70 p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h2 className="text-base font-semibold text-slate-50">{title}</h2>
          </div>
          <button
            type="button"
            className="rounded-full p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-700/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            aria-label="Close dialog"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="text-sm text-slate-200 mb-3 max-h-[60vh] overflow-y-auto">
          {children}
        </div>
        {footer && <div className="mt-2 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

Modal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  title: PropTypes.node,
  children: PropTypes.node,
  footer: PropTypes.node,
};

export function Toast({ message, icon, type = 'info' }) {
  if (!message) return null;
  const colorClass =
    type === 'success'
      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
      : type === 'error'
      ? 'bg-rose-500/10 border-rose-500/40 text-rose-200'
      : 'bg-slate-800/80 border-slate-600/70 text-slate-100';
  return (
    <div className={clsx('inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs shadow-lg shadow-black/50', colorClass)}>
      {icon && <span className="text-base">{icon}</span>}
      <span className="leading-snug">{message}</span>
    </div>
  );
}

Toast.propTypes = {
  message: PropTypes.string,
  icon: PropTypes.node,
  type: PropTypes.oneOf(['info', 'success', 'error']),
};

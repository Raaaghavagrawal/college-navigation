import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { FiSearch } from 'react-icons/fi';
import { FaSchool, FaDoorOpen, FaUtensils } from 'react-icons/fa6';
import { FaParking } from 'react-icons/fa';
import clsx from 'clsx';

function typeIcon(type) {
  switch (type) {
    case 'gate':
      return <FaDoorOpen className="text-sky-300" />;
    case 'canteen':
      return <FaUtensils className="text-amber-300" />;
    case 'parking':
      return <FaParking className="text-emerald-300" />;
    case 'block':
    default:
      return <FaSchool className="text-indigo-300" />;
  }
}

export function SearchAutocomplete({
  label,
  placeholder,
  value,
  onChange,
  places,
  id,
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const selectedPlace = useMemo(
    () => places.find(p => p.id === value) || null,
    [places, value],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return places.slice(0, 20);
    return places
      .filter(p => p.name.toLowerCase().includes(q))
      .slice(0, 20);
  }, [query, places]);

  useEffect(() => {
    if (!isOpen) setActiveIndex(0);
  }, [isOpen]);

  const handleKeyDown = e => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setIsOpen(true);
      return;
    }
    if (!filtered.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => (i + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => (i - 1 + filtered.length) % filtered.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const chosen = filtered[activeIndex];
      if (chosen) {
        onChange(chosen.id);
        setQuery('');
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const displayLabel = selectedPlace ? selectedPlace.name : '';

  return (
    <div className="space-y-1.5">
      <label className="text-[11px] uppercase tracking-[0.16em] text-slate-400 flex items-center gap-2">
        <span>{label}</span>
      </label>
      <div className="relative">
        <div
          className={clsx(
            'flex items-center gap-2 rounded-2xl border border-slate-700/70 bg-slate-900/70 backdrop-blur-xl px-3.5 py-2.5 text-sm text-slate-100 shadow-sm shadow-black/40 focus-within:border-sky-500/80 focus-within:ring-1 focus-within:ring-sky-500/70',
          )}
        >
          <FiSearch className="text-slate-400 text-sm" />
          <input
            id={id}
            className="flex-1 bg-transparent border-none outline-none placeholder:text-slate-500 text-[13px]"
            placeholder={placeholder}
            value={query || displayLabel}
            onChange={e => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => {
              setQuery('');
              setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            aria-autocomplete="list"
            aria-expanded={isOpen}
          />
        </div>

        {isOpen && filtered.length > 0 && (
          <ul
            className="absolute z-20 mt-1.5 max-h-56 w-full overflow-y-auto rounded-2xl border border-slate-700/70 bg-slate-900/95 shadow-xl shadow-black/70 text-xs"
            role="listbox"
          >
            {filtered.map((p, index) => (
              <li
                key={p.id}
                role="option"
                aria-selected={p.id === value}
                className={clsx(
                  'flex cursor-pointer items-center gap-2 px-3 py-2 text-slate-200 hover:bg-slate-800/80',
                  index === activeIndex && 'bg-slate-800/90',
                )}
                onMouseDown={e => {
                  // prevent input blur before click
                  e.preventDefault();
                  onChange(p.id);
                  setIsOpen(false);
                  setQuery('');
                }}
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-800/80">
                  {typeIcon(p.type)}
                </span>
                <span className="flex-1 truncate">{p.name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

SearchAutocomplete.propTypes = {
  label: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  places: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      type: PropTypes.string,
      x: PropTypes.number,
      y: PropTypes.number,
    }),
  ).isRequired,
  id: PropTypes.string,
};

export default SearchAutocomplete;

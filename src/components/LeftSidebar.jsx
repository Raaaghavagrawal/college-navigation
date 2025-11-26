import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { Button, IconButton } from './UiComponents/Button.jsx';
import SearchAutocomplete from './SearchAutocomplete.jsx';
import {
  FiChevronLeft,
  FiChevronRight,
  FiRefreshCw,
  FiStar,
  FiArrowLeft,
  FiNavigation,
  FiShare2,
  FiBookmark,
  FiSearch
} from 'react-icons/fi';

export function LeftSidebar({
  isCollapsed,
  onToggle,
  places,
  favorites,
  startId,
  endId,
  onStartChange,
  onEndChange,
  onFindRoute,
  onClearRoute,
  onReload,
  isMobile,
  mode = 'search', // Default to search
  selectedPlace,
  onModeChange,
  onSelectPlace
}) {

  // --- VIEW: SEARCH (Default) ---
  const renderSearch = () => (
    <div className="flex h-full flex-col p-4 overflow-y-auto">
      <div className="relative">
        <SearchAutocomplete
          label=""
          placeholder="Search campus..."
          value={null}
          onChange={(id) => {
            if (id && onSelectPlace) {
              onSelectPlace(id);
            }
          }}
          places={places}
          id="main-search"
        />
        <div className="absolute right-3 top-3 text-slate-400 pointer-events-none">
          <FiSearch />
        </div>
      </div>



      {/* Quick Categories / Favorites */}
      <div className="mt-6 pb-4">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Explore</h3>
        <div className="flex flex-wrap gap-2">
          {favorites && favorites.map(fav => (
            <button
              key={fav.id}
              onClick={() => onSelectPlace && onSelectPlace(fav.id)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 transition-colors text-sm text-slate-200"
            >
              <FiStar className="text-amber-400 text-xs" />
              <span>{fav.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // --- VIEW: DETAILS (Replaces Search after selection) ---
  const renderDetails = () => {
    if (!selectedPlace) return null;

    // Use actual image if available, otherwise use placeholder
    const imageUrl = selectedPlace.image
      ? selectedPlace.image
      : `https://placehold.co/400x250/1e293b/94a3b8?text=${encodeURIComponent(selectedPlace.name)}`;

    return (
      <div className="flex h-full flex-col bg-slate-900">
        {/* Header Image */}
        <div className="relative h-48 w-full shrink-0 overflow-hidden bg-slate-800">
          <img
            src={imageUrl}
            alt={selectedPlace.name}
            className="h-full w-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />

          <button
            onClick={() => onModeChange && onModeChange('search')}
            className="absolute top-4 left-4 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-sm transition-colors"
          >
            <FiArrowLeft className="text-lg" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          <h1 className="text-2xl font-bold text-white leading-tight">{selectedPlace.name}</h1>
          <p className="text-sm text-slate-400 mt-1">{selectedPlace.type || 'Campus Location'}</p>

          {/* Action Buttons */}
          <div className="mt-6 flex gap-3 border-b border-slate-800 pb-6">
            <Button
              onClick={() => {
                onEndChange(selectedPlace.id);
                if (onModeChange) onModeChange('directions');
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white"
            >
              <FiNavigation className="mr-2" /> Directions
            </Button>
            <Button variant="secondary" className="aspect-square px-0 w-10 flex items-center justify-center">
              <FiBookmark />
            </Button>
            <Button variant="secondary" className="aspect-square px-0 w-10 flex items-center justify-center">
              <FiShare2 />
            </Button>
          </div>

          {/* Description / Info */}
          <div className="mt-6 space-y-4">
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-1">About</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {selectedPlace.description || 'Located within the GLBITM campus. This location is accessible via the main pathways and is a key point of interest for students and faculty.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- VIEW: DIRECTIONS (Route Planner) ---
  const renderDirections = () => {
    return (
      <div className="flex h-full flex-col">
        <div className="flex-shrink-0 p-3 md:p-4 border-b border-slate-800/50">
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => onModeChange && onModeChange('details')} // Go back to details
              className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <FiArrowLeft />
            </button>
            <span className="text-sm font-medium text-slate-200">Directions</span>
          </div>

          <div className="space-y-3">
            <SearchAutocomplete
              label="Start"
              placeholder="Search starting point"
              value={startId}
              onChange={onStartChange}
              places={places}
              id="start-search"
            />
            <SearchAutocomplete
              label="Destination"
              placeholder="Search destination"
              value={endId}
              onChange={onEndChange}
              places={places}
              id="end-search"
            />
          </div>

          <div className="mt-3 flex flex-col gap-2">
            <Button onClick={onFindRoute} disabled={!startId || !endId}>
              <span>Find route</span>
            </Button>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" className="flex-1" onClick={onClearRoute}>
                Clear
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={onReload}
              >
                <FiRefreshCw className="text-xs" />
                <span>Reload</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const sidebarContent = (
    <>
      {mode === 'search' && renderSearch()}
      {mode === 'details' && renderDetails()}
      {mode === 'directions' && renderDirections()}
    </>
  );

  return (
    <div
      className={
        isMobile
          ? 'fixed bottom-0 left-0 right-0 z-20 flex justify-center pointer-events-none'
          : 'relative z-10 h-full'
      }
    >
      <motion.aside
        initial={false}
        animate={{
          width: isCollapsed ? (isMobile ? 0 : 64) : isMobile ? '100%' : 360,
          opacity: isCollapsed && isMobile ? 0 : 1,
        }}
        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        className={
          'pointer-events-auto overflow-hidden rounded-t-3xl md:rounded-3xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-xl shadow-2xl shadow-black/70 md:shadow-xl md:shadow-black/60' +
          ' ' +
          (isMobile ? 'mb-3 mx-3' : 'h-full')
        }
      >
        {!isCollapsed && sidebarContent}
      </motion.aside>

      {/* Collapse / expand toggle */}
      <div
        className={
          'pointer-events-auto absolute md:top-1/2 md:-right-3 flex ' +
          (isMobile ? '-top-3 right-6' : 'items-center')
        }
      >
        <IconButton
          label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="h-7 w-7 rounded-full bg-slate-900/90 border border-slate-700/80 shadow-lg shadow-black/60"
          onClick={onToggle}
        >
          {isCollapsed ? (
            <FiChevronRight className="text-sm" />
          ) : (
            <FiChevronLeft className="text-sm" />
          )}
        </IconButton>
      </div>
    </div>
  );
}

LeftSidebar.propTypes = {
  isCollapsed: PropTypes.bool,
  onToggle: PropTypes.func,
  places: PropTypes.array.isRequired,
  favorites: PropTypes.array,
  startId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  endId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onStartChange: PropTypes.func.isRequired,
  onEndChange: PropTypes.func.isRequired,
  onFindRoute: PropTypes.func.isRequired,
  onClearRoute: PropTypes.func.isRequired,
  onReload: PropTypes.func.isRequired,
  isMobile: PropTypes.bool,
  mode: PropTypes.string,
  selectedPlace: PropTypes.object,
  onModeChange: PropTypes.func,
  onSelectPlace: PropTypes.func
};

export default LeftSidebar;

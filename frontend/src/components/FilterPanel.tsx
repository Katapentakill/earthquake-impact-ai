'use client';

import { useState } from 'react';

interface FilterPanelProps {
  onFilterChange: (filters: FilterValues) => void;
}

export interface FilterValues {
  min_magnitude?: number;
  max_magnitude?: number;
  start_date?: string;
  end_date?: string;
}

export default function FilterPanel({ onFilterChange }: FilterPanelProps) {
  const [filters, setFilters] = useState<FilterValues>({});

  const handleChange = (key: keyof FilterValues, value: any) => {
    const newFilters = { ...filters, [key]: value || undefined };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    setFilters({});
    onFilterChange({});
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Filters</h3>
        <button
          onClick={handleReset}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Reset
        </button>
      </div>

      <div className="space-y-4">
        {/* Magnitude range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Magnitude Range
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Min"
              min="0"
              max="10"
              step="0.1"
              value={filters.min_magnitude || ''}
              onChange={(e) =>
                handleChange('min_magnitude', e.target.value ? parseFloat(e.target.value) : null)
              }
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Max"
              min="0"
              max="10"
              step="0.1"
              value={filters.max_magnitude || ''}
              onChange={(e) =>
                handleChange('max_magnitude', e.target.value ? parseFloat(e.target.value) : null)
              }
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Date range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date Range
          </label>
          <div className="space-y-2">
            <input
              type="datetime-local"
              value={filters.start_date || ''}
              onChange={(e) => handleChange('start_date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="datetime-local"
              value={filters.end_date || ''}
              onChange={(e) => handleChange('end_date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Quick filters */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quick Filters
          </label>
          <div className="space-y-2">
            <button
              onClick={() => {
                const date = new Date();
                date.setHours(date.getHours() - 24);
                handleChange('start_date', date.toISOString().slice(0, 16));
              }}
              className="w-full px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Last 24 hours
            </button>
            <button
              onClick={() => {
                const date = new Date();
                date.setDate(date.getDate() - 7);
                handleChange('start_date', date.toISOString().slice(0, 16));
              }}
              className="w-full px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Last 7 days
            </button>
            <button
              onClick={() => {
                handleChange('min_magnitude', 6.0);
              }}
              className="w-full px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Magnitude 6.0+
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

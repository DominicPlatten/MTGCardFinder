import React from 'react';
import { Filter } from 'lucide-react';

interface FiltersProps {
  onFilterChange: (filters: any) => void;
  currentFilters: {
    type: string;
    cmc: string;
    color: string;
    price: string;
    includeLands: boolean;
    relatedCount: number;
  };
}

export function Filters({ onFilterChange, currentFilters }: FiltersProps) {
  const handleChange = (key: string, value: string | number | boolean) => {
    onFilterChange({ ...currentFilters, [key]: value });
  };

  return (
    <div className="flex flex-wrap gap-4 p-4 bg-white rounded-lg shadow-sm">
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4" />
        <span className="text-sm font-medium">Filters:</span>
      </div>
      
      <select 
        className="px-3 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={currentFilters.type}
        onChange={(e) => handleChange('type', e.target.value)}
      >
        <option value="">Card Type</option>
        <option value="creature">Creatures</option>
        <option value="instant">Instants</option>
        <option value="sorcery">Sorceries</option>
        <option value="artifact">Artifacts</option>
        <option value="enchantment">Enchantments</option>
        <option value="planeswalker">Planeswalkers</option>
      </select>

      <select 
        className="px-3 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={currentFilters.cmc}
        onChange={(e) => handleChange('cmc', e.target.value)}
      >
        <option value="">Mana Value</option>
        {[0, 1, 2, 3, 4, 5, 6, 7, '8+'].map(cmc => (
          <option key={cmc} value={cmc}>{cmc}</option>
        ))}
      </select>

      <select 
        className="px-3 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={currentFilters.color}
        onChange={(e) => handleChange('color', e.target.value)}
      >
        <option value="">Color Identity</option>
        <option value="W">White</option>
        <option value="U">Blue</option>
        <option value="B">Black</option>
        <option value="R">Red</option>
        <option value="G">Green</option>
        <option value="C">Colorless</option>
      </select>

      <select 
        className="px-3 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={currentFilters.price}
        onChange={(e) => handleChange('price', e.target.value)}
      >
        <option value="">Price Range</option>
        <option value="budget">Under $1</option>
        <option value="moderate">$1 - $5</option>
        <option value="expensive">$5 - $20</option>
        <option value="premium">Over $20</option>
      </select>

      <select
        className="px-3 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={currentFilters.relatedCount}
        onChange={(e) => handleChange('relatedCount', Number(e.target.value))}
      >
        <option value="3">3 Cards</option>
        <option value="5">5 Cards</option>
        <option value="10">10 Cards</option>
        <option value="15">15 Cards</option>
        <option value="20">20 Cards</option>
      </select>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={currentFilters.includeLands}
          onChange={(e) => handleChange('includeLands', e.target.checked)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm">Include Lands</span>
      </label>
    </div>
  );
}
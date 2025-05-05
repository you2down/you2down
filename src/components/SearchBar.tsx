import React, { useState } from 'react';
import { Search } from 'lucide-react';
import Input from './ui/Input';
import Button from './ui/Button';
import Select from './ui/Select';
import { VideoTypeFilter } from '../types';

interface SearchBarProps {
  onSearch: (query: string, filters: SearchFilters) => void;
  isLoading: boolean;
}

export interface SearchFilters {
  duration: string;
  publishedAfter: string;
  order: string;
  videoType: VideoTypeFilter;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading }) => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    duration: 'any',
    publishedAfter: '',
    order: 'relevance',
    videoType: 'videos'
  });
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query, filters);
    }
  };

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="w-full bg-gray-50 py-6 px-4 sm:px-6 rounded-lg shadow-sm">
      <form onSubmit={handleSearch}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-grow">
            <Input
              placeholder="Search for videos..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
              aria-label="Search query"
            />
          </div>
          
          <Button 
            type="submit" 
            variant="primary"
            isLoading={isLoading}
          >
            Search
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </div>

        <div className="mt-4">
          <div className="flex gap-4 items-center">
            <label className="text-sm font-medium text-gray-700">Video Type:</label>
            <div className="flex gap-4">
              {['videos', 'shorts', 'both'].map((type) => (
                <label key={type} className="inline-flex items-center">
                  <input
                    type="radio"
                    name="videoType"
                    value={type}
                    checked={filters.videoType === type}
                    onChange={handleFilterChange}
                    className="form-radio h-4 w-4 text-red-600 focus:ring-red-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 capitalize">{type}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              name="duration"
              label="Duration"
              value={filters.duration}
              onChange={handleFilterChange}
              options={[
                { value: 'any', label: 'Any Duration' },
                { value: 'short', label: 'Short (< 4 minutes)' },
                { value: 'medium', label: 'Medium (4-20 minutes)' },
                { value: 'long', label: 'Long (> 20 minutes)' }
              ]}
            />
            
            <Select
              name="publishedAfter"
              label="Upload Date"
              value={filters.publishedAfter}
              onChange={handleFilterChange}
              options={[
                { value: '', label: 'Any Time' },
                { value: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), label: 'Last 24 hours' },
                { value: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), label: 'Last week' },
                { value: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), label: 'Last month' },
                { value: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), label: 'Last year' }
              ]}
            />
            
            <Select
              name="order"
              label="Sort By"
              value={filters.order}
              onChange={handleFilterChange}
              options={[
                { value: 'relevance', label: 'Relevance' },
                { value: 'date', label: 'Upload Date' },
                { value: 'viewCount', label: 'View Count' },
                { value: 'rating', label: 'Rating' }
              ]}
            />
          </div>
        )}
      </form>
    </div>
  );
};

export default SearchBar;
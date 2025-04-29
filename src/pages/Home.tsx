import React, { useState } from 'react';
import Header from '../components/Header';
import SearchBar, { SearchFilters } from '../components/SearchBar';
import VideoList from '../components/VideoList';
import { VideoItem } from '../types';
import { searchVideos } from '../services/youtube';
import toast, { Toaster } from 'react-hot-toast';

const Home: React.FC = () => {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (query: string, filters: SearchFilters) => {
    try {
      setIsSearching(true);
      
      const searchParams = {
        query,
        maxResults: 12,
        videoDuration: filters.duration as 'any' | 'short' | 'medium' | 'long',
        publishedAfter: filters.publishedAfter || undefined,
        order: filters.order as 'date' | 'relevance' | 'rating' | 'viewCount' | 'title'
      };
      
      const response = await searchVideos(searchParams);
      setVideos(response.items);
      setHasSearched(true);
      
      if (response.items.length === 0) {
        toast.error('No videos found. Try a different search or filters.');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search videos. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Download YouTube Videos
            </h2>
            <p className="text-gray-600">
              Search for any YouTube video, select your preferred format, and download with just a click.
            </p>
          </div>
          
          <SearchBar onSearch={handleSearch} isLoading={isSearching} />
          
          {hasSearched ? (
            <VideoList videos={videos} loading={isSearching} />
          ) : (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <div className="mb-4 text-red-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
                  <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Start by searching for a video</h3>
              <p className="text-gray-600 max-w-md">
                Enter keywords in the search box above to find videos. You can use filters to narrow down your results.
              </p>
            </div>
          )}
        </div>
      </main>
      
      <footer className="bg-gray-800 text-gray-300 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm">
              This app is for personal use only. Please respect copyright laws.
            </p>
            <p className="text-sm mt-2 md:mt-0">
              Powered by YouTube Data API & yt-dlp
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
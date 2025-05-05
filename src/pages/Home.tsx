import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import SearchBar, { SearchFilters } from '../components/SearchBar';
import VideoList from '../components/VideoList';
import { VideoItem } from '../types';
import { searchVideos, getDownloadHistory, clearDownloadHistory, downloadVideo } from '../services/youtube';
import toast, { Toaster } from 'react-hot-toast';
import { Trash2, Download } from 'lucide-react';
import Button from '../components/ui/Button';

interface DownloadHistory {
  filename: string;
  downloadedAt: string;
  size: number;
  videoId: string;
  title?: string;
}

const Home: React.FC = () => {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [downloadHistory, setDownloadHistory] = useState<DownloadHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [viewedVideos, setViewedVideos] = useState<Set<string>>(new Set());
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  useEffect(() => {
    loadDownloadHistory();
    const viewed = localStorage.getItem('viewedVideos');
    if (viewed) {
      setViewedVideos(new Set(JSON.parse(viewed)));
    }
  }, []);

  const loadDownloadHistory = async () => {
    try {
      const history = await getDownloadHistory();
      setDownloadHistory(history.map(item => ({
        ...item,
        title: decodeVideoTitle(item.filename, item.videoId)
      })));
    } catch (error) {
      console.error('Failed to load download history:', error);
    }
  };

  const decodeVideoTitle = (filename: string, videoId: string) => {
    const titleWithExt = filename.replace(`${videoId}_`, '');
    const title = titleWithExt.split('.')[0].replace(/_/g, ' ');
    return title;
  };

  const handleClearHistory = async () => {
    try {
      await clearDownloadHistory();
      setDownloadHistory([]);
      toast.success('Download history cleared successfully');
    } catch (error) {
      toast.error('Failed to clear download history');
    }
  };

  const handleRedownload = async (videoId: string, title: string) => {
    try {
      setIsDownloading(videoId);
      const fileUrl = await downloadVideo(videoId, 'video', title);
      toast.success('Video redownloaded successfully!');
      loadDownloadHistory();
    } catch (error) {
      toast.error('Failed to redownload video');
    } finally {
      setIsDownloading(null);
    }
  };

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

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Byte';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i))} ${sizes[i]}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Download YouTube Videos
              </h2>
              <p className="text-gray-600">
                Search for any YouTube video, select your preferred format, and download with just a click.
              </p>
            </div>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {showHistory ? 'Hide History' : 'Show History'}
            </button>
          </div>
          
          {showHistory && (
            <div className="mb-8 bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Download History</h3>
                {downloadHistory.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearHistory}
                    leftIcon={<Trash2 className="h-4 w-4" />}
                  >
                    Clear History
                  </Button>
                )}
              </div>
              
              {downloadHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Title
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Downloaded
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Size
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {downloadHistory.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <a 
                              href={`https://www.youtube.com/watch?v=${item.videoId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-red-600"
                            >
                              {item.title}
                            </a>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(item.downloadedAt).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatFileSize(item.size)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex gap-2">
                              <a
                                href={`/downloads/${item.filename}`}
                                download
                                className="text-blue-600 hover:text-blue-800"
                              >
                                Download
                              </a>
                              <button
                                onClick={() => handleRedownload(item.videoId, item.title || '')}
                                className="text-green-600 hover:text-green-800 flex items-center"
                                disabled={isDownloading === item.videoId}
                              >
                                {isDownloading === item.videoId ? (
                                  <span>Downloading...</span>
                                ) : (
                                  <>
                                    <Download className="h-4 w-4 mr-1" />
                                    Redownload
                                  </>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No downloads yet</p>
              )}
            </div>
          )}
          
          <SearchBar onSearch={handleSearch} isLoading={isSearching} />
          
          {hasSearched ? (
            <VideoList 
              videos={videos} 
              loading={isSearching} 
              onDownloadComplete={loadDownloadHistory}
              downloadHistory={downloadHistory}
              viewedVideos={viewedVideos}
              setViewedVideos={setViewedVideos}
            />
          ) : (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <div className="mb-4 text-red-600">
                <svg
                  className="w-16 h-16"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
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
import React from 'react';
import { VideoItem } from '../types';
import VideoCard from './VideoCard';

interface VideoListProps {
  videos: VideoItem[];
  loading: boolean;
  onDownloadComplete: () => void;
  downloadHistory: Array<{ videoId: string }>;
  viewedVideos: Set<string>;
  setViewedVideos: (videos: Set<string>) => void;
}

const VideoList: React.FC<VideoListProps> = ({ 
  videos, 
  loading, 
  onDownloadComplete,
  downloadHistory,
  viewedVideos,
  setViewedVideos
}) => {
  if (loading) {
    return (
      <div className="w-full py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 aspect-video rounded-lg mb-3"></div>
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="w-full py-16 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No videos found</h3>
          <p className="text-gray-500">
            Try searching for something else or adjust your filters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <VideoCard 
            key={video.id.videoId} 
            video={video} 
            onDownloadComplete={onDownloadComplete}
            isDownloaded={downloadHistory.some(item => item.videoId === video.id.videoId)}
            isViewed={viewedVideos.has(video.id.videoId)}
            onVideoViewed={(videoId) => {
              const newViewedVideos = new Set(viewedVideos);
              newViewedVideos.add(videoId);
              setViewedVideos(newViewedVideos);
              localStorage.setItem('viewedVideos', JSON.stringify(Array.from(newViewedVideos)));
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default VideoList;
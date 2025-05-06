import React, { useState, useEffect } from 'react';
import { Download, Clock, Eye, ThumbsUp, User, Play, X, CheckCircle2 } from 'lucide-react';
import { VideoItem } from '../types';
import Button from './ui/Button';
import { formatDate, formatDuration, formatViewCount } from '../utils/helpers';
import Select from './ui/Select';
import { downloadVideo, getDownloadProgress } from '../services/youtube';
import toast from 'react-hot-toast';

interface VideoCardProps {
  video: VideoItem;
  onDownloadComplete: () => void;
  isDownloaded: boolean;
  isViewed: boolean;
  onVideoViewed: (videoId: string) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ 
  video, 
  onDownloadComplete, 
  isDownloaded,
  isViewed,
  onVideoViewed
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<'video' | 'audio'>('video');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [localIsDownloaded, setLocalIsDownloaded] = useState(isDownloaded);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    let progressInterval: NodeJS.Timeout;

    if (isDownloading) {
      progressInterval = setInterval(async () => {
        try {
          const progress = await getDownloadProgress(video.id.videoId);
          setDownloadProgress(progress.progress);

          if (progress.status === 'complete') {
            setIsDownloading(false);
            clearInterval(progressInterval);
          } else if (progress.status === 'error') {
            setIsDownloading(false);
            clearInterval(progressInterval);
            toast.error(progress.error || 'Download failed');
          }
        } catch (error) {
          console.error('Error checking progress:', error);
        }
      }, 1000);
    }

    return () => {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };
  }, [isDownloading, video.id.videoId]);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      setDownloadProgress(0);
      const fileUrl = await downloadVideo(video.id.videoId, downloadFormat, video.snippet.title);
      setDownloadUrl(fileUrl);
      setLocalIsDownloaded(true);
      toast.success(`${downloadFormat === 'video' ? 'Video' : 'Audio'} downloaded successfully!`);
      onDownloadComplete();
    } catch (error) {
      toast.error('Failed to download. Please try again.');
      console.error('Download error:', error);
      setIsDownloading(false);
    }
  };

  const handlePreviewClick = () => {
    setShowPreview(true);
    if (!isViewed) {
      onVideoViewed(video.id.videoId);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
      <div className="aspect-video relative group">
        {showPreview ? (
          <div className="relative w-full h-full">
            <iframe
              src={`https://www.youtube.com/embed/${video.id.videoId}?autoplay=1&enablejsapi=1`}
              title={video.snippet.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            <button
              onClick={() => setShowPreview(false)}
              className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-1.5 rounded-full hover:bg-opacity-70 transition-opacity z-10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="cursor-pointer" onClick={handlePreviewClick}>
            <img
              src={video.snippet.thumbnails.high.url}
              alt={video.snippet.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all duration-200">
              <div className="transform scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200">
                <Play className="h-12 w-12 text-white" />
              </div>
            </div>
            {video.contentDetails?.duration && (
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                {formatDuration(video.contentDetails.duration)}
              </div>
            )}
            <div className="absolute top-2 left-2 flex gap-2">
              {isViewed && (
                <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                  <Eye className="h-3 w-3 mr-1" />
                  Viewed
                </div>
              )}
              {(isDownloaded || localIsDownloaded) && (
                <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Downloaded
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold line-clamp-2 mb-2 text-gray-900 dark:text-white">
          {video.snippet.title}
        </h3>
        
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-3">
          <User className="h-3 w-3 mr-1" />
          <span className="mr-3">{video.snippet.channelTitle}</span>
          
          {video.statistics?.viewCount && (
            <>
              <Eye className="h-3 w-3 mr-1" />
              <span className="mr-3">{formatViewCount(video.statistics.viewCount)} views</span>
            </>
          )}
          
          <Clock className="h-3 w-3 mr-1" />
          <span>{formatDate(video.snippet.publishedAt)}</span>
        </div>
        
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
          {video.snippet.description}
        </p>
        
        <div className="flex flex-col gap-3">
          {isDownloading && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
              <div
                className="bg-red-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Select
              className="sm:w-1/2"
              options={[
                { value: 'video', label: 'Video (1080p MP4)' },
                { value: 'audio', label: 'Audio (MP3)' }
              ]}
              value={downloadFormat}
              onChange={(e) => setDownloadFormat(e.target.value as 'video' | 'audio')}
            />
            
            {downloadUrl ? (
              <a
                href={`http://localhost:3001${downloadUrl}`}
                download
                className="sm:w-1/2 inline-flex items-center justify-center bg-green-600 text-white h-10 px-4 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Now
              </a>
            ) : (
              <Button
                className="sm:w-1/2"
                onClick={handleDownload}
                isLoading={isDownloading}
                leftIcon={<Download className="h-4 w-4" />}
              >
                {isDownloading ? `Downloading ${Math.round(downloadProgress)}%` : 'Download'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
import React, { useState } from 'react';
import { Download, Clock, Eye, ThumbsUp, User } from 'lucide-react';
import { VideoItem } from '../types';
import Button from './ui/Button';
import { formatDate, formatDuration, formatViewCount } from '../utils/helpers';
import Select from './ui/Select';
import { downloadVideo } from '../services/youtube';
import toast from 'react-hot-toast';

interface VideoCardProps {
  video: VideoItem;
}

const VideoCard: React.FC<VideoCardProps> = ({ video }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<'video' | 'audio'>('video');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const fileUrl = await downloadVideo(video.id.videoId, downloadFormat);
      setDownloadUrl(fileUrl);
      toast.success(`${downloadFormat === 'video' ? 'Video' : 'Audio'} downloaded successfully!`);
    } catch (error) {
      toast.error('Failed to download. Please try again.');
      console.error('Download error:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
      <div className="aspect-video relative">
        <img
          src={video.snippet.thumbnails.high.url}
          alt={video.snippet.title}
          className="w-full h-full object-cover"
        />
        {video.contentDetails?.duration && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
            {formatDuration(video.contentDetails.duration)}
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold line-clamp-2 mb-2">
          {video.snippet.title}
        </h3>
        
        <div className="flex items-center text-sm text-gray-600 mb-3">
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
        
        <p className="text-sm text-gray-500 mb-4 line-clamp-2">
          {video.snippet.description}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Select
            className="sm:w-1/2"
            options={[
              { value: 'video', label: 'Video (MP4)' },
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
              Download
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
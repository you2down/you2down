import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Video, X, Play } from 'lucide-react';

interface SortableVideoItemProps {
  video: {
    filename: string;
    title?: string;
    size: number;
    videoId: string;
  };
  formatFileSize: (size: number) => string;
  onRemove?: () => void;
}

export const SortableVideoItem: React.FC<SortableVideoItemProps> = ({ 
  video, 
  formatFileSize,
  onRemove 
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: video.videoId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPreview(true);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="aspect-video relative cursor-move">
        {showPreview ? (
          <div className="relative w-full h-full">
            <iframe
              src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1`}
              title={video.title || video.filename}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowPreview(false);
              }}
              className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-1.5 rounded-full hover:bg-opacity-70 transition-opacity z-10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div>
            <img
              src={`https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`}
              alt={video.title || video.filename}
              className="w-full h-full object-cover"
            />
            <button
              onClick={handlePlayClick}
              className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-full flex items-center gap-2 hover:bg-red-700 transition-colors shadow-lg"
            >
              <Play className="h-4 w-4" />
              <span>Play</span>
            </button>
          </div>
        )}
      </div>

      <div className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {video.title || video.filename}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {formatFileSize(video.size)}
            </p>
          </div>
          {onRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
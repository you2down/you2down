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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="aspect-video relative group cursor-move">
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
              className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-1.5 rounded-full hover:bg-opacity-70 transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div onClick={(e) => {
            e.stopPropagation();
            setShowPreview(true);
          }}>
            <img
              src={`https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`}
              alt={video.title || video.filename}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all duration-200">
              <Play className="h-12 w-12 text-white transform scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200" />
            </div>
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
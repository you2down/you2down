import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Folder } from 'lucide-react';

interface Collection {
  id: string;
  name: string;
  videos: string[];
}

interface SortableCollectionItemProps {
  collection: Collection;
  isSelected: boolean;
  onClick: () => void;
  videoCount: number;
}

export const SortableCollectionItem: React.FC<SortableCollectionItemProps> = ({
  collection,
  isSelected,
  onClick,
  videoCount
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: collection.id });

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
      onClick={onClick}
      className={`p-3 rounded-lg cursor-pointer transition-colors ${
        isSelected
          ? 'bg-red-50 border-red-200'
          : 'bg-white hover:bg-gray-50 border-gray-200'
      } border`}
    >
      <div className="flex items-center space-x-3">
        <Folder className={`h-5 w-5 ${isSelected ? 'text-red-500' : 'text-gray-400'}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${
            isSelected ? 'text-red-900' : 'text-gray-900'
          }`}>
            {collection.name}
          </p>
          <p className={`text-xs ${isSelected ? 'text-red-500' : 'text-gray-500'}`}>
            {videoCount} {videoCount === 1 ? 'video' : 'videos'}
          </p>
        </div>
      </div>
    </div>
  );
};
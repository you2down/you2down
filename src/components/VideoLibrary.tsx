import React, { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import { Folder, Plus, Video, Trash2 } from 'lucide-react';
import Button from './ui/Button';
import { formatFileSize } from '../utils/helpers';
import { SortableVideoItem } from './SortableVideoItem';
import { SortableCollectionItem } from './SortableCollectionItem';
import { createCollection, deleteCollection, moveVideoToCollection, removeVideoFromCollection, getCollectionContents } from '../services/youtube';
import toast from 'react-hot-toast';

interface VideoLibraryProps {
  downloadHistory: Array<{
    filename: string;
    downloadedAt: string;
    size: number;
    videoId: string;
    title?: string;
  }>;
}

interface Collection {
  id: string;
  name: string;
  videos: string[];
}

const VideoLibrary: React.FC<VideoLibraryProps> = ({ downloadHistory }) => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [showNewCollectionInput, setShowNewCollectionInput] = useState(false);
  const [collectionVideos, setCollectionVideos] = useState<typeof downloadHistory>([]);

  useEffect(() => {
    try {
      const savedCollections = localStorage.getItem('videoCollections');
      if (savedCollections) {
        const parsedCollections = JSON.parse(savedCollections);
        if (Array.isArray(parsedCollections)) {
          setCollections(parsedCollections);
        }
      }
    } catch (error) {
      console.error('Error loading collections:', error);
    }
  }, []);

  useEffect(() => {
    if (selectedCollection) {
      loadCollectionContents(selectedCollection);
    }
  }, [selectedCollection]);

  const loadCollectionContents = async (collectionName: string) => {
    try {
      const contents = await getCollectionContents(collectionName);
      setCollectionVideos(contents);
    } catch (error) {
      console.error('Error loading collection contents:', error);
      toast.error('Failed to load collection contents');
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem('videoCollections', JSON.stringify(collections));
    } catch (error) {
      console.error('Error saving collections:', error);
    }
  }, [collections]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || !active) return;

    const videoId = active.id as string;
    const collectionId = over.id as string;

    const targetCollection = collections.find(c => c.id === collectionId);
    if (!targetCollection) return;

    const video = downloadHistory.find(v => v.videoId === videoId);
    if (!video) return;

    try {
      await moveVideoToCollection(targetCollection.name, videoId, video.filename);
      
      setCollections(prevCollections => {
        const withoutVideo = prevCollections.map(collection => ({
          ...collection,
          videos: collection.videos.filter(id => id !== videoId)
        }));

        return withoutVideo.map(collection => {
          if (collection.id === collectionId) {
            return {
              ...collection,
              videos: [...collection.videos, videoId]
            };
          }
          return collection;
        });
      });

      if (selectedCollection === targetCollection.name) {
        loadCollectionContents(targetCollection.name);
      }

      toast.success('Video moved to collection successfully');
    } catch (error) {
      console.error('Error moving video:', error);
      toast.error('Failed to move video to collection');
    }
  };

  const createNewCollection = async () => {
    if (newCollectionName.trim()) {
      try {
        await createCollection(newCollectionName.trim());
        
        const newCollection: Collection = {
          id: `collection-${Date.now()}`,
          name: newCollectionName.trim(),
          videos: []
        };
        
        setCollections(prev => [...prev, newCollection]);
        setNewCollectionName('');
        setShowNewCollectionInput(false);
        toast.success('Collection created successfully');
      } catch (error) {
        console.error('Error creating collection:', error);
        toast.error('Failed to create collection');
      }
    }
  };

  const handleDeleteCollection = async (collectionId: string) => {
    const collection = collections.find(c => c.id === collectionId);
    if (!collection) return;

    try {
      await deleteCollection(collection.name);
      setCollections(prev => prev.filter(c => c.id !== collectionId));
      if (selectedCollection === collection.name) {
        setSelectedCollection(null);
        setCollectionVideos([]);
      }
      toast.success('Collection deleted successfully');
    } catch (error) {
      console.error('Error deleting collection:', error);
      toast.error('Failed to delete collection');
    }
  };

  const handleRemoveVideoFromCollection = async (videoId: string, filename: string) => {
    if (!selectedCollection) return;

    try {
      await removeVideoFromCollection(selectedCollection, filename);
      setCollectionVideos(prev => prev.filter(video => video.videoId !== videoId));
      setCollections(prevCollections => 
        prevCollections.map(collection => {
          if (collection.name === selectedCollection) {
            return {
              ...collection,
              videos: collection.videos.filter(id => id !== videoId)
            };
          }
          return collection;
        })
      );
      toast.success('Video removed from collection successfully');
    } catch (error) {
      console.error('Error removing video:', error);
      toast.error('Failed to remove video from collection');
    }
  };

  const handleCollectionClick = (collectionId: string) => {
    const collection = collections.find(c => c.id === collectionId);
    if (collection) {
      setSelectedCollection(prevSelected => 
        prevSelected === collection.name ? null : collection.name
      );
    }
  };

  const displayedVideos = selectedCollection ? collectionVideos : downloadHistory;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Video Library</h2>
        <Button
          variant="outline"
          onClick={() => setShowNewCollectionInput(true)}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          New Collection
        </Button>
      </div>

      {showNewCollectionInput && (
        <div className="mb-6 flex gap-2">
          <input
            type="text"
            value={newCollectionName}
            onChange={(e) => setNewCollectionName(e.target.value)}
            placeholder="Collection name"
            className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                createNewCollection();
              }
            }}
          />
          <Button onClick={createNewCollection}>Create</Button>
          <Button variant="outline" onClick={() => setShowNewCollectionInput(false)}>
            Cancel
          </Button>
        </div>
      )}

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1 space-y-4">
            <h3 className="font-semibold text-gray-700 mb-2">Collections</h3>
            <SortableContext items={collections.map(c => c.id)}>
              {collections.map(collection => (
                <div key={collection.id} className="relative group">
                  <SortableCollectionItem
                    collection={collection}
                    isSelected={selectedCollection === collection.name}
                    onClick={() => handleCollectionClick(collection.id)}
                    videoCount={collection.videos.length}
                  />
                  <button
                    onClick={() => handleDeleteCollection(collection.id)}
                    className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </SortableContext>
            {collections.length === 0 && (
              <p className="text-sm text-gray-500 italic">
                No collections yet. Create one to organize your videos.
              </p>
            )}
          </div>

          <div className="md:col-span-3">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-700 mb-4">
                {selectedCollection
                  ? `Videos in ${collections.find(c => c.name === selectedCollection)?.name}`
                  : 'All Videos'}
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <SortableContext items={displayedVideos.map(v => v.videoId)}>
                  {displayedVideos.map(video => (
                    <SortableVideoItem
                      key={video.videoId}
                      video={video}
                      formatFileSize={formatFileSize}
                      onRemove={selectedCollection ? 
                        () => handleRemoveVideoFromCollection(video.videoId, video.filename) : 
                        undefined}
                    />
                  ))}
                </SortableContext>
                {displayedVideos.length === 0 && (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    {selectedCollection ? (
                      <p>Drag and drop videos here to add them to this collection.</p>
                    ) : (
                      <p>No videos in your library yet.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DndContext>
    </div>
  );
};

export default VideoLibrary;
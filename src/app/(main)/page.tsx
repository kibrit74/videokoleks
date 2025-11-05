'use client';

import { useState } from 'react';
import { videos as initialVideos, categories } from '@/lib/data';
import { VideoCard } from '@/components/video-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, SlidersHorizontal } from 'lucide-react';
import { InstagramIcon, YoutubeIcon, TiktokIcon } from '@/components/icons';
import { AddVideoDialog } from '@/components/add-video-dialog';
import { cn } from '@/lib/utils';
import type { Video } from '@/lib/types';

export default function HomePage() {
  const [videos, setVideos] = useState<Video[]>(initialVideos);
  const [isAddVideoOpen, setAddVideoOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const handleAddVideo = (newVideoData: Omit<Video, 'id' | 'dateAdded' | 'isFavorite' | 'imageHint' | 'thumbnailUrl'>) => {
    const newVideo: Video = {
      ...newVideoData,
      id: (videos.length + 2).toString(),
      dateAdded: 'şimdi',
      isFavorite: false,
      thumbnailUrl: `https://picsum.photos/seed/${videos.length + 2}/400/711`,
      imageHint: 'new video',
    };
    setVideos(prevVideos => [newVideo, ...prevVideos]);
  };


  const filteredVideos = selectedCategoryId
    ? videos.filter(video => video.category.id === selectedCategoryId)
    : videos;

  const handleCategoryClick = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId === selectedCategoryId ? null : categoryId);
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold font-headline mb-2 text-center md:text-left">📦 VideoKoleks</h1>
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-grow w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input placeholder="Video, kategori ara..." className="pl-10 h-12 text-lg" />
          </div>
          <Button size="lg" className="w-full md:w-auto" onClick={() => setAddVideoOpen(true)}>
            <Plus className="mr-2 h-5 w-5" /> Video Ekle
          </Button>
        </div>
      </header>

      <div className="mb-6 space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
            <Badge 
              variant={selectedCategoryId === null ? 'default' : 'secondary'} 
              className="py-2 px-4 text-sm cursor-pointer"
              onClick={() => handleCategoryClick(null)}
            >
              Tümü
            </Badge>
            {categories.map((cat) => (
                <Badge 
                  key={cat.id} 
                  variant={selectedCategoryId === cat.id ? 'default' : 'secondary'} 
                  className="py-2 px-4 text-sm cursor-pointer hover:bg-muted-foreground/50"
                  onClick={() => handleCategoryClick(cat.id)}
                >
                  {cat.name}
                </Badge>
            ))}
            <Button variant="ghost" size="sm"><SlidersHorizontal className="h-4 w-4 mr-2"/>Filtreler</Button>
        </div>
        <div className="flex gap-2 items-center justify-center md:justify-start">
            <Button variant="outline" size="sm" className="border-primary text-primary"><InstagramIcon className="h-4 w-4 mr-2" /> Instagram</Button>
            <Button variant="outline" size="sm"><YoutubeIcon className="h-4 w-4 mr-2" /> YouTube</Button>
            <Button variant="outline" size="sm"><TiktokIcon className="h-4 w-4 mr-2" /> TikTok</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
        {filteredVideos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
      <AddVideoDialog 
        isOpen={isAddVideoOpen} 
        onOpenChange={setAddVideoOpen}
        onSave={handleAddVideo}
      />
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { categories } from '@/lib/data';
import { PlusCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Video, Category } from '@/lib/types';
import { cn } from '@/lib/utils';
import { fetchVideoDetails } from '@/ai/flows/fetch-video-details';
import Image from 'next/image';

type NewVideoData = Omit<
  Video,
  'id' | 'dateAdded' | 'isFavorite' | 'imageHint'
>;

interface AddVideoDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (videoData: NewVideoData) => void;
}

export function AddVideoDialog({
  isOpen,
  onOpenChange,
  onSave,
}: AddVideoDialogProps) {
  const { toast } = useToast();
  const [videoUrl, setVideoUrl] = useState('');
  const [videoDetails, setVideoDetails] = useState<{
    title: string;
    thumbnailUrl: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!videoUrl) {
      setVideoDetails(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const details = await fetchVideoDetails({ videoUrl });
        if (details.title && details.thumbnailUrl) {
          setVideoDetails(details);
        } else {
          setVideoDetails(null);
          toast({
            variant: 'destructive',
            title: 'Detaylar Alınamadı',
            description:
              'Video detayları alınamadı. Lütfen URL’yi kontrol edin.',
          });
        }
      } catch (error) {
        console.error('Error fetching video details:', error);
        setVideoDetails(null);
        toast({
          variant: 'destructive',
          title: 'Hata',
          description: 'Video detayları alınırken bir hata oluştu.',
        });
      } finally {
        setIsLoading(false);
      }
    }, 1000); // Debounce for 1 second

    return () => clearTimeout(timer);
  }, [videoUrl, toast]);

  const getPlatformFromUrl = (url: string): Video['platform'] => {
    if (url.includes('instagram.com')) return 'instagram';
    if (url.includes('youtube.com') || url.includes('youtu.be'))
      return 'youtube';
    if (url.includes('tiktok.com')) return 'tiktok';
    return 'instagram'; // default
  };

  const handleSave = () => {
    if (!videoUrl || !selectedCategory || !videoDetails) {
      toast({
        variant: 'destructive',
        title: 'Eksik Bilgi',
        description:
          'Lütfen video linki, kategori ve video detaylarının yüklendiğinden emin olun.',
      });
      return;
    }

    const platform = getPlatformFromUrl(videoUrl);

    onSave({
      title: videoDetails.title,
      thumbnailUrl: videoDetails.thumbnailUrl,
      originalUrl: videoUrl,
      platform,
      category: selectedCategory,
      duration: '0:00', // This could be fetched as well in a future version
      notes: notes,
    });

    toast({
      title: 'Video Kaydedildi! ✨',
      description: 'Videonuz koleksiyonunuza eklendi.',
    });

    // Reset form and close
    setVideoUrl('');
    setSelectedCategory(null);
    setNotes('');
    setVideoDetails(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Video Ekle</DialogTitle>
          <DialogDescription>
            Kaydetmek istediğiniz videonun linkini yapıştırın.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="video-url">Video Linki</Label>
            <Input
              id="video-url"
              placeholder="https://www.instagram.com/reels/..."
              value={videoUrl}
              onChange={e => setVideoUrl(e.target.value)}
            />
          </div>

          {isLoading && (
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Video bilgileri getiriliyor...</span>
            </div>
          )}

          {videoDetails && (
            <div className="space-y-4">
              <div className="relative aspect-video w-full overflow-hidden rounded-md">
                <Image
                  src={videoDetails.thumbnailUrl}
                  alt="Video thumbnail"
                  fill
                  className="object-cover"
                />
              </div>
              <p className="font-semibold text-sm">{videoDetails.title}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Kategori seç</Label>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <Button
                  key={cat.id}
                  variant={
                    selectedCategory?.id === cat.id ? 'default' : 'outline'
                  }
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className="transition-all"
                >
                  {cat.emoji} {cat.name}
                </Button>
              ))}
              <Button variant="outline" size="sm" disabled>
                <PlusCircle className="mr-2 h-4 w-4" /> Yeni Kategori
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Not ekle (opsiyonel)</Label>
            <Textarea
              id="notes"
              placeholder="Bu videoyla ilgili notlarınız..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button onClick={handleSave} disabled={!videoDetails || isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Kaydet'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

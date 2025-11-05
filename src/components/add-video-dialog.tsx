'use client';

import { useState } from 'react';
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
import { PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Video, Category } from '@/lib/types';
import { cn } from '@/lib/utils';


type NewVideoData = Omit<Video, 'id' | 'dateAdded' | 'isFavorite' | 'imageHint' | 'thumbnailUrl'>;

interface AddVideoDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (videoData: NewVideoData) => void;
}

export function AddVideoDialog({ isOpen, onOpenChange, onSave }: AddVideoDialogProps) {
  const { toast } = useToast();
  const [videoUrl, setVideoUrl] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [notes, setNotes] = useState('');

  const getPlatformFromUrl = (url: string): Video['platform'] => {
    if (url.includes('instagram.com')) return 'instagram';
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('tiktok.com')) return 'tiktok';
    return 'instagram'; // default
  };

  const handleSave = () => {
    if (!videoUrl || !selectedCategory) {
        toast({
            variant: 'destructive',
            title: 'Eksik Bilgi',
            description: 'Lütfen video linki ve kategori seçtiğinizden emin olun.',
        });
        return;
    }

    const platform = getPlatformFromUrl(videoUrl);

    onSave({
        title: `Yeni Video - ${selectedCategory.name}`,
        originalUrl: videoUrl,
        platform,
        category: selectedCategory,
        duration: '0:00',
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
              onChange={(e) => setVideoUrl(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Kategori seç</Label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Button 
                    key={cat.id} 
                    variant={selectedCategory?.id === cat.id ? 'default' : 'outline'} 
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
                onChange={(e) => setNotes(e.target.value)} 
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>İptal</Button>
          <Button onClick={handleSave}>Kaydet</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

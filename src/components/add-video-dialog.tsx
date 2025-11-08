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
import { PlusCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Video, Category, Platform } from '@/lib/types';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, serverTimestamp, setDoc, doc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { getVideoMetadata } from '@/app/actions';

interface AddVideoDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function AddVideoDialog({
  isOpen,
  onOpenChange,
}: AddVideoDialogProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const [videoUrl, setVideoUrl] = useState('');
  const [videoDetails, setVideoDetails] = useState<{
    title: string;
    thumbnailUrl?: string;
    duration?: string;
  } | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [notes, setNotes] = useState('');

  const categoriesQuery = useMemoFirebase(() =>
    (user?.uid && firestore) ? collection(firestore, 'users', user.uid, 'categories') : null
  , [firestore, user?.uid]);
  const { data: categories, isLoading: categoriesLoading } = useCollection<Category>(categoriesQuery);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when dialog closes
      setVideoUrl('');
      setVideoDetails(null);
      setSelectedCategory(null);
      setNotes('');
      setIsFetching(false);
      setIsSaving(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!videoUrl) {
      setVideoDetails(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsFetching(true);
      setVideoDetails(null);
      
      try {
        const metadata = await getVideoMetadata(videoUrl);

        if (metadata && metadata.title) {
          // Simple duration formatting - unfurl doesn't provide it
           const formatDuration = (seconds: number | undefined) => {
            if (!seconds) return undefined;
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = Math.floor(seconds % 60);
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
          };

          setVideoDetails({
            title: metadata.title,
            thumbnailUrl: metadata.thumbnail,
            duration: formatDuration(metadata.duration)
          });
        } else {
           toast({
            variant: 'destructive',
            title: 'Detaylar Alınamadı',
            description: 'Bu video için başlık bulunamadı. Lütfen URL’yi kontrol edin.',
          });
        }
      } catch (error) {
        console.error('Fetch metadata error:', error);
        toast({
          variant: 'destructive',
          title: 'Detaylar Alınamadı',
          description: 'Lütfen URL’yi kontrol edin veya farklı bir video deneyin.',
        });
      } finally {
        setIsFetching(false);
      }
    }, 1000); // Debounce for 1 second

    return () => clearTimeout(timer);
  }, [videoUrl, toast]);

  const getPlatformFromUrl = (url: string): Platform => {
    if (url.includes('instagram.com')) return 'instagram';
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('tiktok.com')) return 'tiktok';
    if (url.includes('facebook.com') || url.includes('fb.watch')) return 'facebook';
    return 'instagram'; 
  };

  const handleSave = async () => {
    if (!user || !firestore || !videoUrl || !selectedCategory || !videoDetails?.title) {
      toast({
        variant: 'destructive',
        title: 'Eksik Bilgi',
        description: 'Lütfen video linki, başlık ve kategori girdiğinizden emin olun.',
      });
      return;
    }

    setIsSaving(true);
    const platform = getPlatformFromUrl(videoUrl);
    
    const videosCollectionRef = collection(firestore, 'users', user.uid, 'videos');
    const newVideoRef = doc(videosCollectionRef);

    const videoData: Video = {
        id: newVideoRef.id,
        title: videoDetails.title,
        thumbnailUrl: videoDetails.thumbnailUrl || `https://picsum.photos/seed/${new Date().getTime()}/480/854`,
        imageHint: "video thumbnail",
        originalUrl: videoUrl,
        platform,
        categoryId: selectedCategory.id,
        duration: videoDetails.duration || '0:00',
        notes: notes,
        isFavorite: false,
        dateAdded: serverTimestamp(),
    };

    try {
        await setDoc(newVideoRef, videoData);
        
        toast({
          title: 'Video Kaydedildi! ✨',
          description: 'Videonuz koleksiyonunuza eklendi.',
        });
        
        onOpenChange(false);
    } catch(serverError: any) {
         const permissionError = new FirestorePermissionError({
            path: newVideoRef.path,
            operation: 'create',
            requestResourceData: videoData,
        });
        errorEmitter.emit('permission-error', permissionError);
        // Also show a toast to the user
        toast({
          variant: 'destructive',
          title: 'Kaydedilemedi',
          description: 'Video kaydedilirken bir hata oluştu. İzinlerinizi kontrol edin.'
        });
    } finally {
        setIsSaving(false);
    }
  };
  
  const isLoading = isFetching || isSaving;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px] grid-rows-[auto,1fr,auto] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl">Video Ekle</DialogTitle>
            <DialogDescription>
              Kaydetmek istediğiniz videonun linkini yapıştırın.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="pr-6 -mr-6">
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="video-url">Video Linki</Label>
                <Input
                  id="video-url"
                  placeholder="https://www.instagram.com/reels/..."
                  value={videoUrl}
                  onChange={e => setVideoUrl(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              {isFetching && (
                <div className="flex items-center justify-center h-24">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Video bilgileri getiriliyor...</span>
                </div>
              )}

              {videoDetails && (
                <div className="space-y-4">
                  {videoDetails.thumbnailUrl && (
                    <div className="relative aspect-video w-full overflow-hidden rounded-md">
                      <Image
                        src={videoDetails.thumbnailUrl}
                        alt="Video thumbnail"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <p className="font-semibold text-sm">{videoDetails.title}</p>
                   {videoDetails.duration && (
                    <p className="text-xs text-muted-foreground">Süre: {videoDetails.duration}</p>
                   )}
                </div>
              )}

              <div className="space-y-2">
                <Label>Kategori seç</Label>
                <div className="flex flex-wrap gap-2">
                  {categoriesLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                      categories?.map(cat => (
                          <Button
                              key={cat.id}
                              variant={
                              selectedCategory?.id === cat.id ? 'default' : 'outline'
                              }
                              size="sm"
                              onClick={() => setSelectedCategory(cat)}
                              className="transition-all"
                              disabled={isLoading}
                          >
                              {cat.emoji} {cat.name}
                          </Button>
                      ))
                  )}
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
                  disabled={isLoading}
                />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              İptal
            </Button>
            <Button onClick={handleSave} disabled={!videoDetails?.title || !selectedCategory || isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Kaydet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

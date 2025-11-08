'use client';

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Heart,
  ExternalLink,
  Trash2,
  AlertTriangle,
  Share2,
  Loader2
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { InstagramIcon, YoutubeIcon, TiktokIcon, FacebookIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import type { Platform, Video, Category } from '@/lib/types';
import { useMemo, useEffect, useState, useRef } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { firebaseConfig } from '@/firebase/config';

const platformIcons: Record<Platform, React.ComponentType<{ className?: string }>> = {
  instagram: InstagramIcon,
  youtube: YoutubeIcon,
  tiktok: TiktokIcon,
  facebook: FacebookIcon,
};

function getEmbedUrl(url: string, platform: Platform): string | null {
    try {
        if (platform !== 'youtube') {
            return null;
        }

        const cleanedUrl = url.endsWith('/') ? url.slice(0, -1) : url;
        const urlObject = new URL(cleanedUrl);

        if (platform === 'youtube') {
            let videoId = urlObject.searchParams.get('v');
            if (!videoId && urlObject.hostname === 'youtu.be') {
                videoId = urlObject.pathname.slice(1);
            } else if (!videoId) {
                const pathParts = urlObject.pathname.split('/');
                videoId = pathParts[pathParts.length - 1];
            }
            return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
        }

    } catch(e) {
        console.error("Invalid URL for embedding:", url, e);
        return null;
    }
    return null;
}


export default function VideoDetailPage() {
  const params = useParams();
  const videoId = params.id as string;
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const videoDocRef = useMemoFirebase(() => 
    (firestore && user?.uid && videoId) ? doc(firestore, 'users', user.uid, 'videos', videoId) : null
  , [firestore, user?.uid, videoId]);

  const { data: currentVideo, isLoading: videoLoading } = useDoc<Video>(videoDocRef);
  
  const categoryDocRef = useMemoFirebase(() => 
    (firestore && user?.uid && currentVideo?.categoryId) ? doc(firestore, 'users', user.uid, 'categories', currentVideo.categoryId) : null,
    [firestore, user?.uid, currentVideo?.categoryId]
  );
  const { data: category } = useDoc<Category>(categoryDocRef);
  
  const [fbPlayerLoading, setFbPlayerLoading] = useState(true);
  const videoPlayerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    if (!currentVideo || currentVideo.platform !== 'facebook') return;
  
    setFbPlayerLoading(true);

    const initFacebookSdk = () => {
      if (!isMounted) return;

      // If SDK is already loaded and initialized, just parse the new video
      if (window.FB) {
        window.FB.XFBML.parse(videoPlayerRef.current, () => {
          if (isMounted) setFbPlayerLoading(false);
        });
      } else {
        // If SDK is not loaded, define fbAsyncInit and load the script
        window.fbAsyncInit = function() {
          if (!isMounted || !window.FB) return;
          window.FB.init({
            appId: firebaseConfig.facebookAppId,
            xfbml: true,
            version: 'v20.0'
          });
          // After init, parse the video player
          window.FB.XFBML.parse(videoPlayerRef.current, () => {
            if (isMounted) setFbPlayerLoading(false);
          });
        };
  
        // Load the SDK script if it doesn't exist
        if (!document.getElementById('facebook-jssdk')) {
          const script = document.createElement('script');
          script.id = 'facebook-jssdk';
          script.src = "https://connect.facebook.net/en_US/sdk.js";
          script.async = true;
          script.defer = true;
          script.crossOrigin = 'anonymous';
          script.onerror = () => {
            if (isMounted) {
              console.error("Facebook SDK could not be loaded.");
              setFbPlayerLoading(false); 
            }
          };
          document.head.appendChild(script);
        }
      }
    };
  
    initFacebookSdk();
  
    return () => {
      isMounted = false;
      // Clean up the dynamically added elements if necessary
      const script = document.getElementById('facebook-jssdk');
      if (script && script.parentElement === document.head) {
        // In some strict React modes, this might be too aggressive if another component needs it
        // but for this single-purpose page, it's safer.
        // document.head.removeChild(script);
      }
      // @ts-ignore
      delete window.fbAsyncInit;
    };
  }, [currentVideo]);


  if (videoLoading) {
    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
             <div className="relative w-full max-w-sm aspect-[9/16] bg-card overflow-hidden rounded-lg">
                <Skeleton className="w-full h-full" />
             </div>
        </div>
    )
  }

  if (!currentVideo) {
    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white text-center p-4">
            <AlertTriangle className="w-12 h-12 text-primary mb-4" />
            <h1 className="text-2xl font-bold">Video bulunamadı.</h1>
            <p className="text-muted-foreground">Bu video silinmiş veya hiç var olmamış olabilir.</p>
            <Button asChild variant="ghost" size="lg" className="mt-4 text-white hover:bg-white/10">
                <Link href="/">
                    <ArrowLeft className="mr-2" /> Ana Sayfaya Dön
                </Link>
            </Button>
        </div>
    )
  }

  const PlatformIcon = platformIcons[currentVideo.platform];
  const embedUrl = getEmbedUrl(currentVideo.originalUrl, currentVideo.platform);

  const toggleFavorite = () => {
      if (!videoDocRef || !currentVideo) return;
      const newFavoriteStatus = !currentVideo.isFavorite;
      updateDoc(videoDocRef, { isFavorite: newFavoriteStatus })
        .then(() => {
            toast({ title: newFavoriteStatus ? 'Favorilere eklendi! ⭐' : 'Favorilerden kaldırıldı.' });
        })
        .catch(serverError => {
            const permissionError = new FirestorePermissionError({
                path: videoDocRef.path,
                operation: 'update',
                requestResourceData: { isFavorite: newFavoriteStatus },
            });
            errorEmitter.emit('permission-error', permissionError);
        });
  }
  
  const deleteVideo = () => {
    if (!videoDocRef) {
      toast({ variant: 'destructive', title: 'Hata', description: 'Video referansı bulunamadı.' });
      return;
    }
    deleteDoc(videoDocRef)
      .then(() => {
        toast({ title: 'Video silindi.'});
        router.push('/');
      })
      .catch(serverError => {
          const permissionError = new FirestorePermissionError({
              path: videoDocRef.path,
              operation: 'delete',
          });
          errorEmitter.emit('permission-error', permissionError);
      });
  }

  const handleShare = async () => {
    const shareUrl = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: currentVideo.title,
          text: `Şu videoya göz at: ${currentVideo.title}`,
          url: shareUrl,
        });
      } else {
        throw new Error('Web Share API not supported');
      }
    } catch (error: any) {
      if (error.name === 'NotAllowedError' || error.message.includes('Web Share API not supported') || error.message.includes('Permission denied')) {
        try {
            await navigator.clipboard.writeText(shareUrl);
            toast({ title: "Paylaşım menüsü desteklenmiyor. Link panoya kopyalandı!" });
        } catch (err) {
            toast({ variant: 'destructive', title: "Paylaşılamadı", description: "Link paylaşılamadı veya panoya kopyalanamadı." });
        }
      } else {
         console.error('Share failed:', error);
         toast({ variant: 'destructive', title: "Paylaşılamadı", description: "Beklenmedik bir hata oluştu." });
      }
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Bilinmiyor';
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    return 'Az önce';
  }

  const renderVideoPlayer = () => {
    if (currentVideo.platform === 'facebook') {
      return (
        <div ref={videoPlayerRef} className="w-full h-full flex-1 flex items-center justify-center bg-black relative">
            {fbPlayerLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground z-10">
                    <Loader2 className="h-8 w-8 animate-spin mb-2" />
                    <span>Facebook oynatıcı yükleniyor...</span>
                </div>
            )}
            <div
                className={cn("fb-video", fbPlayerLoading && "hidden")}
                data-href={currentVideo.originalUrl}
                data-width="auto"
                data-height="auto"
                data-allowfullscreen="true"
                data-autoplay="false"
                data-lazy="true"
            >
              <blockquote cite={currentVideo.originalUrl} className="fb-xfbml-parse-ignore">
                <a href={currentVideo.originalUrl}>Facebook Video</a>
              </blockquote>
            </div>
        </div>
      );
    }
    
    if (embedUrl) {
      return (
        <iframe
          key={embedUrl}
          src={embedUrl}
          className="w-full h-full border-0 flex-1"
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          allowFullScreen
          title={currentVideo.title}
          scrolling="no"
        ></iframe>
      );
    }
    
    return (
      <div className="flex-1 relative flex items-center justify-center bg-zinc-900">
        <Image
          src={currentVideo.thumbnailUrl}
          alt={currentVideo.title}
          fill
          sizes="100vw"
          priority
          className="object-contain"
          data-ai-hint={currentVideo.imageHint}
        />
        <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center text-center p-4">
          <AlertTriangle className="w-10 h-10 text-yellow-400 mb-2"/>
          <p className="text-white font-semibold">Bu video uygulama içinde oynatılamıyor.</p>
          <Button asChild size="sm" className="mt-4">
            <Link href={currentVideo.originalUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4"/> Orijinali Aç
            </Link>
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-2 md:p-4">
      <div className="relative w-full max-w-sm aspect-[9/16] bg-card overflow-hidden rounded-lg shadow-2xl shadow-primary/20 flex flex-col">
        <header className="absolute top-0 left-0 right-0 z-20 p-2 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent">
            <Button asChild variant="ghost" size="icon" className="bg-black/30 hover:bg-black/50 text-white rounded-full">
              <Link href="/">
                <ArrowLeft />
              </Link>
            </Button>
        </header>
        
        {renderVideoPlayer()}
        
        <div className="p-4 bg-card text-card-foreground shrink-0">
            <h1 className="text-lg font-bold font-headline line-clamp-2">{currentVideo.title}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <PlatformIcon className="h-4 w-4" />
                <span>{currentVideo.platform}</span>
                <span>•</span>
                <span>{currentVideo.duration}</span>
                 <span>•</span>
                <span className="text-xs">{formatDate(currentVideo.dateAdded)}</span>
            </div>
            
            {category && <p className="text-sm mt-2"><span className={cn("inline-block w-6 text-center mr-1 p-1 rounded-md", category.color)}>{category.emoji}</span> Kategori: {category.name}</p>}
            {currentVideo.notes && <p className="text-sm bg-muted p-2 rounded-md mt-2">📝 Not: "{currentVideo.notes}"</p>}

            <div className="flex justify-around items-center pt-3 mt-3 border-t">
                <Button variant="ghost" className="flex-col h-auto text-muted-foreground gap-1 hover:text-primary" onClick={toggleFavorite}>
                    <Heart className={cn("w-5 h-5", currentVideo.isFavorite && "fill-red-500 text-red-500")} />
                    <span className="text-xs">Favori</span>
                </Button>

                <Button variant="ghost" className="flex-col h-auto text-muted-foreground gap-1 hover:text-primary" onClick={handleShare}>
                    <Share2 className="w-5 h-5"/>
                    <span className="text-xs">Paylaş</span>
                </Button>
                
                <Button asChild variant="ghost" className="flex-col h-auto text-muted-foreground gap-1 hover:text-primary">
                    <Link href={currentVideo.originalUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-5 h-5"/>
                        <span className="text-xs">Harici Link</span>
                    </Link>
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button data-testid="delete-video-button" variant="ghost" className="flex-col h-auto text-red-500/80 hover:text-red-500 gap-1">
                        <Trash2 className="w-5 h-5"/>
                        <span className="text-xs">Sil</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Videoyu Silmek İstediğinizden Emin misiniz?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Bu işlem geri alınamaz. "{currentVideo.title}" başlıklı video kalıcı olarak koleksiyonunuzdan silinecektir.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>İptal</AlertDialogCancel>
                      <AlertDialogAction onClick={deleteVideo} className="bg-destructive hover:bg-destructive/90">
                        Sil
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
          </div>
      </div>
    </div>
  );
}

    
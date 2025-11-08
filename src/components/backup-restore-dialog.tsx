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
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';
import { collection, getDocs, writeBatch, doc, query, where } from 'firebase/firestore';
import { Loader2, Download, Upload, AlertTriangle } from 'lucide-react';
import type { Category, Video } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Progress } from './ui/progress';
import { ScrollArea } from './ui/scroll-area';

interface BackupRestoreDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

// Backup data structure now explicitly includes Category's original name for mapping
interface BackupCategory extends Omit<Category, 'id' | 'userId'> {
  name: string;
}
interface BackupVideo extends Omit<Video, 'id' | 'userId' | 'dateAdded'> {
  categoryName: string; // Store category name instead of ID
}

interface BackupData {
  categories: BackupCategory[];
  videos: BackupVideo[];
}

export function BackupRestoreDialog({ isOpen, onOpenChange }: BackupRestoreDialogProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Giriş yapmalısınız.' });
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const categoriesQuery = query(collection(firestore, 'categories'), where('userId', '==', user.uid));
      const videosQuery = query(collection(firestore, 'videos'), where('userId', '==', user.uid));

      const [categoriesSnapshot, videosSnapshot] = await Promise.all([
        getDocs(categoriesQuery),
        getDocs(videosQuery),
      ]);

      const categoriesData = categoriesSnapshot.docs.map(doc => doc.data() as Category);
      const categoryIdToNameMap = new Map(categoriesData.map(c => [c.id, c.name]));

      const categories: BackupCategory[] = categoriesData.map(c => {
        const { id, userId, ...data } = c;
        return data;
      });

      const videos: BackupVideo[] = videosSnapshot.docs.map(doc => {
        const { id, userId, dateAdded, categoryId, ...data } = doc.data() as Video;
        return {
            ...data,
            categoryName: categoryIdToNameMap.get(categoryId) || "Uncategorized"
        };
      });

      const backupData: BackupData = { categories, videos };
      
      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `videokoleks_backup_${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Yedekleme Başarılı!',
        description: 'Tüm verileriniz başarıyla indirildi.',
      });

    } catch (err) {
      console.error('Export error:', err);
      setError('Veriler dışa aktarılırken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'Giriş yapmalısınız.' });
      return;
    }
    const file = event.target.files?.[0];
    if (!file) return;

    const confirmed = window.confirm(
        'Emin misiniz? Bu işlem mevcut tüm kategorilerinizi ve videolarınızı silecek ve yedekleme dosyasındaki verilerle değiştirecektir. Bu işlem geri alınamaz.'
    );

    if (!confirmed) {
        event.target.value = ''; // Reset file input
        return;
    }

    setIsRestoring(true);
    setError(null);
    setRestoreProgress(0);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error('Dosya okunamadı.');
        }
        const data = JSON.parse(text) as BackupData;
        
        if (!data.categories || !data.videos || !Array.isArray(data.categories) || !Array.isArray(data.videos)) {
            throw new Error('Geçersiz yedekleme dosyası formatı. `categories` ve `videos` dizileri bulunmalı.');
        }

        // 1. Delete all existing data
        const deleteBatch = writeBatch(firestore);
        const existingCategoriesQuery = query(collection(firestore, 'categories'), where('userId', '==', user.uid));
        const existingVideosQuery = query(collection(firestore, 'videos'), where('userId', '==', user.uid));
        
        const [existingCategoriesSnap, existingVideosSnap] = await Promise.all([
            getDocs(existingCategoriesQuery),
            getDocs(existingVideosQuery)
        ]);

        existingCategoriesSnap.forEach(doc => deleteBatch.delete(doc.ref));
        existingVideosSnap.forEach(doc => deleteBatch.delete(doc.ref));
        await deleteBatch.commit();
        setRestoreProgress(10); // Progress after deletion

        // 2. Restore Categories and create a name -> new ID map
        const newCategoryNameToIdMap = new Map<string, string>();
        const categoryBatch = writeBatch(firestore);
        
        data.categories.forEach(category => {
            const newDocRef = doc(collection(firestore, 'categories'));
            categoryBatch.set(newDocRef, { ...category, userId: user.uid, id: newDocRef.id });
            newCategoryNameToIdMap.set(category.name, newDocRef.id);
        });
        await categoryBatch.commit();
        setRestoreProgress(40); // Progress after categories are restored

        // 3. Restore Videos using the new category ID map
        const videoBatch = writeBatch(firestore);
        const totalVideos = data.videos.length;
        data.videos.forEach((video, index) => {
            const newDocRef = doc(collection(firestore, 'videos'));
            const newCategoryId = newCategoryNameToIdMap.get(video.categoryName) || '';
            const videoData = { 
                ...video, 
                userId: user.uid, 
                dateAdded: new Date(), 
                categoryId: newCategoryId,
                // Remove categoryName property before writing to Firestore
                categoryName: undefined
            };
            delete videoData.categoryName;
            
            videoBatch.set(newDocRef, { ...videoData, id: newDocRef.id });
            setRestoreProgress(40 + Math.round(((index + 1) / totalVideos) * 60));
        });
        await videoBatch.commit();

        toast({
            title: 'Geri Yükleme Başarılı!',
            description: `${data.categories.length} kategori ve ${data.videos.length} video koleksiyonunuza geri yüklendi.`,
        });
        
        onOpenChange(false);
        // Force a page reload to see the new data correctly
        window.location.reload();

      } catch (err: any) {
        console.error('Import error:', err);
        setError(`Geri yükleme başarısız: ${err.message || 'Lütfen dosyanızı kontrol edin.'}`);
      } finally {
        setIsRestoring(false);
        setRestoreProgress(0);
        if(event.target) event.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md grid-rows-[auto,1fr,auto] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Yedekleme & Senkronizasyon</DialogTitle>
          <DialogDescription>
            Tüm video ve kategori verilerinizi bir dosya olarak indirin veya daha önce indirdiğiniz bir dosyadan geri yükleyin.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className='-mr-6 pr-6'>
            {error && (
                <Alert variant="destructive" className='mb-4'>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Hata</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="space-y-4 py-4">
                <div className='p-4 border rounded-lg'>
                    <h3 className="font-semibold mb-2 flex items-center gap-2"><Download className='w-5 h-5'/> Verileri Dışa Aktar</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Koleksiyonunuzun tamamını (`.json` dosyası) bilgisayarınıza yedekleyin.
                    </p>
                    <Button onClick={handleExport} disabled={isLoading || isRestoring} className="w-full">
                        {isLoading ? <Loader2 className="animate-spin" /> : 'Yedeği İndir'}
                    </Button>
                </div>
                
                <div className='p-4 border rounded-lg'>
                    <h3 className="font-semibold mb-2 flex items-center gap-2"><Upload className='w-5 h-5'/> Verileri İçe Aktar</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                    Bir yedekleme dosyasını geri yükleyin. 
                    <span className="font-bold text-destructive"> Bu işlem mevcut tüm verilerinizi siler ve yedeklemedeki verilerle değiştirir.</span>
                    </p>
                    <Button asChild variant="outline" className="w-full" disabled={isLoading || isRestoring}>
                        <label htmlFor="import-file">
                            {isRestoring ? <Loader2 className="animate-spin" /> : 'Yedekten Geri Yükle'}
                            <input type="file" id="import-file" accept=".json" onChange={handleImport} className="hidden" disabled={isLoading || isRestoring} />
                        </label>
                    </Button>
                    {isRestoring && (
                        <div className="mt-4 space-y-2">
                            <Progress value={restoreProgress} />
                            <p className="text-sm text-center text-muted-foreground">
                                Geri yükleniyor... ({Math.round(restoreProgress)}%)
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isLoading || isRestoring}>Kapat</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

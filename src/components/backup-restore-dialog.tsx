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
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { Loader2, Download, Upload, AlertTriangle, CheckCircle } from 'lucide-react';
import type { Category, Video } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Progress } from './ui/progress';

interface BackupRestoreDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

interface BackupData {
  categories: Omit<Category, 'id' | 'userId'>[];
  videos: Omit<Video, 'id' | 'userId' | 'dateAdded'>[];
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
      const categoriesRef = collection(firestore, 'users', user.uid, 'categories');
      const videosRef = collection(firestore, 'users', user.uid, 'videos');

      const [categoriesSnapshot, videosSnapshot] = await Promise.all([
        getDocs(categoriesRef),
        getDocs(videosRef),
      ]);

      const categories = categoriesSnapshot.docs.map(doc => {
        const { id, userId, ...data } = doc.data();
        return data;
      }) as Omit<Category, 'id' | 'userId'>[];

      const videos = videosSnapshot.docs.map(doc => {
        const { id, userId, dateAdded, ...data } = doc.data();
        return data;
      }) as Omit<Video, 'id' | 'userId' | 'dateAdded'>[];

      const backupData: BackupData = { categories, videos };
      
      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'videokoleks_backup.json';
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
        
        // Validate data structure
        if (!data.categories || !data.videos || !Array.isArray(data.categories) || !Array.isArray(data.videos)) {
            throw new Error('Geçersiz yedekleme dosyası formatı.');
        }

        const batch = writeBatch(firestore);
        const totalOperations = data.categories.length + data.videos.length;
        let completedOperations = 0;

        // Note: This process will overwrite existing data.
        // A more robust solution might delete old data first or merge.
        
        // Add categories
        data.categories.forEach(category => {
            const newDocRef = doc(collection(firestore, 'users', user.uid, 'categories'));
            batch.set(newDocRef, { ...category, userId: user.uid });
            completedOperations++;
            setRestoreProgress((completedOperations / totalOperations) * 100);
        });

        // Add videos
        data.videos.forEach(video => {
            const newDocRef = doc(collection(firestore, 'users', user.uid, 'videos'));
             const videoData = { ...video, userId: user.uid, dateAdded: new Date() };
            batch.set(newDocRef, videoData);
            completedOperations++;
            setRestoreProgress((completedOperations / totalOperations) * 100);
        });
        
        await batch.commit();

        toast({
            title: 'Geri Yükleme Başarılı!',
            description: `${totalOperations} öğe koleksiyonunuza geri yüklendi.`,
        });
        
        onOpenChange(false);

      } catch (err: any) {
        console.error('Import error:', err);
        setError(`Geri yükleme başarısız: ${err.message || 'Lütfen dosyanızı kontrol edin.'}`);
      } finally {
        setIsRestoring(false);
        setRestoreProgress(0);
        // Reset file input
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Yedekleme & Senkronizasyon</DialogTitle>
          <DialogDescription>
            Tüm video ve kategori verilerinizi bir dosya olarak indirin veya daha önce indirdiğiniz bir dosyadan geri yükleyin.
          </DialogDescription>
        </DialogHeader>

        {error && (
            <Alert variant="destructive">
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
                   Daha önce oluşturulmuş bir yedekleme dosyasını geri yükleyin. Bu işlem mevcut verilerinizin üzerine yazmaz, ekler.
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

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isLoading || isRestoring}>Kapat</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

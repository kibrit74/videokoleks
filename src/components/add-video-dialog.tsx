'use client';

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
import { Badge } from '@/components/ui/badge';
import { categories } from '@/lib/data';
import { PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AddVideoDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function AddVideoDialog({ isOpen, onOpenChange }: AddVideoDialogProps) {
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: 'Video Kaydedildi! ✨',
      description: 'Videonuz koleksiyonunuza eklendi.',
    });
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
            <Input id="video-url" placeholder="https://www.instagram.com/reels/..." />
          </div>
          <div className="space-y-2">
            <Label>Kategori seç</Label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Button key={cat.id} variant="outline" size="sm">
                  {cat.emoji} {cat.name}
                </Button>
              ))}
              <Button variant="outline" size="sm">
                <PlusCircle className="mr-2 h-4 w-4" /> Yeni Kategori
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Not ekle (opsiyonel)</Label>
            <Textarea id="notes" placeholder="Bu videoyla ilgili notlarınız..." />
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

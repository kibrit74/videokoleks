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
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface NewCategoryDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const emojis = ['😂', '🍕', '💪', '💡', '📚', '🎨', '✈️', '🎬', '🎮'];
const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-blue-500', 'bg-purple-500'];

export function NewCategoryDialog({ isOpen, onOpenChange }: NewCategoryDialogProps) {
  const { toast } = useToast();

  const handleCreate = () => {
    toast({
      title: 'Kategori Oluşturuldu! 🎉',
      description: 'Yeni kategoriniz başarıyla eklendi.',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Yeni Kategori</DialogTitle>
          <DialogDescription>
            Koleksiyonunuzu düzenlemek için yeni bir kategori oluşturun.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label>Emoji seç</Label>
            <div className="flex flex-wrap gap-2">
              {emojis.map((emoji) => (
                <Button key={emoji} variant="outline" size="icon" className="text-xl">
                  {emoji}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="category-name">Kategori Adı</Label>
            <Input id="category-name" placeholder="Örn: Dans Videoları" />
          </div>
          <div className="space-y-2">
            <Label>Renk</Label>
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => (
                <Button key={color} variant="outline" size="icon" className="p-0">
                  <div className={`w-6 h-6 rounded-full ${color}`} />
                </Button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>İptal</Button>
          <Button onClick={handleCreate}>Oluştur</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

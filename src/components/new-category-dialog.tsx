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
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import type { Category } from '@/lib/types';
import { cn } from '@/lib/utils';

interface NewCategoryDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const emojis = ['😂', '🍕', '💪', '💡', '📚', '🎨', '✈️', '🎬', '🎮', '🎉', '💰'];
const colors = [
  'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 
  'bg-teal-500', 'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500'
];

// Helper to convert bg-color-500 to ring-color-500
const toRingColor = (bgColor: string) => bgColor.replace('bg-', 'ring-');

export function NewCategoryDialog({ isOpen, onOpenChange }: NewCategoryDialogProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const [name, setName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(emojis[0]);
  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (!user || !firestore) {
        toast({ variant: "destructive", title: "Giriş yapmalısınız." });
        return;
    }
    if (!name.trim()) {
        toast({ variant: "destructive", title: "Kategori adı boş olamaz." });
        return;
    }

    setIsLoading(true);

    const categoryData: Omit<Category, 'id'> = {
        userId: user.uid,
        name: name.trim(),
        emoji: selectedEmoji,
        color: selectedColor
    };
    
    const categoriesCollection = collection(firestore, 'users', user.uid, 'categories');

    addDocumentNonBlocking(categoriesCollection, categoryData);

    toast({
        title: 'Kategori Oluşturuldu! 🎉',
        description: 'Yeni kategoriniz başarıyla eklendi.',
    });
    
    setIsLoading(false);
    onOpenChange(false);
    // Reset form
    setName('');
    setSelectedEmoji(emojis[0]);
    setSelectedColor(colors[0]);
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
            <Label htmlFor="category-name">Kategori Adı</Label>
            <Input 
                id="category-name" 
                placeholder="Örn: Dans Videoları" 
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Emoji seç</Label>
            <div className="flex flex-wrap gap-2">
              {emojis.map((emoji) => (
                <Button 
                    key={emoji} 
                    variant={selectedEmoji === emoji ? 'secondary' : 'outline'} 
                    size="icon" 
                    className="text-xl"
                    onClick={() => setSelectedEmoji(emoji)}
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Renk Seç</Label>
            <div className="flex flex-wrap gap-3">
              {colors.map((color) => (
                <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={cn(
                        'w-8 h-8 rounded-full transition-transform hover:scale-110 focus:outline-none',
                        color,
                        selectedColor === color && `ring-2 ring-offset-2 ring-offset-background ${toRingColor(color)}`
                    )}
                    aria-label={`Select ${color} color`}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>İptal</Button>
          <Button onClick={handleCreate} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
            Oluştur
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

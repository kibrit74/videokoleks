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
import { useUser, useFirestore } from '@/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { Loader2, Lock } from 'lucide-react';
import type { Category } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Switch } from './ui/switch';


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
  const [isLocked, setIsLocked] = useState(false);
  const [pin, setPin] = useState('');

  const handleCreate = async () => {
    if (!user || !firestore) {
        toast({ variant: "destructive", title: "Giriş yapmalısınız." });
        return;
    }
    if (!name.trim()) {
        toast({ variant: "destructive", title: "Kategori adı boş olamaz." });
        return;
    }
    if (isLocked && (pin.length !== 4 || !/^\d{4}$/.test(pin))) {
        toast({ variant: "destructive", title: "Geçersiz PIN", description: "PIN 4 haneli bir sayı olmalıdır." });
        return;
    }

    setIsLoading(true);

    const newCategoryRef = doc(collection(firestore, 'users', user.uid, 'categories'));

    const categoryData = {
        name: name.trim(),
        emoji: selectedEmoji,
        color: selectedColor,
        isLocked,
        pin: isLocked ? pin : null,
    };
    
    try {
        await setDoc(newCategoryRef, { ...categoryData, id: newCategoryRef.id });
        toast({
            title: 'Kategori Oluşturuldu! 🎉',
            description: 'Yeni kategoriniz başarıyla eklendi.',
        });
        
        onOpenChange(false);
        // Reset form
        setName('');
        setSelectedEmoji(emojis[0]);
        setSelectedColor(colors[0]);
        setIsLocked(false);
        setPin('');

    } catch (serverError) {
        const permissionError = new FirestorePermissionError({
            path: newCategoryRef.path,
            operation: 'create',
            requestResourceData: { ...categoryData, id: newCategoryRef.id },
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({
            variant: "destructive",
            title: "Oluşturulamadı",
            description: "Kategori oluşturulurken bir hata oluştu. Lütfen izinlerinizi kontrol edin."
        });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] grid-rows-[auto,1fr,auto] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Yeni Kategori</DialogTitle>
          <DialogDescription>
            Koleksiyonunuzu düzenlemek için yeni bir kategori oluşturun.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className='-mr-6 pr-6'>
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

            <div className="space-y-4">
                <div className="flex items-center space-x-2">
                    <Switch id="lock-category" checked={isLocked} onCheckedChange={setIsLocked}/>
                    <Label htmlFor="lock-category" className='flex items-center'><Lock className='w-4 h-4 mr-2 text-muted-foreground'/> Kategoriyi Kilitle</Label>
                </div>
                {isLocked && (
                    <div className='space-y-2 animate-in fade-in'>
                        <Label htmlFor='pin-code'>4 Haneli PIN Kodu</Label>
                        <Input 
                            id="pin-code"
                            type="password"
                            inputMode='numeric'
                            maxLength={4}
                            placeholder='****'
                            value={pin}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (/^\d*$/.test(value) && value.length <= 4) {
                                    setPin(value);
                                }
                            }}
                        />
                        <p className="text-xs text-muted-foreground">Bu kategoriye erişmek için bu PIN kodunu kullanacaksınız.</p>
                    </div>
                )}
            </div>

          </div>
        </ScrollArea>
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

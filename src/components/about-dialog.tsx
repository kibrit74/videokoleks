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
import { Package } from 'lucide-react';

interface AboutDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function AboutDialog({ isOpen, onOpenChange }: AboutDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center">
          <div className="rounded-full bg-primary/10 p-4 mb-4 inline-block">
            <Package className="h-10 w-10 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-headline">VideoKoleks</DialogTitle>
          <DialogDescription className="text-center">
            İlham veren, eğlendiren veya öğrenmenizi sağlayan tüm videoları tek bir yerde toplayın, düzenleyin ve kolayca erişin.
          </DialogDescription>
        </DialogHeader>
        <div className="text-center text-xs text-muted-foreground mt-4">
          Versiyon 1.0.0
        </div>
        <DialogFooter className="mt-4">
          <Button onClick={() => onOpenChange(false)} className="w-full">
            Kapat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

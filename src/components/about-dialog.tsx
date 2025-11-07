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
import { Separator } from '@/components/ui/separator';
import { Package, Link as LinkIcon, List, Star, Mail } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

interface AboutDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const features = [
    {
        icon: LinkIcon,
        title: "Tüm Platformlar Tek Yerde",
        description: "YouTube, Instagram, TikTok ve Facebook'tan videoları kolayca kaydedin."
    },
    {
        icon: List,
        title: "Akıllı Kategorizasyon",
        description: "Videolarınızı özel kategoriler, emojiler ve renklerle düzenleyin."
    },
    {
        icon: Star,
        title: "Favorilerinize Hızlı Erişim",
        description: "En önemli videolarınızı favorilerinize ekleyerek anında bulun."
    }
]

export function AboutDialog({ isOpen, onOpenChange }: AboutDialogProps) {
  const handleFeedbackClick = () => {
    window.location.href = 'mailto:destek@videokoleks.com';
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md grid-rows-[auto,1fr,auto] max-h-[90vh]">
        <DialogHeader className="items-center text-center space-y-4">
          <div className="rounded-full bg-primary/10 p-4 inline-block">
            <Package className="h-10 w-10 text-primary" />
          </div>
          <div>
            <DialogTitle className="text-2xl font-headline">VideoKoleks</DialogTitle>
            <DialogDescription className="text-center mt-1">
                İlham veren, eğlendiren veya öğrenmenizi sağlayan tüm videoları tek bir yerde toplayın, düzenleyin ve kolayca erişin.
            </DialogDescription>
          </div>
        </DialogHeader>

        <ScrollArea className="pr-6 -mr-6">
          <div className='py-4'>
            <Separator className="my-4" />

            <div className="space-y-4">
                <h3 className="font-semibold text-center">Ana Özellikler</h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                    {features.map((feature) => (
                        <li key={feature.title} className="flex items-start gap-3">
                            <feature.icon className="w-5 h-5 mt-0.5 text-primary shrink-0" />
                            <div>
                              <span className="font-semibold text-foreground">{feature.title}:</span> {feature.description}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
            
            <Separator className="my-4" />

            <div className="text-center text-xs text-muted-foreground">
              Versiyon 1.0.0
            </div>
          </div>
        </ScrollArea>
        
        <DialogFooter className="mt-4 gap-2 sm:gap-0">
           <Button variant="ghost" onClick={handleFeedbackClick} className="w-full">
            <Mail className="mr-2" /> Geri Bildirim Gönder
          </Button>
          <Button onClick={() => onOpenChange(false)} className="w-full">
            Kapat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useEffect, useState, useRef } from 'react';
import type { Category } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Lock, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

export default function LockedCategoryPage() {
  const params = useParams();
  const categoryId = params.categoryId as string;
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [pin, setPin] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const categoryDocRef = useMemoFirebase(
    () => (user?.uid && firestore && categoryId) ? doc(firestore, 'users', user.uid, 'categories', categoryId) : null,
    [firestore, user?.uid, categoryId]
  );
  const { data: category, isLoading } = useDoc<Category>(categoryDocRef);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (category && !category.isLocked) {
      router.replace(`/?categoryId=${categoryId}`);
    }
  }, [category, categoryId, router]);

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 1) {
      const newPin = pin.split('');
      newPin[index] = value;
      setPin(newPin.join(''));

      // Move focus to next input
      if (value && index < 3) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) {
        toast({ variant: 'destructive', title: 'PIN eksik', description: 'Lütfen 4 haneli PIN kodunu girin.' });
        return;
    }
    if (!category) return;
    
    setIsVerifying(true);
    setTimeout(() => { // Simulate network delay
        if (pin === category.pin) {
            toast({ title: 'Kilit Açıldı!', description: `"${category.name}" kategorisine hoş geldiniz.` });
            
            // Store unlock status in session storage
            const unlocked = JSON.parse(sessionStorage.getItem('unlocked_categories') || '{}');
            unlocked[categoryId] = true;
            sessionStorage.setItem('unlocked_categories', JSON.stringify(unlocked));

            router.push(`/?categoryId=${categoryId}`);
        } else {
            toast({ variant: 'destructive', title: 'Yanlış PIN!', description: 'Girdiğiniz PIN kodu hatalı.' });
            setPin('');
            inputRefs.current[0]?.focus();
        }
        setIsVerifying(false);
    }, 500);
  };

  if (isLoading || !category) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
            <Skeleton className="w-16 h-16 rounded-full" />
            <Skeleton className="h-8 w-48 mt-4" />
            <Skeleton className="h-5 w-64 mt-2" />
            <div className="flex gap-4 mt-8">
                <Skeleton className="w-14 h-16 rounded-md" />
                <Skeleton className="w-14 h-16 rounded-md" />
                <Skeleton className="w-14 h-16 rounded-md" />
                <Skeleton className="w-14 h-16 rounded-md" />
            </div>
            <Skeleton className="h-12 w-32 mt-8 rounded-md" />
        </div>
    )
  }

  return (
    <div className={cn("min-h-screen flex flex-col items-center justify-center text-center p-4", category.color)}>
        <div className="absolute top-4 left-4">
            <Button asChild variant="ghost" size="icon" className="bg-black/20 text-white rounded-full">
                <Link href="/categories"><ArrowLeft/></Link>
            </Button>
        </div>
      <div className="bg-background/80 backdrop-blur-sm p-8 rounded-2xl shadow-2xl max-w-sm w-full">
        <div className="mb-6">
            <span className={cn("text-5xl p-4 rounded-xl inline-block", category.color)}>
                {category.emoji}
            </span>
        </div>
        <h1 className="text-2xl font-bold font-headline">{category.name}</h1>
        <p className="text-muted-foreground mb-8">Bu kategori kilitli. Lütfen devam etmek için PIN kodunu girin.</p>
        
        <form onSubmit={handleSubmit}>
            <div className="flex justify-center gap-2 md:gap-4 mb-8">
                {Array.from({ length: 4 }).map((_, index) => (
                    <Input
                        key={index}
                        ref={el => inputRefs.current[index] = el}
                        type="password"
                        inputMode='numeric'
                        value={pin[index] || ''}
                        onChange={(e) => handlePinChange(e, index)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        maxLength={1}
                        className="w-14 h-16 text-3xl text-center font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        disabled={isVerifying}
                    />
                ))}
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={isVerifying || pin.length !== 4}>
                {isVerifying ? <Loader2 className="animate-spin"/> : <><Lock className="mr-2"/> Kilidi Aç</>}
            </Button>
        </form>
      </div>
    </div>
  );
}

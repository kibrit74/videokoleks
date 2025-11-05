'use client';

import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';


export default function LoginPage() {
    const { user, isUserLoading: loading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            router.push('/profile');
        }
    }, [user, loading, router]);

    if (loading || user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-headline">Giriş Yap</CardTitle>
                    <CardDescription>Bu uygulama anonim giriş kullanmaktadır. Lütfen ana sayfaya dönün.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                    <Button onClick={() => router.push('/')} size="lg" className="w-full">
                        Ana Sayfaya Dön
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}

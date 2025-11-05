'use client';

import { useRouter } from 'next/navigation';
import { useUser, signInWithGoogle } from '@/firebase/auth/use-user';
import { useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import Link from 'next/link';


export default function RegisterPage() {
    const { user, isUserLoading: loading } = useUser();
    const auth = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            router.push('/profile');
        }
    }, [user, loading, router]);

    const handleGoogleSignIn = async () => {
        if (!auth) return;
        try {
            await signInWithGoogle(auth);
            // The onAuthStateChanged listener in useUser will handle the redirect
        } catch (error) {
            console.error("Google Sign-In failed", error);
            // Optionally, show a toast message to the user
        }
    };

    if (loading || user) {
        return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-headline">Hesap Oluştur</CardTitle>
                    <CardDescription>Başlamak için Google hesabınızı kullanın.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                     <Button onClick={handleGoogleSignIn} size="lg" className="w-full">
                        <FcGoogle className="mr-2 h-5 w-5" /> Google ile Kaydol
                    </Button>
                    <p className="text-xs text-muted-foreground">
                        Zaten bir hesabın var mı?{' '}
                        <Link href="/login" className="underline hover:text-primary">
                            Giriş yap
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}

'use client';

import { useRouter } from 'next/navigation';
import { useUser, signInWithGoogle } from '@/firebase/auth/use-user';
import { useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
    const { user, isUserLoading: loading } = useUser();
    const auth = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [isSigningIn, setIsSigningIn] = useState(false);

    useEffect(() => {
        if (!loading && user) {
            router.push('/profile');
        }
    }, [user, loading, router]);

    const handleGoogleSignIn = async () => {
        if (!auth) return;
        setIsSigningIn(true);
        try {
            await signInWithGoogle(auth);
            toast({ title: 'Giriş başarılı!' });
            // The onAuthStateChanged listener in useUser will handle the redirect
        } catch (error: any) {
            console.error("Sign-In with Google failed", error);
            let description = 'Giriş yapılırken bir hata oluştu.';
            if (error.code === 'auth/popup-closed-by-user') {
                description = 'Giriş penceresi kapatıldı.';
            }
            toast({ variant: 'destructive', title: 'Giriş Başarısız', description });
        } finally {
            setIsSigningIn(false);
        }
    };

    const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.658-3.301-11.28-7.94l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.447-2.275,4.485-4.128,6.034l6.19,5.238C39.921,35.631,44,29.133,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
        </svg>
    );

    if (loading || user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-headline">Giriş Yap</CardTitle>
                    <CardDescription>Devam etmek için hesabınıza giriş yapın.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <Button onClick={handleGoogleSignIn} disabled={isSigningIn} className="w-full mt-2" size="lg" variant="outline">
                        {isSigningIn ? <Loader2 className="animate-spin" /> : <><GoogleIcon className="mr-2" /> Google ile Giriş Yap</>}
                    </Button>
                     <p className="text-center text-sm text-muted-foreground mt-4">
                        Hesabın yok mu?{' '}
                        <Link href="/register" className="underline hover:text-primary">
                            Hemen oluştur
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}

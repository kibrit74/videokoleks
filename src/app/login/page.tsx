'use client';

import { useRouter } from 'next/navigation';
import { useUser, signInWithEmail } from '@/firebase/auth/use-user';
import { useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';


export default function LoginPage() {
    const { user, isUserLoading: loading } = useUser();
    const auth = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSigningIn, setIsSigningIn] = useState(false);

    useEffect(() => {
        if (!loading && user) {
            router.push('/profile');
        }
    }, [user, loading, router]);

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth) return;
        if (!email || !password) {
            toast({ variant: 'destructive', title: 'Eksik Bilgi', description: 'Lütfen e-posta ve şifrenizi girin.' });
            return;
        }

        setIsSigningIn(true);
        try {
            await signInWithEmail(auth, email, password);
            toast({ title: 'Giriş başarılı!' });
            // The onAuthStateChanged listener in useUser will handle the redirect
        } catch (error: any) {
            console.error("Sign-In failed", error);
            let description = 'Giriş yapılırken bir hata oluştu. Lütfen bilgilerinizi kontrol edin.';
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                description = 'E-posta veya şifre hatalı.';
            }
            toast({ variant: 'destructive', title: 'Giriş Başarısız', description });
        } finally {
            setIsSigningIn(false);
        }
    };

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
                <CardContent>
                    <form onSubmit={handleSignIn} className="flex flex-col gap-4">
                        <div className="space-y-2">
                           <Label htmlFor="email">E-posta</Label>
                           <Input 
                             id="email" 
                             type="email" 
                             placeholder="ornek@eposta.com" 
                             value={email}
                             onChange={(e) => setEmail(e.target.value)}
                             required 
                           />
                        </div>
                         <div className="space-y-2">
                           <Label htmlFor="password">Şifre</Label>
                           <Input 
                             id="password" 
                             type="password" 
                             placeholder="••••••••" 
                             value={password}
                             onChange={(e) => setPassword(e.target.value)}
                             required 
                           />
                        </div>
                        <Button type="submit" disabled={isSigningIn} className="w-full mt-2">
                            {isSigningIn ? <Loader2 className="animate-spin" /> : 'Giriş Yap'}
                        </Button>
                    </form>
                     <p className="text-center text-sm text-muted-foreground mt-6">
                        Hesabın yok mu?{' '}
                        <Link href="/register" className="underline hover:text-primary">
                            Hesap oluştur
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}

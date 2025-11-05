'use client';

import { useRouter } from 'next/navigation';
import { useUser, signInWithEmail } from '@/firebase/auth/use-user';
import { useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
    const { user, isUserLoading: loading } = useUser();
    const auth = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [isSigningIn, setIsSigningIn] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        if (!loading && user) {
            router.push('/profile');
        }
    }, [user, loading, router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth) return;
        setIsSigningIn(true);
        try {
            await signInWithEmail(auth, email, password);
            toast({ title: 'Giriş başarılı!' });
            // onAuthStateChanged in useUser will handle the redirect
        } catch (error: any) {
            console.error("Sign-In failed", error);
            let description = 'Giriş yapılırken bir hata oluştu. Lütfen bilgilerinizi kontrol edin.';
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                description = 'E-posta veya şifre hatalı.';
            } else if (error.code === 'auth/invalid-email') {
                description = 'Geçersiz e-posta adresi formatı.';
            }
             else if (error.code === 'auth/too-many-requests') {
                description = 'Çok fazla başarısız deneme. Lütfen daha sonra tekrar deneyin.';
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
                    <form onSubmit={handleLogin} className="flex flex-col gap-4">
                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="email">E-posta</Label>
                            <Input
                                type="email"
                                id="email"
                                placeholder="ornek@mail.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isSigningIn}
                            />
                        </div>
                         <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="password">Şifre</Label>
                            <Input
                                type="password"
                                id="password"
                                placeholder="Şifreniz"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                disabled={isSigningIn}
                            />
                        </div>
                        <Button type="submit" disabled={isSigningIn} className="w-full mt-2" size="lg">
                            {isSigningIn ? <Loader2 className="animate-spin" /> : 'Giriş Yap'}
                        </Button>
                    </form>
                     <p className="text-center text-sm text-muted-foreground mt-6">
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

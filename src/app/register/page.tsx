'use client';

import { useRouter } from 'next/navigation';
import { useUser, useAuth } from '@/firebase';
import { signUpWithEmail, updateUserProfile } from '@/firebase/auth/use-user';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function RegisterPage() {
    const { user, isUserLoading: loading } = useUser();
    const auth = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [isSigningUp, setIsSigningUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');

    useEffect(() => {
        if (!loading && user) {
            router.push('/profile');
        }
    }, [user, loading, router]);

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth) return;
        setIsSigningUp(true);
        try {
            const userCredential = await signUpWithEmail(auth, email, password);
            // Set display name after successful creation
            await updateUserProfile(userCredential.user, { displayName });
            toast({ title: 'Hesap oluşturuldu ve giriş yapıldı!' });
            // onAuthStateChanged in useUser will handle the redirect
        } catch (error: any) {
            console.error("Sign-Up failed", error);
            let description = 'Kayıt sırasında bir hata oluştu.';
            if (error.code === 'auth/email-already-in-use') {
                description = 'Bu e-posta adresi zaten kullanılıyor.';
            } else if (error.code === 'auth/invalid-email') {
                description = 'Geçersiz e-posta adresi formatı.';
            } else if (error.code === 'auth/weak-password') {
                description = 'Şifreniz çok zayıf. En az 6 karakter olmalı.';
            }
            toast({ variant: 'destructive', title: 'Kayıt Başarısız', description });
        } finally {
            setIsSigningUp(false);
        }
    };

    if (loading || user) {
        return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-headline">Hesap Oluştur</CardTitle>
                    <CardDescription>Başlamak için bir hesap oluşturun.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSignUp} className="flex flex-col gap-4">
                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="displayName">Görünen İsim</Label>
                            <Input
                                type="text"
                                id="displayName"
                                placeholder="Adınız"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                required
                                disabled={isSigningUp}
                            />
                        </div>
                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="email">E-posta</Label>
                            <Input
                                type="email"
                                id="email"
                                placeholder="ornek@mail.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isSigningUp}
                            />
                        </div>
                         <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="password">Şifre (en az 6 karakter)</Label>
                            <Input
                                type="password"
                                id="password"
                                placeholder="Şifreniz"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                disabled={isSigningUp}
                            />
                        </div>
                        <Button type="submit" disabled={isSigningUp} className="w-full mt-2" size="lg">
                            {isSigningUp ? <Loader2 className="animate-spin" /> : 'Hesap Oluştur'}
                        </Button>
                    </form>
                    <p className="text-center text-sm text-muted-foreground mt-6">
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

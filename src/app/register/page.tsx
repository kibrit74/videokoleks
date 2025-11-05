'use client';

import { useRouter } from 'next/navigation';
import { useUser, createUserWithEmail } from '@/firebase/auth/use-user';
import { useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';


export default function RegisterPage() {
    const { user, isUserLoading: loading } = useUser();
    const auth = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSigningUp, setIsSigningUp] = useState(false);

    useEffect(() => {
        if (!loading && user) {
            router.push('/profile');
        }
    }, [user, loading, router]);

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth) return;
        if (password.length < 6) {
            toast({ variant: 'destructive', title: 'Zayıf Şifre', description: 'Şifreniz en az 6 karakter olmalıdır.' });
            return;
        }

        setIsSigningUp(true);
        try {
            await createUserWithEmail(auth, email, password);
            toast({ title: 'Hesap oluşturuldu!', description: 'Başarıyla kaydoldunuz.' });
            // The onAuthStateChanged listener in useUser will handle the redirect
        } catch (error: any) {
            console.error("Sign-Up failed", error);
            let description = 'Kayıt olurken bir hata oluştu.';
            if (error.code === 'auth/email-already-in-use') {
                description = 'Bu e-posta adresi zaten kullanılıyor.';
            } else if (error.code === 'auth/invalid-email') {
                description = 'Lütfen geçerli bir e-posta adresi girin.';
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
                             placeholder="En az 6 karakter"
                             value={password}
                             onChange={(e) => setPassword(e.target.value)}
                             required 
                           />
                        </div>
                        <Button type="submit" disabled={isSigningUp} className="w-full mt-2">
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

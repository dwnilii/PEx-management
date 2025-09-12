
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, Loader2, ShieldQuestion } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { saveCredentials } from './actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

export default function SetupPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingStatus, setIsCheckingStatus] = useState(true);
    
    useEffect(() => {
      async function checkStatus() {
        try {
          const response = await fetch('/api/setup/status');
          const data = await response.json();
          if (data.isSetupComplete) {
            router.replace('/login');
          } else {
            setIsCheckingStatus(false);
          }
        } catch (error) {
          console.error("Failed to check setup status:", error);
          setIsCheckingStatus(false); // Allow setup even if check fails
        }
      }
      checkStatus();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const englishRegex = /^[A-Za-z0-9_@.\-!#$%^&*()+=~`[\]{}|:;"'<>,?/]*$/;
        if (!englishRegex.test(username) || !englishRegex.test(password)) {
             toast({
                variant: 'destructive',
                title: 'Invalid Characters',
                description: 'Please use the English keyboard for username and password.',
            });
            return;
        }

        if (password !== confirmPassword) {
            toast({
                variant: 'destructive',
                title: 'Passwords do not match',
                description: 'Please ensure both password fields are identical.',
            });
            return;
        }

        setIsLoading(true);

        try {
            const result = await saveCredentials(username, password);

            if (result && result.error) {
                throw new Error(result.error);
            }
            
            toast({
                title: 'Success!',
                description: 'Credentials saved. Redirecting to login page...',
            });

            // Redirect to login page after a short delay
            setTimeout(() => {
                router.push('/login');
            }, 1500);
            
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Setup Failed',
                description: error.message || 'Could not save credentials. See server logs for details.',
            });
            setIsLoading(false);
        }
    };
    
    if (isCheckingStatus) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background p-4">
                <Card className="mx-auto w-full max-w-sm">
                    <CardHeader>
                        <Skeleton className="h-8 w-8 mx-auto" />
                        <Skeleton className="h-6 w-3/4 mx-auto" />
                        <Skeleton className="h-4 w-1/2 mx-auto" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="mx-auto w-full max-w-sm">
                <CardHeader className="text-center">
                    <div className="mb-4 flex items-center justify-center">
                        <KeyRound className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Initial Setup</CardTitle>
                    <CardDescription>
                        Create your administrator account to get started.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div className="space-y-2">
                            <Label htmlFor="username">Admin Username</Label>
                            <Input 
                                id="username" 
                                type="text" 
                                placeholder="e.g., admin" 
                                required 
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input 
                                id="password" 
                                type="password" 
                                required 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirm Password</Label>
                            <Input 
                                id="confirm-password" 
                                type="password" 
                                required 
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                        <Alert>
                            <ShieldQuestion className="h-4 w-4" />
                            <AlertTitle>Where is this saved?</AlertTitle>
                            <AlertDescription>
                                These credentials will be saved to a <strong>.env</strong> file in your project's root directory on the server.
                            </AlertDescription>
                        </Alert>
                        <div className="pt-2">
                           <Button type="submit" className="w-full" disabled={isLoading}>
                             {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save and Continue'}
                           </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

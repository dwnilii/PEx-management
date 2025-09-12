
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, Loader2, Save, Wand2, FileText, AlignLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateCredentials } from './actions';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SettingPage() {
    const router = useRouter();
    const [allSettings, setAllSettings] = useState<any>({});
    const [currentUsername, setCurrentUsername] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch('/api/settings');
                if (response.ok) {
                    const settings = await response.json();
                    setAllSettings(settings || {});
                } else {
                    setAllSettings({});
                }
            } catch (error) {
                console.error("Failed to fetch settings:", error);
                setAllSettings({});
            }
        };
        fetchSettings();
    }, []);

    const handleSettingChange = (key: string, value: any) => {
        setAllSettings((prev: any) => ({
            ...prev,
            [key]: value
        }));
    };

    const handleSaveChanges = async () => {
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(allSettings)
            });
            const result = await response.json();
            if (!response.ok) {
                 throw new Error(result.error || 'Failed to save settings.');
            }
            toast({ title: 'Success!', description: result.message || 'Settings have been saved successfully.' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleCredentialChange = async () => {
        setIsSaving(true);
        try {
            if (newPassword !== confirmPassword) {
                throw new Error('New password and confirmation password do not match.');
            }
             if (!currentUsername || !currentPassword || !newUsername || !newPassword) {
                throw new Error('All credential fields are required.');
            }

            const result = await updateCredentials({ currentUsername, currentPassword, newUsername, newPassword });
            
            if (result && result.error) {
                throw new Error(result.error);
            }

            toast({ title: 'Success!', description: result.message });

            // Log the user out after changing password
            setTimeout(() => {
                sessionStorage.removeItem('isLoggedIn');
                router.replace('/login');
            }, 2000);

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
             setIsSaving(false);
        }
    }


  return (
    <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Global Settings</CardTitle>
            <CardDescription>Manage global settings for the application and extensions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 border rounded-lg space-y-4">
                 <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Extension Guide Content</h3>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="guide-content">Guide Content (HTML supported)</Label>
                    <Textarea
                        id="guide-content"
                        value={allSettings.guideContent || ''}
                        onChange={(e) => handleSettingChange('guideContent', e.target.value)}
                        placeholder="Enter the guide content for your users..."
                        rows={6}
                    />
                </div>
                 <div className="space-y-2">
                    <Label>Text Alignment</Label>
                     <Select 
                        value={allSettings.guideContentAlignment || 'ltr'} 
                        onValueChange={(value) => handleSettingChange('guideContentAlignment', value)}
                      >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select alignment" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ltr">Left-to-Right (LTR)</SelectItem>
                            <SelectItem value="rtl">Right-to-Left (RTL)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

             <div className="p-4 border rounded-lg space-y-4">
                 <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Security</h3>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                        <span className="text-sm font-medium text-primary">{allSettings.sessionTimeoutMinutes || 15} min</span>
                    </div>
                    <Slider
                        id="session-timeout"
                        min={5}
                        max={120}
                        step={5}
                        value={[allSettings.sessionTimeoutMinutes || 15]}
                        onValueChange={(value) => handleSettingChange('sessionTimeoutMinutes', value[0])}
                    />
                    <p className="text-sm text-muted-foreground">
                        Users will be automatically logged out after this period of inactivity. Default is 15 minutes.
                    </p>
                </div>
            </div>
          </CardContent>
           <CardFooter className="border-t px-6 py-4">
                <Button onClick={handleSaveChanges} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {isSubmitting ? 'Saving...' : 'Save All Settings'}
                </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Admin Credentials</CardTitle>
            <CardDescription>Update the login credentials for the management panel.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <Alert variant="destructive">
              <Shield className="h-4 w-4" />
              <AlertTitle>Security Note</AlertTitle>
              <AlertDescription>
                After successfully changing your credentials, you will be automatically logged out and need to sign in again.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
                <Label htmlFor="current-username">Current Username</Label>
                <Input id="current-username" value={currentUsername} onChange={(e) => setCurrentUsername(e.target.value)} />
            </div>
             <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            </div>
            <hr className="my-6" />
            <div className="space-y-2">
                <Label htmlFor="new-username">New Username</Label>
                <Input id="new-username" placeholder="Enter new username" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
             <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button onClick={handleCredentialChange} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isSaving ? 'Saving...' : 'Save Credentials'}
            </Button>
          </CardFooter>
        </Card>

    </div>
  );
}

    

    
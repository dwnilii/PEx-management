
'use client';

import { useState, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Server, Save, Download, Building, Loader2, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { ExtensionPreview } from '@/components/extension-preview';

const defaultIconPath = '/extension-templates/icons/icon128.png';


export default function ExtensionPage() {
  const [centralPanelAddress, setCentralPanelAddress] = useState('');
  const [isAddressEditable, setIsAddressEditable] = useState(false);
  
  const [isBuilding, setIsBuilding] = useState(false);
  
  const [allSettings, setAllSettings] = useState<any>({ 
      idPrefix: 'USR-EXP-', 
      idDigits: 4, 
      extensionName: 'PEx Extension', 
      companyLogo: null
  });
  const [isSettingsSubmitting, setIsSettingsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const { toast } = useToast();

  useEffect(() => {
    // Set address from localStorage or window.location
    if (typeof window !== 'undefined') {
        setCentralPanelAddress(localStorage.getItem('pex-panel-address') || window.location.origin);
    }
    
    fetchSettings();

  }, []);
  
    const fetchSettings = async () => {
        try {
            const response = await fetch('/api/settings');
            if (response.ok) {
                const settings = await response.json();
                // Merge settings, ensuring defaults are present
                setAllSettings(prev => ({
                    idPrefix: 'USR-EXP-',
                    idDigits: 4,
                    extensionName: 'PEx Extension',
                    ...prev,
                    ...settings,
                    companyLogo: settings.companyLogo || null,
                }));
            }
        } catch (error) {
            console.error("Failed to fetch settings:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load global settings.' });
        }
    };


  const handleSaveAddress = () => {
    localStorage.setItem('pex-panel-address', centralPanelAddress);
    toast({
        title: "Address Saved",
        description: "The panel address has been updated locally."
    });
    setIsAddressEditable(false);
  }
  
  
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/') && file.size < 1 * 1024 * 1024) { // 1MB limit
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          handleSettingChange('companyLogo', dataUrl);
        };
        reader.readAsDataURL(file);
      } else {
        toast({ variant: 'destructive', title: "Invalid File", description: "Please upload an image file under 1MB." });
      }
    }
  };
  
    const handleDownloadExtension = async () => {
        setIsBuilding(true);
        try {
            const zip = new JSZip();

            // 1. Create manifest.json
            const manifest = {
                manifest_version: 3,
                name: allSettings.extensionName || 'PEx Extension',
                version: "1.0",
                description: "Chrome Extension for PEx Management",
                permissions: ["proxy", "storage", "alarms"],
                host_permissions: [`${centralPanelAddress}/*`],
                action: {
                    default_popup: "popup.html",
                    default_icon: {
                        "128": "icons/icon128.png"
                    }
                },
                background: {
                    service_worker: "background.js"
                },
                icons: {
                    "16": "icons/icon16.png",
                    "32": "icons/icon32.png",
                    "48": "icons/icon48.png",
                    "128": "icons/icon128.png",
                }
            };
            zip.file("manifest.json", JSON.stringify(manifest, null, 2));

            // 2. Add main extension logic files (background, popup.js)
            const backgroundJs = await fetch('/extension-templates/background.js').then(r => r.text());
            zip.file("background.js", backgroundJs);

            const popupJs = await fetch('/extension-templates/popup.js').then(r => r.text());
            zip.file("popup.js", popupJs);

            // 3. Add UI files (HTML, CSS)
            const popupHtml = await fetch('/extension-templates/popup.html').then(r => r.text());
            zip.file("popup.html", popupHtml);
            
            const stylesCss = await fetch('/extension-templates/styles.css').then(r => r.text());
            zip.file("styles.css", stylesCss);

            // 4. Handle and process icons
            const iconsFolder = zip.folder("icons");
            let logoBlob: Blob;

            if (allSettings.companyLogo) {
                const response = await fetch(allSettings.companyLogo);
                logoBlob = await response.blob();
            } else {
                const response = await fetch(defaultIconPath);
                logoBlob = await response.blob();
            }
            
            const image = await createImageBitmap(logoBlob);
            const sizes = [16, 32, 48, 128];

            for (const size of sizes) {
                const canvas = new OffscreenCanvas(size, size);
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(image, 0, 0, size, size);
                    const blob = await canvas.convertToBlob();
                    if (blob) {
                       iconsFolder?.file(`icon${size}.png`, blob);
                    }
                }
            }

            // Note: SVG icons are now embedded directly in popup.html
            // We don't need to package them separately anymore


            // 6. Generate and download zip
            const content = await zip.generateAsync({type: "blob"});
            saveAs(content, `PEx-Extension - ${allSettings.extensionName}.zip`);
            
            toast({
                title: "Success!",
                description: "Extension package has been generated successfully."
            });

        } catch (error: any) {
            console.error('Error generating extension:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: `Failed to generate extension package: ${error.message}`
            });
        } finally {
            setIsBuilding(false);
        }
    };
    
      const handleSettingChange = (key: string, value: any) => {
        setAllSettings((prev: any) => ({
            ...prev,
            [key]: value
        }));
    };

    const handleSaveSettings = async () => {
        setIsSettingsSubmitting(true);
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
            setIsSettingsSubmitting(false);
        }
    };



  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-start gap-4">
                        <div className="bg-primary/10 text-primary p-3 rounded-full">
                            <Server className="w-6 h-6" />
                        </div>
                        <div>
                            <CardTitle>Central Panel Address</CardTitle>
                            <CardDescription>
                                This is the core URL the extension will use to communicate with the panel.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Label htmlFor="server-address">Panel URL</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                id="server-address"
                                value={centralPanelAddress}
                                readOnly={!isAddressEditable}
                                onChange={(e) => setCentralPanelAddress(e.target.value)}
                                className={!isAddressEditable ? 'bg-muted/50 font-mono' : 'font-mono'}
                            />
                            {isAddressEditable ? (
                                <Button onClick={handleSaveAddress}>
                                    <Save className="h-4 w-4" />
                                    <span className="sr-only">Save</span>
                                </Button>
                            ) : (
                                <Button variant="outline" size="icon" onClick={() => setIsAddressEditable(true)}>
                                    <Save className="h-4 w-4" />
                                    <span className="sr-only">Edit</span>
                                </Button>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground pt-1">
                           The <strong>/api</strong> suffix will be appended automatically by the extension.
                        </p>
                    </div>
                </CardContent>
            </Card>
            
            <Card>
            <CardHeader>
                <div className="flex items-start gap-4">
                    <div className="bg-primary/10 text-primary p-3 rounded-full">
                        <Wand2 className="w-6 h-6" />
                    </div>
                    <div>
                        <CardTitle>User ID Generation</CardTitle>
                        <CardDescription>Define the pattern for generating unique user IDs in the extension.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="id-prefix">ID Prefix</Label>
                        <Input
                            id="id-prefix"
                            value={allSettings.idPrefix || 'USR-EXP-'}
                            onChange={(e) => handleSettingChange('idPrefix', e.target.value)}
                            className="font-mono"
                            placeholder="e.g., USR-EXP-"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="id-digits">Number of Random Characters</Label>
                        <Input
                            id="id-digits"
                            type="number"
                            value={allSettings.idDigits || 4}
                            onChange={(e) => handleSettingChange('idDigits', parseInt(e.target.value, 10))}
                            placeholder="e.g., 4"
                            min="3"
                            max="8"
                        />
                    </div>
                </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
                    <Button onClick={handleSaveSettings} disabled={isSettingsSubmitting}>
                        {isSettingsSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {isSettingsSubmitting ? 'Saving...' : 'Save ID Settings'}
                    </Button>
            </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-start gap-4">
                        <div className="bg-primary/10 text-primary p-3 rounded-full">
                            <Building className="w-6 h-6" />
                        </div>
                        <div>
                            <CardTitle>Branding</CardTitle>
                            <CardDescription>
                                Customize the extension's name and logo to match your company brand.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="extension-name">Extension Name</Label>
                        <Input id="extension-name" value={allSettings.extensionName} onChange={(e) => handleSettingChange('extensionName', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Extension Logo</Label>
                        <div className="flex items-center gap-4">
                            {allSettings.companyLogo && <Image src={allSettings.companyLogo} alt="Current Logo" width={48} height={48} className="rounded-md border p-1" unoptimized/>}
                            <Input type="file" ref={fileInputRef} onChange={handleLogoChange} accept="image/*" className="hidden" />
                            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                                Upload Logo
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground pt-1">
                            Recommended: 128x128px PNG file.
                        </p>
                    </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                    <Button onClick={handleSaveSettings} disabled={isSettingsSubmitting}>
                        {isSettingsSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {isSettingsSubmitting ? 'Saving...' : 'Save Branding'}
                    </Button>
                </CardFooter>
            </Card>
            
            <Card>
                <CardHeader>
                    <div className="flex items-start gap-4">
                        <div className="bg-primary/10 text-primary p-3 rounded-full">
                            <Download className="w-6 h-6" />
                        </div>
                        <div>
                            <CardTitle>Build & Download</CardTitle>
                            <CardDescription>
                                Generate and download the customized Chrome extension as a .zip file.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Button onClick={handleDownloadExtension} disabled={isBuilding}>
                        {isBuilding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        {isBuilding ? 'Building...' : 'Build & Download Extension'}
                    </Button>
                </CardContent>
            </Card>
        </div>
        <div className="space-y-6">
             <Card className="lg:sticky lg:top-20">
                <CardHeader>
                    <CardTitle>Live Extension Preview</CardTitle>
                    <CardDescription>
                        Interact with a preview of the extension before building it.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ExtensionPreview 
                        extensionName={allSettings.extensionName}
                        companyLogo={allSettings.companyLogo}
                    />
                </CardContent>
            </Card>
        </div>
    </div>
  );
}

    

    


'use client';

import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoreHorizontal, Users, Network, GitBranch, X, FileSpreadsheet, Pencil, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { UserTable } from '@/components/user-table';
import { useToast } from '@/hooks/use-toast';

const availableColors = [
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Teal', value: '#14b8a6' },
    { name: 'Yellow', value: '#eab308' },
    { name: 'Cyan', value: '#06b6d4' },
    { name: 'Lime', value: '#84cc16' },
    { name: 'Emerald', value: '#10b981' },
    { name: 'Sky', value: '#0ea5e9' },
    { name: 'Violet', value: '#8b5cf6' },
    { name: 'Fuchsia', value: '#d946ef' },
    { name: 'Rose', value: '#f43f5e' },
    { name: 'Amber', value: '#f59e0b' },
    { name: 'Stone', value: '#78716c' },
    { name: 'Slate', value: '#64748b' },
    { name: 'Gray', value: '#6b7280' },
];

export default function OUPage() {
  const [ous, setOUs] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [availableProxies, setAvailableProxies] = useState([]);
  const [availableRules, setAvailableRules] = useState([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingOU, setEditingOU] = useState<any>(null);
  const [ouData, setOUData] = useState({ name: '', description: '', color: '', proxy: '', routingRule: '' });
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [ouToDelete, setOuToDelete] = useState<any>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      const [ousRes, usersRes, proxiesRes, rulesRes] = await Promise.all([
        fetch('/api/ous'),
        fetch('/api/users'),
        fetch('/api/proxies'),
        fetch('/api/routing-rules')
      ]);
      if (!ousRes.ok || !usersRes.ok || !proxiesRes.ok || !rulesRes.ok) {
        throw new Error('Failed to fetch initial data.');
      }
      const ousData = await ousRes.json();
      const usersData = await usersRes.json();
      const proxiesData = await proxiesRes.json();
      const rulesData = await rulesRes.json();
      
      setOUs(ousData.map(ou => ({ ...ou, userCount: usersData.filter(u => u.ou === ou.name).length })));
      setAllUsers(usersData);
      setAvailableProxies(proxiesData.map(p => p.name));
      setAvailableRules(rulesData.map(r => r.name));

    } catch (error: any) {
      console.error("Failed to fetch data:", error);
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenEditDialog = (ou: any = null) => {
    setEditingOU(ou);
    setOUData(ou ? { ...ou } : { name: '', description: '', color: availableColors[0].value, proxy: '', routingRule: '' });
    setIsEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingOU(null);
  };

  const handleSave = async () => {
    const url = editingOU ? `/api/ous/${editingOU.id}` : '/api/ous';
    const method = editingOU ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ouData),
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Failed to save the OU.');
        }
        
        toast({ title: 'Success', description: result.message || `Organizational unit has been ${editingOU ? 'updated' : 'created'}.` });
        fetchData();
        handleCloseEditDialog();

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };
  
  const handleDeleteConfirm = async () => {
    if (!ouToDelete) return;

    try {
        const response = await fetch(`/api/ous/${ouToDelete.id}`, {
            method: 'DELETE',
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Failed to delete the OU.');
        }
        
        toast({ title: 'Success', description: result.message || `OU "${ouToDelete.name}" has been deleted.` });
        fetchData();
        setOuToDelete(null);
        setIsDeleteConfirmOpen(false);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };
  
  const handleOpenDeleteDialog = (ou: any) => {
    setOuToDelete(ou);
    setIsDeleteConfirmOpen(true);
  };

  const getUsersForOU = (ouName: string) => {
    return allUsers.filter((user: any) => user.ou === ouName);
  };

  const handleExportToExcel = (ouName: string) => {
    const usersToExport = getUsersForOU(ouName);
    const data = usersToExport.map((user: any) => ({
      'Name': user.name,
      'User ID': user.userId,
      'Organizational Unit': user.ou,
      'Last Known IP': user.ip,
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
    XLSX.writeFile(workbook, `OU_Users_${ouName.replace(/\s+/g, '_')}.xlsx`);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Organizational Units</h1>
          <p className="text-muted-foreground">Manage and monitor your OUs here.</p>
        </div>
        <Button onClick={() => handleOpenEditDialog()}>Add OU</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {ous.map((ou: any) => (
          <Dialog key={ou.id}>
            <Card className="flex flex-col transition-shadow hover:shadow-lg">
              <div 
                  className="h-2 w-full rounded-t-lg"
                  style={{ backgroundColor: ou.color }}
              ></div>
              <CardHeader className="flex-grow">
                <DialogTrigger asChild>
                  <div className="cursor-pointer">
                    <CardTitle>{ou.name}</CardTitle>
                    <CardDescription>{ou.description}</CardDescription>
                  </div>
                </DialogTrigger>
              </CardHeader>
              <CardContent className="flex-grow grid gap-4">
                  <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>Users</span>
                      </div>
                      <span className="font-semibold text-foreground">{ou.userCount}</span>
                  </div>
                   <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                          <Network className="h-4 w-4" />
                          <span>Assigned Proxy</span>
                      </div>
                      <Badge>{ou.proxy}</Badge>
                  </div>
                   <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                          <GitBranch className="h-4 w-4" />
                          <span>Routing Rule</span>
                      </div>
                      <Badge variant="outline">{ou.routingRule}</Badge>
                  </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                 <Button variant="outline" size="sm" onClick={() => handleOpenEditDialog(ou)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleOpenDeleteDialog(ou)}>
                     <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
              </CardFooter>
            </Card>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <div className="flex justify-between items-center pr-10">
                        <div>
                            <DialogTitle>Users in {ou.name}</DialogTitle>
                            <DialogDescription>
                                The following users are part of the "{ou.name}" organizational unit.
                            </DialogDescription>
                        </div>
                        <Button variant="outline" onClick={() => handleExportToExcel(ou.name)}>
                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                            Report
                        </Button>
                    </div>
                </DialogHeader>
                <div className="flex-grow overflow-auto -mx-6 px-6">
                    <UserTable users={getUsersForOU(ou.name)} showOuColumn={false} />
                </div>
            </DialogContent>
          </Dialog>
        ))}
      </div>
      
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Are you absolutely sure?</DialogTitle>
                <DialogDescription>
                This action cannot be undone. This will permanently delete the <strong>{ouToDelete?.name}</strong> organizational unit.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleDeleteConfirm} variant="destructive">Delete</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingOU ? 'Edit OU' : 'Add New OU'}</DialogTitle>
            <DialogDescription>
              {editingOU ? 'Update the details of the organizational unit.' : 'Fill in the details for the new organizational unit.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input id="name" value={ouData.name} onChange={(e) => setOUData({ ...ouData, name: e.target.value })} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">Description</Label>
              <Input id="description" value={ouData.description} onChange={(e) => setOUData({ ...ouData, description: e.target.value })} className="col-span-3" />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="color" className="text-right">Color</Label>
                 <Select 
                    value={ouData.color} 
                    onValueChange={(value) => setOUData({ ...ouData, color: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue>
                        <div className="flex items-center gap-2">
                           {ouData.color && <div className="w-4 h-4 rounded-full" style={{ backgroundColor: ouData.color }}></div>}
                           <span>{availableColors.find(c => c.value === ouData.color)?.name || 'Select a color'}</span>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        {availableColors.map(c => (
                            <SelectItem key={c.value} value={c.value}>
                               <div className="flex items-center gap-2">
                                 <div className="w-4 h-4 rounded-full" style={{ backgroundColor: c.value }}></div>
                                 <span>{c.name}</span>
                               </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="proxy" className="text-right">Proxy</Label>
                 <Select value={ouData.proxy} onValueChange={(value) => setOUData({ ...ouData, proxy: value })}>
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select a proxy" />
                    </SelectTrigger>
                    <SelectContent>
                        {availableProxies.map(p => (
                            <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="routingRule" className="text-right">Routing Rule</Label>
                 <Select value={ouData.routingRule} onValueChange={(value) => setOUData({ ...ouData, routingRule: value })}>
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select a rule" />
                    </SelectTrigger>
                    <SelectContent>
                        {availableRules.map(r => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

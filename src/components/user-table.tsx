
'use client';

import { useState, Dispatch, SetStateAction, Fragment, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreHorizontal, Power, PowerOff, X, PlusCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ouColors } from '@/app/dashboard/users/page';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from './ui/scroll-area';
import { useToast } from '@/hooks/use-toast';


interface User {
  id: string;
  name: string;
  ou: string;
  ip: string;
  userId: string;
  status: 'active' | 'disabled';
  customConfigEnabled?: boolean;
  customProxyConfig?: {
    mode: 'proxyAll' | 'directExcept';
    proxy: string;
    domains?: string[];
    bypassDomains?: string[];
  };
}

interface UserTableProps {
  users: User[];
  setUsers?: Dispatch<SetStateAction<any[]>>;
  showOuColumn?: boolean;
}

const CUSTOM_PROXY_VALUE = 'custom';

export function UserTable({ users, setUsers, showOuColumn = true }: UserTableProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<Partial<User>>({});
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedProxy, setSelectedProxy] = useState('');
  const [customProxyInput, setCustomProxyInput] = useState({
      protocol: 'http',
      address: '',
      port: '',
      username: '',
      password: ''
  });
  const [ous, setOUs] = useState([]);
  const [availableProxies, setAvailableProxies] = useState([]);
  const { toast } = useToast();


  const isMutable = !!setUsers;

  const fetchDropdownData = async () => {
      if (!isMutable) return;
      try {
          const [ousRes, proxiesRes] = await Promise.all([
              fetch('/api/ous'),
              fetch('/api/proxies')
          ]);
           if (!ousRes.ok || !proxiesRes.ok) {
              throw new Error('Failed to fetch OU/Proxy data.');
          }
          setOUs(await ousRes.json());
          setAvailableProxies((await proxiesRes.json()).map(p => p.name));
      } catch (error: any) {
          console.error("Failed to fetch dropdown data:", error);
          toast({ variant: 'destructive', title: 'Error', description: error.message });
      }
  };

  const fetchUsers = async () => {
    if (!setUsers) return;
    try {
      const res = await fetch('/api/users');
      if (!res.ok) {
        throw new Error('Failed to refetch users.');
      }
      const data = await res.json();
      setUsers(data);
    } catch (error: any) {
       toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  useEffect(() => {
      fetchDropdownData();
  }, []);

  const handleDialogOpen = (user: User | null = null) => {
    if (!isMutable) return;
    setEditingUser(user);
    const initialUserData: Partial<User> = user 
        ? { 
            ...user,
            customProxyConfig: typeof user.customProxyConfig === 'string' ? JSON.parse(user.customProxyConfig) : user.customProxyConfig
          } 
        : { 
            name: '', ou: '', ip: '', userId: '', status: 'active', 
            customConfigEnabled: false, 
            customProxyConfig: { mode: 'proxyAll', proxy: '', domains: [], bypassDomains: [] } 
          };
    
    setUserData(initialUserData);

    if (initialUserData.customConfigEnabled) {
        const proxy = initialUserData.customProxyConfig?.proxy || '';
        if (availableProxies.includes(proxy)) {
            setSelectedProxy(proxy);
            setCustomProxyInput({ protocol: 'http', address: '', port: '', username: '', password: '' });
        } else if (proxy) {
            setSelectedProxy(CUSTOM_PROXY_VALUE);
            try {
                const parsedProxy = JSON.parse(proxy);
                setCustomProxyInput(parsedProxy);
            } catch {
                setCustomProxyInput({ protocol: 'http', address: proxy, port: '', username: '', password: '' });
            }
        } else {
            setSelectedProxy('');
            setCustomProxyInput({ protocol: 'http', address: '', port: '', username: '', password: '' });
        }
    } else {
        setSelectedProxy('');
        setCustomProxyInput({ protocol: 'http', address: '', port: '', username: '', password: '' });
    }
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingUser(null);
  };

  const handleSave = async () => {
    if (!setUsers) return;

    let finalUserData = { ...userData };
    let customConfig = { ...(finalUserData.customProxyConfig || { mode: 'proxyAll', domains: [], bypassDomains: [] }) };

    if (finalUserData.customConfigEnabled) {
        customConfig.proxy = selectedProxy === CUSTOM_PROXY_VALUE ? JSON.stringify(customProxyInput) : selectedProxy;
        finalUserData.customProxyConfig = customConfig;
    } else {
      delete finalUserData.customProxyConfig;
    }

    const payload = {
        ...finalUserData,
        customProxyConfig: finalUserData.customProxyConfig ? JSON.stringify(finalUserData.customProxyConfig) : null
    };

    const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
    const method = editingUser ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Failed to save user.');
        }

        toast({ title: 'Success', description: result.message || `User has been ${editingUser ? 'updated' : 'created'}.` });
        fetchUsers();
        handleDialogClose();

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!setUsers || !userToDelete) return;
    
    try {
        const response = await fetch(`/api/users/${userToDelete.id}`, { method: 'DELETE' });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Failed to delete user.');
        }
        
        toast({ title: 'Success', description: result.message || `User "${userToDelete.name}" has been deleted.` });
        fetchUsers();
        setUserToDelete(null);
        setIsDeleteConfirmOpen(false);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };
  
  const handleOpenDeleteDialog = (user: User) => {
    setUserToDelete(user);
    setIsDeleteConfirmOpen(true);
  };
  
  const handleToggleStatus = async (user: User) => {
      if (!setUsers) return;
      const newStatus = user.status === 'active' ? 'disabled' : 'active';
      try {
          const response = await fetch(`/api/users/${user.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: newStatus })
          });
           const result = await response.json();
          if (!response.ok) {
              throw new Error(result.error || 'Failed to update status.');
          }
          
          toast({ title: 'Success', description: result.message || `User status changed to ${newStatus}.` });
          fetchUsers();
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Error', description: error.message });
      }
  }
  
  const handleDomainListChange = (listType: 'domains' | 'bypassDomains', index: number, value: string) => {
    const currentList = userData.customProxyConfig?.[listType] || [];
    const newList = [...currentList];
    newList[index] = value;
    setUserData({
      ...userData,
      customProxyConfig: {
        ...(userData.customProxyConfig || { mode: 'proxyAll', proxy: '' }),
        [listType]: newList,
      },
    });
  };

  const addDomainToList = (listType: 'domains' | 'bypassDomains') => {
    const currentList = userData.customProxyConfig?.[listType] || [];
    const newList = [...currentList, ''];
     setUserData({
      ...userData,
      customProxyConfig: {
        ...(userData.customProxyConfig || { mode: 'proxyAll', proxy: '' }),
        [listType]: newList,
      },
    });
  };

  const removeDomainFromList = (listType: 'domains' | 'bypassDomains', index: number) => {
    const currentList = userData.customProxyConfig?.[listType] || [];
    const newList = [...currentList];
    newList.splice(index, 1);
    setUserData({
      ...userData,
      customProxyConfig: {
        ...(userData.customProxyConfig || { mode: 'proxyAll', proxy: '' }),
        [listType]: newList,
      },
    });
  };

  const renderDomainListEditor = (listType: 'domains' | 'bypassDomains', label: string) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className='space-y-2'>
        {(userData.customProxyConfig?.[listType] || []).map((domain, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              placeholder="*.example.com"
              value={domain}
              onChange={(e) => handleDomainListChange(listType, index, e.target.value)}
            />
            <Button variant="ghost" size="icon" onClick={() => removeDomainFromList(listType, index)}>
              <X className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => addDomainToList(listType)}>
            <PlusCircle className='mr-2 h-4 w-4' />
            Add Domain
        </Button>
      </div>
    </div>
  );


  return (
    <Fragment>
        {isMutable && (
          <div className="flex justify-end mb-4">
              <Button onClick={() => handleDialogOpen()}>Add User</Button>
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>User ID</TableHead>
              {showOuColumn && <TableHead>Organizational Unit</TableHead>}
              <TableHead>Last Known IP</TableHead>
              <TableHead>Status</TableHead>
              {isMutable && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell className="font-mono">{user.userId}</TableCell>
                {showOuColumn && (
                  <TableCell>
                      <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full`} style={{ backgroundColor: ouColors[user.ou] || ouColors['Default'] }}></span>
                          <Badge variant="secondary">{user.ou}</Badge>
                      </div>
                  </TableCell>
                )}
                <TableCell>{user.ip}</TableCell>
                <TableCell>
                  {user.status === 'active' ? (
                    <Badge>Active</Badge>
                  ) : (
                    <Badge variant="secondary">Disabled</Badge>
                  )}
                </TableCell>
                {isMutable && (
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleDialogOpen(user)}>Edit</DropdownMenuItem>
                        {user.status === 'active' ? (
                            <DropdownMenuItem onClick={() => handleToggleStatus(user)}>
                                <PowerOff className="mr-2 h-4 w-4" />
                                <span>Deactivate</span>
                            </DropdownMenuItem>
                        ) : (
                            <DropdownMenuItem onClick={() => handleToggleStatus(user)}>
                                <Power className="mr-2 h-4 w-4" />
                                <span>Activate</span>
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleOpenDeleteDialog(user)} className="text-destructive focus:text-destructive">
                            Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
          <DialogContent>
              <DialogHeader>
                <DialogTitle>Are you absolutely sure?</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete the user <strong>{userToDelete?.name}</strong>.
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

      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
             <DialogDescription>
                {editingUser ? 'Update user details and custom configurations.' : 'Create a new user and assign them to an OU.'}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] -mx-6 px-6">
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input id="name" value={userData.name || ''} onChange={(e) => setUserData({ ...userData, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="userId">User ID</Label>
                      <Input id="userId" value={userData.userId || ''} onChange={(e) => setUserData({ ...userData, userId: e.target.value })} disabled={!!editingUser} />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="ip">Last Known IP</Label>
                      <Input id="ip" value={userData.ip || ''} disabled />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="ou">Organizational Unit</Label>
                      <Select value={userData.ou || ''} onValueChange={(value) => setUserData({ ...userData, ou: value })}>
                          <SelectTrigger>
                             <SelectValue>
                                  <div className="flex items-center gap-2">
                                    {userData.ou && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ouColors[userData.ou] || ouColors['Default'] }}></div>}
                                    <span>{userData.ou || 'Select an OU'}</span>
                                  </div>
                                </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                              {ous.map((ou: any) => (
                                  <SelectItem key={ou.id} value={ou.name}>
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ouColors[ou.name] || ouColors['Default'] }}></div>
                                      <span>{ou.name}</span>
                                    </div>
                                  </SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                  </div>
              </div>

              <div className="space-y-4 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                      <div>
                          <h4 className="font-medium">Custom Configuration</h4>
                          <p className="text-sm text-muted-foreground">Override OU settings for this specific user.</p>
                      </div>
                      <Switch
                          checked={!!userData.customConfigEnabled}
                          onCheckedChange={(checked) => setUserData({ ...userData, customConfigEnabled: checked })}
                      />
                  </div>
                  {userData.customConfigEnabled && (
                    <div className='space-y-4 pt-4 border-t'>
                      <div className='space-y-2'>
                          <Label>Mode</Label>
                          <RadioGroup
                              value={userData.customProxyConfig?.mode}
                              onValueChange={(value) => setUserData({...userData, customProxyConfig: {...(userData.customProxyConfig || { proxy: '' }), mode: value as any}})}
                              defaultValue="proxyAll"
                              className="flex gap-4"
                          >
                              <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="proxyAll" id="proxyAll" />
                                  <Label htmlFor="proxyAll">Proxy All Traffic</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="directExcept" id="directExcept" />
                                  <Label htmlFor="directExcept">Direct Traffic Except</Label>
                              </div>
                          </RadioGroup>
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="customProxy">Proxy</Label>
                          <Select
                            value={selectedProxy}
                            onValueChange={(value) => setSelectedProxy(value)}
                          >
                              <SelectTrigger><SelectValue placeholder="Select a proxy" /></SelectTrigger>
                              <SelectContent>
                                  {availableProxies.map(p => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
                                  <SelectItem value={CUSTOM_PROXY_VALUE}>Custom Proxy</SelectItem>
                              </SelectContent>
                          </Select>
                          {selectedProxy === CUSTOM_PROXY_VALUE && (
                              <div className="grid grid-cols-2 gap-4 border p-4 rounded-md mt-2">
                                  <div className="col-span-2 space-y-2">
                                      <Label>Protocol</Label>
                                      <Select value={customProxyInput.protocol} onValueChange={(value) => setCustomProxyInput({...customProxyInput, protocol: value})}>
                                          <SelectTrigger><SelectValue/></SelectTrigger>
                                          <SelectContent>
                                              <SelectItem value="http">HTTP</SelectItem>
                                              <SelectItem value="https">HTTPS</SelectItem>
                                              <SelectItem value="socks4">SOCKS4</SelectItem>
                                              <SelectItem value="socks5">SOCKS5</SelectItem>
                                          </SelectContent>
                                      </Select>
                                  </div>
                                  <div className="space-y-2">
                                      <Label>Address</Label>
                                      <Input placeholder="127.0.0.1" value={customProxyInput.address} onChange={(e) => setCustomProxyInput({...customProxyInput, address: e.target.value})}/>
                                  </div>
                                  <div className="space-y-2">
                                      <Label>Port</Label>
                                      <Input placeholder="8080" value={customProxyInput.port} onChange={(e) => setCustomProxyInput({...customProxyInput, port: e.target.value})}/>
                                  </div>
                                  <div className="space-y-2">
                                      <Label>Username (optional)</Label>
                                      <Input value={customProxyInput.username} onChange={(e) => setCustomProxyInput({...customProxyInput, username: e.target.value})}/>
                                  </div>
                                  <div className="space-y-2">
                                      <Label>Password (optional)</Label>
                                      <Input type="password" value={customProxyInput.password} onChange={(e) => setCustomProxyInput({...customProxyInput, password: e.target.value})}/>
                                  </div>
                              </div>
                          )}
                      </div>
                      
                      {userData.customProxyConfig?.mode === 'directExcept' && renderDomainListEditor('domains', 'Domains to Proxy')}
                      {userData.customProxyConfig?.mode === 'proxyAll' && renderDomainListEditor('bypassDomains', 'Bypass Domains (Direct Access)')}

                    </div>
                  )}
              </div>

              <div className="flex items-center space-x-2">
                  <Switch
                      id="status-switch"
                      checked={userData.status === 'active'}
                      onCheckedChange={(checked) => setUserData({ ...userData, status: checked ? 'active' : 'disabled' })}
                  />
                  <Label htmlFor="status-switch">User is Active</Label>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Fragment>
  );
}

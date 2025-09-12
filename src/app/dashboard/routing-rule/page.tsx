
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreHorizontal, PlusCircle, X } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { ouColors } from '@/app/dashboard/users/page';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

interface Rule {
    id: string;
    name: string;
    description: string;
    ou: string;
    proxy: string;
    mode: 'proxyAll' | 'directExcept';
    domains?: string[];
    bypassDomains?: string[];
}

const initialRuleData: Partial<Rule> = { 
    name: '', 
    ou: '', 
    proxy: '', 
    description: '', 
    mode: 'proxyAll', 
    domains: [], 
    bypassDomains: [] 
};


export default function RoutingRulePage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [ous, setOUs] = useState([]);
  const [proxies, setProxies] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [ruleData, setRuleData] = useState<Partial<Rule>>(initialRuleData);
  const [ruleToDelete, setRuleToDelete] = useState<Rule | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      const [rulesRes, ousRes, proxiesRes] = await Promise.all([
        fetch('/api/routing-rules'),
        fetch('/api/ous'),
        fetch('/api/proxies'),
      ]);
      if (!rulesRes.ok || !ousRes.ok || !proxiesRes.ok) {
        throw new Error('Failed to fetch initial data.');
      }
      const rulesData = await rulesRes.json();
      const ousData = await ousRes.json();
      const proxiesData = await proxiesRes.json();

      setRules(rulesData.map(rule => ({
        ...rule,
        domains: typeof rule.domains === 'string' ? JSON.parse(rule.domains) : rule.domains,
        bypassDomains: typeof rule.bypassDomains === 'string' ? JSON.parse(rule.bypassDomains) : rule.bypassDomains,
      })));
      setOUs(ousData);
      setProxies(proxiesData);
    } catch (error: any) {
      console.error('Failed to fetch data:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDialogOpen = (rule: Rule | null = null) => {
    setEditingRule(rule);
    const dataToEdit: Partial<Rule> = rule ? { ...rule } : { ...initialRuleData };
    
    setRuleData(dataToEdit);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingRule(null);
  };

  const handleSave = async () => {
    const url = editingRule ? `/api/routing-rules/${editingRule.id}` : '/api/routing-rules';
    const method = editingRule ? 'PUT' : 'POST';

    const payload = {
        ...ruleData,
        domains: JSON.stringify(ruleData.domains || []),
        bypassDomains: JSON.stringify(ruleData.bypassDomains || []),
    };

    try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Failed to save rule.');
        }

        toast({ title: 'Success', description: result.message || `Rule has been ${editingRule ? 'updated' : 'created'}.`});
        fetchData();
        handleDialogClose();
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!ruleToDelete) return;

    try {
        const response = await fetch(`/api/routing-rules/${ruleToDelete.id}`, { method: 'DELETE' });
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to delete rule.');
        }

        toast({ title: 'Success', description: result.message || `Rule "${ruleToDelete.name}" has been deleted.` });
        fetchData();
        setRuleToDelete(null);
        setIsDeleteConfirmOpen(false);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const handleOpenDeleteDialog = (rule: Rule) => {
    setRuleToDelete(rule);
    setIsDeleteConfirmOpen(true);
  };

  const handleDomainListChange = (listType: 'domains' | 'bypassDomains', index: number, value: string) => {
    const currentList = ruleData[listType] || [];
    const newList = [...currentList];
    newList[index] = value;
    setRuleData({
      ...ruleData,
      [listType]: newList,
    });
  };

  const addDomainToList = (listType: 'domains' | 'bypassDomains') => {
    const currentList = ruleData[listType] || [];
    const newList = [...currentList, ''];
    setRuleData({
      ...ruleData,
      [listType]: newList,
    });
  };

  const removeDomainFromList = (listType: 'domains' | 'bypassDomains', index: number) => {
    const currentList = ruleData[listType] || [];
    const newList = [...currentList];
    newList.splice(index, 1);
    setRuleData({
      ...ruleData,
      [listType]: newList,
    });
  };

  const renderDomainListEditor = (listType: 'domains' | 'bypassDomains', label: string) => (
    <div className="space-y-2 pt-4 border-t">
      <Label>{label}</Label>
      <div className='space-y-2'>
        {(ruleData[listType] || []).map((domain, index) => (
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
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Routing Rule Management</CardTitle>
              <CardDescription>Manage your routing rules here.</CardDescription>
            </div>
            <Button onClick={() => handleDialogOpen()}>Add Rule</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rule Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>OU</TableHead>
                <TableHead>Proxy</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">{rule.name}</TableCell>
                  <TableCell>{rule.description}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full`} style={{ backgroundColor: ouColors[rule.ou] || ouColors['Default'] }}></span>
                        <Badge variant="secondary">{rule.ou}</Badge>
                    </div>
                  </TableCell>
                  <TableCell><Badge>{rule.proxy}</Badge></TableCell>
                   <TableCell>
                    <Badge variant={rule.mode === 'proxyAll' ? 'outline' : 'default'}>
                      {rule.mode === 'proxyAll' ? 'Proxy All' : 'Direct Except'}
                    </Badge>
                  </TableCell>
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
                        <DropdownMenuItem onClick={() => handleDialogOpen(rule)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenDeleteDialog(rule)} className="text-destructive focus:text-destructive">
                            Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
            <DialogHeader>
              <DialogTitle>Are you absolutely sure?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete the <strong>{ruleToDelete?.name}</strong> routing rule.
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
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingRule ? 'Edit Rule' : 'Add New Rule'}</DialogTitle>
             <DialogDescription>
                {editingRule ? 'Update the details of the routing rule.' : 'Configure a new routing rule for an OU.'}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] -mx-6 px-6">
            <div className="grid gap-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" value={ruleData.name} onChange={(e) => setRuleData({ ...ruleData, name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Input id="description" value={ruleData.description} onChange={(e) => setRuleData({ ...ruleData, description: e.target.value })} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="ou">OU</Label>
                        <Select value={ruleData.ou} onValueChange={(value) => setRuleData({ ...ruleData, ou: value })}>
                            <SelectTrigger>
                               <SelectValue>
                                  <div className="flex items-center gap-2">
                                    {ruleData.ou && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ouColors[ruleData.ou] || ouColors['Default'] }}></div>}
                                    <span>{ruleData.ou || 'Select an OU'}</span>
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
                    <div className="space-y-2">
                        <Label htmlFor="proxy">Proxy</Label>
                         <Select value={ruleData.proxy} onValueChange={(value) => setRuleData({ ...ruleData, proxy: value })}>
                            <SelectTrigger><SelectValue placeholder="Select a Proxy" /></SelectTrigger>
                            <SelectContent>
                                {proxies.map((proxy: any) => (<SelectItem key={proxy.id} value={proxy.name}>{proxy.name}</SelectItem>))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            
              <div className="space-y-4 rounded-lg border p-4">
                  <div className='space-y-2'>
                      <Label>Mode</Label>
                      <RadioGroup
                          value={ruleData.mode}
                          onValueChange={(value) => setRuleData({...ruleData, mode: value as any})}
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
                  
                  {ruleData.mode === 'directExcept' && renderDomainListEditor('domains', 'Domains to Proxy')}
                  {ruleData.mode === 'proxyAll' && renderDomainListEditor('bypassDomains', 'Bypass Domains (Direct Access)')}
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
    </>
  );
}


'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Pencil, Search, RefreshCw, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ouColors } from '../users/page';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function ConnectionRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [ous, setOUs] = useState([]);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [userData, setUserData] = useState({ name: '', ou: '' });
  const [actionToConfirm, setActionToConfirm] = useState<'Approved' | 'Rejected' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<any>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    try {
        const [requestsRes, ousRes] = await Promise.all([
            fetch('/api/requests'),
            fetch('/api/ous')
        ]);
        if (!requestsRes.ok || !ousRes.ok) {
          throw new Error('Failed to fetch initial data.');
        }
        const requestsData = await requestsRes.json();
        const ousData = await ousRes.json();
        
        if (Array.isArray(requestsData)) {
            setRequests(requestsData);
        } else {
            setRequests([]); 
        }
        
        setOUs(ousData);
    } catch (error: any) {
        console.error("Failed to fetch data:", error);
        toast({ variant: 'destructive', title: 'Error', description: error.message });
        setRequests([]); 
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);


  const handleRequestStatusChange = (request: any, newStatus: 'Approved' | 'Rejected') => {
      setSelectedRequest(request);
      setUserData({ name: request.name || '', ou: request.ou || '' });
      setActionToConfirm(newStatus);
      setIsAssignDialogOpen(true);
  };
  
  const handleOpenEditDialog = (request: any) => {
    setSelectedRequest(request);
    setUserData({ name: request.name || '', ou: request.ou || '' });
    setActionToConfirm(null); // Just editing, no status change
    setIsAssignDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsAssignDialogOpen(false);
    setSelectedRequest(null);
    setActionToConfirm(null);
  }
  
  const handleSaveDetails = async () => {
    if (!selectedRequest) return;

    try {
        if (actionToConfirm && (!userData.name || !userData.ou)) {
            throw new Error('User Name and OU are required to approve or reject.');
        }
        
        const newStatus = actionToConfirm || selectedRequest.status;
        const payload: any = { status: newStatus, name: userData.name, ou: userData.ou };

        // First, update the request itself
        const requestResponse = await fetch(`/api/requests/${selectedRequest.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const requestResult = await requestResponse.json();
        if (!requestResponse.ok) {
            throw new Error(requestResult.error || 'Failed to update request.');
        }
        
        // If approved, create a new user and delete the request
        if (newStatus === 'Approved') {
            const userPayload = {
                name: userData.name,
                userId: selectedRequest.userId,
                ou: userData.ou,
                ip: selectedRequest.ipAddress,
                status: 'active'
            };
            const userResponse = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userPayload)
            });

            if (!userResponse.ok) {
                // If creating user fails (e.g. duplicate), show a specific warning but still consider the request part done.
                const userResult = await userResponse.json();
                toast({ variant: 'destructive', title: 'Warning', description: `Request approved, but failed to create user: ${userResult.error}` });
            } else {
                toast({ title: 'Success', description: `Request for ${userData.name} approved and user created.` });
                // Since user is created, we can now delete the original request.
                await fetch(`/api/requests/${selectedRequest.id}`, { method: 'DELETE' });
            }
        } else {
             // For Rejected or simple edits, just show the update message
             toast({ title: 'Success', description: 'Request details updated successfully.' });
        }

        fetchData();
        handleDialogClose();

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  }

  const handleDeleteRequest = (request: any) => {
    setRequestToDelete(request);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!requestToDelete) return;
    
    try {
        const response = await fetch(`/api/requests/${requestToDelete.id}`, { method: 'DELETE' });
        if (!response.ok) {
            const result = await response.json();
            throw new Error(result.error || 'Failed to delete request.');
        }
        setIsDeleteConfirmOpen(false);
        setRequestToDelete(null);
        toast({ title: 'Success', description: 'Request record has been deleted.' });
        fetchData();
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };


  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'Approved':
        return <Badge>Approved</Badge>;
      case 'Rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredRequests = requests.filter(req =>
    (req.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (req.userId?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (req.ipAddress?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (req.ou?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const pendingCount = filteredRequests.filter(req => req.status === 'Pending').length;
  const approvedCount = filteredRequests.filter(req => req.status === 'Approved').length;
  const rejectedCount = filteredRequests.filter(req => req.status === 'Rejected').length;
  
  const renderRequestTableByStatus = (status: string) => {
    const tableData = filteredRequests.filter(req => req.status === status);

    if (isLoading) {
        return (
            <div className="space-y-2 mt-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        )
    }

    if (tableData.length === 0) {
        return <p className="text-muted-foreground text-center mt-8">No {status.toLowerCase()} requests found.</p>
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User Name</TableHead>
            <TableHead>User ID</TableHead>
            <TableHead>OU</TableHead>
            <TableHead>IP Address</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tableData.map((request) => (
            <TableRow key={request.id}>
              <TableCell>{request.name || 'N/A'}</TableCell>
              <TableCell className="font-mono">{request.userId}</TableCell>
              <TableCell>{request.ou ? <Badge variant="secondary">{request.ou}</Badge> : 'N/A'}</TableCell>
              <TableCell>{request.ipAddress}</TableCell>
              <TableCell>{getStatusBadge(request.status)}</TableCell>
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(request)} className="text-blue-500 hover:bg-blue-500/10 hover:text-blue-600">
                        <Pencil className="h-5 w-5" />
                        <span className="sr-only">Edit Details</span>
                    </Button>
                    
                  {status === 'Pending' && (
                    <>
                      <Button variant="ghost" size="icon" onClick={() => handleRequestStatusChange(request, 'Approved')} className="text-green-500 hover:bg-green-500/10 hover:text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        <span className="sr-only">Approve</span>
                      </Button>
                     <Button variant="ghost" size="icon" onClick={() => handleRequestStatusChange(request, 'Rejected')} className="text-red-500 hover:bg-red-500/10 hover:text-red-600">
                        <XCircle className="h-5 w-5" />
                        <span className="sr-only">Reject</span>
                      </Button>
                    </>
                  )}

                   <Button variant="ghost" size="icon" onClick={() => handleDeleteRequest(request)} className="text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-5 w-5" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center gap-4">
            <div>
              <CardTitle>Connection Requests</CardTitle>
              <CardDescription>Manage incoming connection requests from new clients.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
                <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search requests..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                </div>
                <Button variant="outline" size="icon" onClick={fetchData} disabled={isLoading}>
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    <span className="sr-only">Refresh</span>
                </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending">
            <TabsList>
              <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
              <TabsTrigger value="approved">Approved ({approvedCount})</TabsTrigger>
              <TabsTrigger value="rejected">Rejected ({rejectedCount})</TabsTrigger>
            </TabsList>
            <TabsContent value="pending">
              {renderRequestTableByStatus('Pending')}
            </TabsContent>
            <TabsContent value="approved">
              {renderRequestTableByStatus('Approved')}
            </TabsContent>
            <TabsContent value="rejected">
               {renderRequestTableByStatus('Rejected')}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <Dialog open={isAssignDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionToConfirm ? `Confirm Action` : 'Edit User Details'}</DialogTitle>
            <DialogDescription>
              {actionToConfirm 
                ? `To ${actionToConfirm.toLowerCase()} this request, please provide or confirm user details.` 
                : 'Assign or update the name and organizational unit for this request.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                User Name*
              </Label>
              <Input id="name" value={userData.name} onChange={(e) => setUserData({ ...userData, name: e.target.value })} className="col-span-3" placeholder="e.g. John Doe"/>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ou" className="text-right">
                OU*
              </Label>
              <Select value={userData.ou} onValueChange={(value) => setUserData({ ...userData, ou: value })}>
                <SelectTrigger className="col-span-3">
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
          <DialogFooter>
            <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSaveDetails}>
              {actionToConfirm ? `Confirm ${actionToConfirm}` : 'Save Details'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
            <DialogHeader>
              <DialogTitle>Are you sure?</DialogTitle>
              <DialogDescription>This will permanently delete the request from <strong>{requestToDelete?.userId}</strong>. This action cannot be undone.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleConfirmDelete} variant="destructive">Delete</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

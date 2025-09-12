
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserTable } from '@/components/user-table';

export const ouColors: { [key: string]: string } = {
    'Engineering': '#3b82f6',
    'Sales': '#22c55e',
    'Marketing': '#a855f7',
    'Support': '#f97316',
    'HR': '#ef4444',
    'Development': '#6366f1',
    'Design': '#ec4899',
    'DevOps': '#14b8a6',
    'QA': '#eab308',
    'BI': '#06b6d4',
    'Finance': '#10b981',
    'IT': '#0ea5e9',
    'Legal': '#8b5cf6',
    'Content': '#d946ef',
    'R&D': '#f43f5e',
    'Product': '#f59e0b',
    'Infrastructure': '#78716c',
    'Security': '#64748b',
    'Operations': '#6b7280',
    'Admin': '#84cc16',
    'Default': '#6b7280',
};


export default function UsersPage() {
  const [users, setUsers] = useState([]);
  
  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Manage your users and their assignments here.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <UserTable users={users} setUsers={setUsers} showOuColumn={true} />
      </CardContent>
    </Card>
  );
}

    
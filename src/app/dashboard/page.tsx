
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart, Users, Network, GitBranch, Building2, UserPlus, ArrowRight } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts";
import { ouColors } from "./users/page";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

const chartConfig = {
  users: {
    label: "Users",
  },
};

export default function Dashboard() {
  const [stats, setStats] = useState({
    users: 0,
    proxies: 0,
    rules: 0,
    ous: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [usersRes, proxiesRes, rulesRes, ousRes, requestsRes] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/proxies'),
          fetch('/api/routing-rules'),
          fetch('/api/ous'),
          fetch('/api/requests'),
        ]);

        const usersData = await usersRes.json();
        const proxiesData = await proxiesRes.json();
        const rulesData = await rulesRes.json();
        const ousData = await ousRes.json();
        const requestsData = await requestsRes.json();

        setStats({
          users: usersData.length,
          proxies: proxiesData.length,
          rules: rulesData.length,
          ous: ousData.length,
        });
        
        if (Array.isArray(requestsData)) {
            const pending = requestsData
              .filter(req => req.status === 'Pending')
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 5);
            setPendingRequests(pending);
        } else {
            setPendingRequests([]);
        }

        const newChartData = ousData.map(ou => ({
          name: ou.name,
          count: usersData.filter(user => user.ou === ou.name).length,
          fill: ouColors[ou.name] || '#6b7280'
        })).filter(ou => ou.count > 0);

        setChartData(newChartData);

      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Skeleton className="col-span-4 h-80" />
                <Skeleton className="col-span-3 h-80" />
            </div>
        </div>
    )
  }


  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Users
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users}</div>
            <p className="text-xs text-muted-foreground">
              Currently active in system
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Proxies
            </CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.proxies}</div>
            <p className="text-xs text-muted-foreground">
              Configured in the system
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Routing Rules</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rules}</div>
            <p className="text-xs text-muted-foreground">
              Covering all OUs
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Organizational Units
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ous}</div>
            <p className="text-xs text-muted-foreground">
              Total OUs managed
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Users by OU</CardTitle>
            <CardDescription>An overview of user distribution across OUs.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <RechartsBarChart data={chartData} layout="vertical" margin={{ left: 10, right: 10 }}>
                <CartesianGrid horizontal={false} />
                 <XAxis type="number" dataKey="count" stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                 <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" width={80} />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
                <Bar dataKey="count" layout="vertical" radius={5}>
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                </Bar>
              </RechartsBarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="col-span-3 flex flex-col">
          <CardHeader>
            <CardTitle>Pending Connection Requests</CardTitle>
            <CardDescription>
              New clients awaiting approval.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
             {pendingRequests.length > 0 ? (
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>User ID</TableHead>
                        <TableHead>IP Address</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {pendingRequests.map((req: any) => (
                        <TableRow key={req.id}>
                        <TableCell>
                            <div className="font-medium font-mono text-xs">{req.userId}</div>
                        </TableCell>
                        <TableCell>{req.ipAddress}</TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
             ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <UserPlus className="w-12 h-12 text-muted-foreground/50" />
                    <p className="mt-4 text-muted-foreground">No pending requests.</p>
                </div>
             )}
          </CardContent>
           <div className="p-4 border-t">
                <Button asChild size="sm" className="w-full">
                    <Link href="/dashboard/requests">
                        Manage All Requests <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </div>
        </Card>
      </div>
    </div>
  );
}

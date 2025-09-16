import React, { useState, useEffect } from 'react';
import { Users, Plus, Shield, Mail, Calendar, MoreHorizontal } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Header } from '@/components/ui/Header';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  full_name: string;
  email: string;
  role: 'owner' | 'admin' | 'manager' | 'tech' | 'readonly';
  created_at: string;
  last_login: string | null;
  status: 'active' | 'inactive' | 'pending';
}

const AdminUsers = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Mock data - replace with actual Supabase queries
  useEffect(() => {
    const mockUsers: User[] = [
      {
        id: '1',
        full_name: 'Admin User',
        email: 'admin@gothamvending.com',
        role: 'owner',
        created_at: '2024-01-15T00:00:00Z',
        last_login: '2024-03-15T14:30:00Z',
        status: 'active'
      },
      {
        id: '2',
        full_name: 'John Manager',
        email: 'john@gothamvending.com',
        role: 'manager',
        created_at: '2024-02-01T00:00:00Z',
        last_login: '2024-03-14T09:15:00Z',
        status: 'active'
      },
      {
        id: '3',
        full_name: 'Sarah Tech',
        email: 'sarah@gothamvending.com',
        role: 'tech',
        created_at: '2024-02-15T00:00:00Z',
        last_login: null,
        status: 'pending'
      }
    ];
    
    setTimeout(() => {
      setUsers(mockUsers);
      setLoading(false);
    }, 1000);
  }, []);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'tech': return 'bg-green-100 text-green-800';
      case 'readonly': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleInviteUser = () => {
    toast({
      title: "Invite User",
      description: "User invitation feature coming soon",
    });
  };

  const handleEditUser = (userId: string) => {
    toast({
      title: "Edit User",
      description: "User editing feature coming soon",
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-6"></div>
          <div className="h-24 bg-muted rounded mb-6"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <Header 
          title="Users & Roles" 
          subtitle="Manage user access and permissions for your organization" 
        />
        <Button onClick={handleInviteUser}>
          <Plus className="w-4 h-4 mr-2" />
          Invite User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{users.length}</div>
                <div className="text-xs text-muted-foreground">Total Users</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{users.filter(u => u.status === 'active').length}</div>
                <div className="text-xs text-muted-foreground">Active Users</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{users.filter(u => u.status === 'pending').length}</div>
                <div className="text-xs text-muted-foreground">Pending Invites</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{users.filter(u => u.last_login && new Date(u.last_login) > new Date(Date.now() - 7*24*60*60*1000)).length}</div>
                <div className="text-xs text-muted-foreground">Active This Week</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="relative flex-1 min-w-64">
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Role:</label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="tech">Technician</SelectItem>
                  <SelectItem value="readonly">Read Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Users Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.full_name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeColor(user.status)}>
                      {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.last_login 
                      ? new Date(user.last_login).toLocaleDateString()
                      : 'Never'
                    }
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEditUser(user.id)}>
                          Edit User
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          Change Role
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          Deactivate User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No users found</h3>
              <p className="text-muted-foreground">
                {searchTerm || roleFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Invite your first team member to get started'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Descriptions */}
      <Card>
        <CardHeader>
          <CardTitle>Role Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <Badge className="mb-2 bg-purple-100 text-purple-800">Owner</Badge>
              <p className="text-sm text-muted-foreground">
                Full access to all features, billing, and user management. Can transfer ownership.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <Badge className="mb-2 bg-red-100 text-red-800">Admin</Badge>
              <p className="text-sm text-muted-foreground">
                Full operational access, can manage users and settings, but no billing access.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <Badge className="mb-2 bg-blue-100 text-blue-800">Manager</Badge>
              <p className="text-sm text-muted-foreground">
                Can manage operations, view reports, and handle inventory, but limited admin functions.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <Badge className="mb-2 bg-green-100 text-green-800">Technician</Badge>
              <p className="text-sm text-muted-foreground">
                Can perform restocks, maintenance, and view machine data. Limited to operational tasks.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <Badge className="mb-2 bg-gray-100 text-gray-800">Read Only</Badge>
              <p className="text-sm text-muted-foreground">
                View-only access to reports and data. Cannot make changes to any settings or data.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsers;
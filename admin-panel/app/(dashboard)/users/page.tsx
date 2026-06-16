'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usersAPI } from '@/lib/api';
import { Edit, Trash2, Search, Users as UsersIcon, Plus, Filter } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getAll({ limit: 100 });
      const usersData = response.data?.data?.users || response.data?.data?.data?.users || [];
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (error: any) {
      console.error('Error loading users:', error);
      const errorMessage = error.response?.data?.message || 'خطا در بارگذاری کاربران';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(search.toLowerCase()) ||
    user.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary"></div>
            <UsersIcon className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary animate-pulse" />
          </div>
          <p className="mt-4 text-muted-foreground font-medium">در حال بارگذاری کاربران...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 animate-slide-up">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient mb-1 sm:mb-2">مدیریت کاربران</h1>
          <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">
            مدیریت و مشاهده کاربران سیستم
          </p>
        </div>
        <Button className="gap-2 gradient-primary shadow-glow hover:shadow-glow-sm w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          کاربر جدید
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:scale-[1.02] transition-all duration-300 animate-slide-up">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">کل کاربران</p>
                <p className="text-2xl sm:text-3xl font-bold truncate">{users.length}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-xl bg-blue-500/10 flex-shrink-0">
                <UsersIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:scale-[1.02] transition-all duration-300 animate-slide-up delay-75">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">کاربران فعال</p>
                <p className="text-2xl sm:text-3xl font-bold truncate">{users.filter(u => u.isActive).length}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-xl bg-green-500/10 flex-shrink-0">
                <UsersIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:scale-[1.02] transition-all duration-300 animate-slide-up delay-150">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">نتایج جستجو</p>
                <p className="text-2xl sm:text-3xl font-bold truncate">{filteredUsers.length}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-xl bg-amber-500/10 flex-shrink-0">
                <Search className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="animate-slide-up delay-200">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>لیست کاربران</CardTitle>
              <CardDescription>
                تعداد کل کاربران: {users.length} | نمایش: {filteredUsers.length}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none sm:w-64">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="جستجو بر اساس نام یا ایمیل..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pr-10 rounded-xl border-border/50 focus:border-primary/50"
                />
              </div>
              <Button variant="outline" size="icon" className="rounded-xl">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <UsersIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">کاربری یافت نشد</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block lg:hidden space-y-3">
                {filteredUsers.map((user, index) => (
                  <Card 
                    key={user._id || user.id || `user-${index}`}
                    className="animate-slide-up"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base truncate">{user.name || 'بدون نام'}</h3>
                          <p className="text-sm text-muted-foreground truncate mt-1">
                            {user.email || user.phoneNumber || '-'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="rounded-xl hover:bg-blue-500/10 hover:text-blue-600 h-8 w-8"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="rounded-xl hover:bg-red-500/10 hover:text-red-600 h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          user.role === 'admin' 
                            ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20' :
                            user.role === 'teacher' 
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' :
                            'bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-500/20'
                        }`}>
                          {user.role === 'admin' ? 'مدیر' :
                           user.role === 'teacher' ? 'مدرس' : 'دانشجو'}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          user.isActive 
                            ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20' 
                            : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ml-2 ${
                            user.isActive ? 'bg-green-500' : 'bg-red-500'
                          }`}></span>
                          {user.isActive ? 'فعال' : 'غیرفعال'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto rounded-xl border border-border/50">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="border-b border-border/50 bg-accent/30">
                      <th className="text-right p-4 font-semibold text-sm">نام</th>
                      <th className="text-right p-4 font-semibold text-sm">ایمیل</th>
                      <th className="text-right p-4 font-semibold text-sm">نقش</th>
                      <th className="text-right p-4 font-semibold text-sm">وضعیت</th>
                      <th className="text-right p-4 font-semibold text-sm">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user, index) => (
                      <tr 
                        key={user._id || user.id || `user-${index}`} 
                        className="border-b border-border/30 hover:bg-accent/30 transition-colors duration-200"
                        style={{ animationDelay: `${index * 20}ms` }}
                      >
                        <td className="p-4 font-medium text-sm">{user.name || 'بدون نام'}</td>
                        <td className="p-4 text-muted-foreground text-sm">{user.email || user.phoneNumber || '-'}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            user.role === 'admin' 
                              ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20' :
                              user.role === 'teacher' 
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' :
                              'bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-500/20'
                          }`}>
                            {user.role === 'admin' ? 'مدیر' :
                             user.role === 'teacher' ? 'مدرس' : 'دانشجو'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            user.isActive 
                              ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20' 
                              : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ml-2 ${
                              user.isActive ? 'bg-green-500' : 'bg-red-500'
                            }`}></span>
                            {user.isActive ? 'فعال' : 'غیرفعال'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 justify-end">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="rounded-xl hover:bg-blue-500/10 hover:text-blue-600"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="rounded-xl hover:bg-red-500/10 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

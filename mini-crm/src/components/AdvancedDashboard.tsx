'use client';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Users, TrendingUp, MessageSquare, Search, Plus, Trash, Bot, ArrowUpDown } from 'lucide-react';
import { useCRMStore } from '@/store/crmStore';
import type { Lead } from '@/store/crmStore';
import { useEffect, useState } from 'react';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogCancel, AlertDialogAction, AlertDialogTitle, AlertDialogDescription } from '@/components/ui/alert-dialog';

export default function AdvancedDashboard({ onLeadClick }: { onLeadClick: () => void }) {
  const {
    fetchLeads,
    leads,
    analytics,
    filter,
    searchTerm,
    setFilter,
    setSearchTerm,
    setSelectedLead,
    updateLead
  } = useCRMStore();

  const [deleteLeadId, setDeleteLeadId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'status' | 'source'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const filteredLeads = leads.filter(lead => {
    const matchesFilter = filter === 'all' || lead.status === filter;
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const sortedLeads = [...filteredLeads].sort((a, b) => {
    const aValue = a[sortBy].toLowerCase();
    const bValue = b[sortBy].toLowerCase();

    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    onLeadClick();
  };

  const handleStatusUpdate = async (leadId: string, newStatus: Lead["status"]) => {
    try {
      await updateLead(leadId, { status: newStatus });
      await fetchLeads();
    } catch (error) {
      console.error('Failed to update lead status:', error);
    }
  };

  const handleSort = (column: 'name' | 'email' | 'status' | 'source') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'qualified': return 'bg-green-100 text-green-800';
      case 'converted': return 'bg-purple-100 text-purple-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">CRM Dashboard</h1>
          <p className="text-gray-600">Manage your leads with AI assistance</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Leads</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lead Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Lead Management ({sortedLeads.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left p-4 font-medium text-gray-900">
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center space-x-1 hover:text-blue-600 transition-colors"
                    >
                      <span>Lead</span>
                      <ArrowUpDown className="h-4 w-4" />
                    </button>
                  </th>
                  <th className="text-left p-4 font-medium text-gray-900">
                    <button
                      onClick={() => handleSort('email')}
                      className="flex items-center space-x-1 hover:text-blue-600 transition-colors"
                    >
                      <span>Email</span>
                      <ArrowUpDown className="h-4 w-4" />
                    </button>
                  </th>
                  <th className="text-left p-4 font-medium text-gray-900">
                    <button
                      onClick={() => handleSort('source')}
                      className="flex items-center space-x-1 hover:text-blue-600 transition-colors"
                    >
                      <span>Source</span>
                      <ArrowUpDown className="h-4 w-4" />
                    </button>
                  </th>
                  <th className="text-left p-4 font-medium text-gray-900">
                    <button
                      onClick={() => handleSort('status')}
                      className="flex items-center space-x-1 hover:text-blue-600 transition-colors"
                    >
                      <span>Status</span>
                      <ArrowUpDown className="h-4 w-4" />
                    </button>
                  </th>
                  <th className="text-center p-4 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedLeads.map((lead, index) => (
                  <motion.tr
                    key={lead.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="text-sm">
                            {lead.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium text-gray-900">{lead.name}</h3>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-gray-600">{lead.email}</span>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className="text-xs">
                        {lead.source}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="relative">
                        <Select
                          value={lead.status}
                          onValueChange={(newStatus) => handleStatusUpdate(lead.id, newStatus as Lead["status"])}
                        >
                          <SelectTrigger className={`w-40 h-10 border-2 rounded-xl font-medium transition-all duration-300 hover:shadow-md ${getStatusColor(lead.status)} border-transparent`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="w-40 p-2 bg-white/95 backdrop-blur-sm border-0 shadow-2xl rounded-xl">
                            <SelectItem
                              value="new"
                              className="rounded-lg mb-1 hover:bg-blue-50 focus:bg-blue-50 transition-colors duration-200"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                                <span className="font-medium">New</span>
                              </div>
                            </SelectItem>
                            <SelectItem
                              value="contacted"
                              className="rounded-lg mb-1 hover:bg-yellow-50 focus:bg-yellow-50 transition-colors duration-200"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                                <span className="font-medium">Contacted</span>
                              </div>
                            </SelectItem>
                            <SelectItem
                              value="qualified"
                              className="rounded-lg mb-1 hover:bg-green-50 focus:bg-green-50 transition-colors duration-200"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-3 h-3 bg-green-500 rounded-full" />
                                <span className="font-medium">Qualified</span>
                              </div>
                            </SelectItem>
                            <SelectItem
                              value="converted"
                              className="rounded-lg mb-1 hover:bg-purple-50 focus:bg-purple-50 transition-colors duration-200"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-3 h-3 bg-purple-500 rounded-full" />
                                <span className="font-medium">Converted</span>
                              </div>
                            </SelectItem>
                            <SelectItem
                              value="closed"
                              className="rounded-lg hover:bg-gray-50 focus:bg-gray-50 transition-colors duration-200"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-3 h-3 bg-gray-500 rounded-full" />
                                <span className="font-medium">Closed</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center space-x-2">
                        <motion.button
                          onClick={() => handleLeadClick(lead)}
                          className="flex items-center space-x-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-3 py-1.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Bot className="h-4 w-4" />
                          <span className="text-sm">Chat</span>
                        </motion.button>

                        <AlertDialog open={deleteLeadId === lead.id} onOpenChange={(open) => !open && setDeleteLeadId(null)}>
                          <AlertDialogTrigger asChild>
                            <button
                              onClick={() => setDeleteLeadId(lead.id)}
                              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash className="h-4 w-4" />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Lead</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{lead.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setDeleteLeadId(null)}>
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => {
                                  useCRMStore.getState().deleteLead(lead.id);
                                  setDeleteLeadId(null);
                                }}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>

            {sortedLeads.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No leads found</p>
                <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
'use client';

//import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Users, TrendingUp, MessageSquare, Search, Plus, Trash } from 'lucide-react';
import { useCRMStore } from '@/store/crmStore';
import AddLeadForm from './AddLeadForm';
import type { Lead } from '@/store/crmStore';
//import { useAI } from '@/providers/AIProvider';
import { useState } from 'react';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogCancel, AlertDialogAction, AlertDialogTitle, AlertDialogDescription } from '@/components/ui/alert-dialog';


export default function AdvancedDashboard({ onLeadClick }: { onLeadClick: () => void }) {
  const { leads, analytics, filter, searchTerm, setFilter, setSearchTerm, setSelectedLead } = useCRMStore();
  //const [isLoading, setIsLoading] = useState(false);

  const filteredLeads = leads.filter(lead => {
    const matchesFilter = filter === 'all' || lead.status === filter;
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleLeadClick = (lead: any) => {
    setSelectedLead(lead);
    onLeadClick(); 
  };
  
   const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">CRM Dashboard</h1>
            <p className="text-gray-600">Manage your leads with AI assistance</p>
          </div>
          <AddLeadForm />

        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                <Users className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalLeads}</div>
                <p className="text-xs text-blue-100">+12% from last month</p>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <TrendingUp className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.conversionRate}%</div>
                <p className="text-xs text-green-100">+3% from last week</p>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Chats</CardTitle>
                <MessageSquare className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.activeChats}</div>
                <p className="text-xs text-purple-100">Real-time interactions</p>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">AI Accuracy</CardTitle>
                <BarChart className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.aiAccuracy}%</div>
                <p className="text-xs text-orange-100">LLM performance</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Filters and Search */}
        <div className="flex gap-4 mb-6">
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
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Leads</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="opportunity">Opportunity</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Lead Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Lead Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredLeads.map((lead, index) => (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarFallback>
                        {lead.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{lead.name}</h3>
                      <p className="text-sm text-gray-600">{lead.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
 <div className="flex items-center gap-4">
    <div className="text-right">
      <div className="text-sm text-gray-500">{lead.source}</div>
   </div>
  <Select
  value={lead.status}
  onValueChange={(newStatus) => {
    useCRMStore.getState().updateLead(lead.id, {
      status: newStatus as Lead["status"],
    });
  }}
>
  <SelectTrigger className="w-32 h-8 text-sm">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="new">New</SelectItem>
    <SelectItem value="contacted">Contacted</SelectItem>
    <SelectItem value="qualified">Qualified</SelectItem>
    <SelectItem value="opportunity">Opportunity</SelectItem>
    <SelectItem value="closed">Closed</SelectItem>
  </SelectContent>
</Select>

</div>

    {/* 💬 Chat Icon */}
    <MessageSquare
      className="h-4 w-4 text-blue-500 hover:text-blue-700 cursor-pointer transition-transform hover:scale-110"
      onClick={(e) => {
        e.stopPropagation();
        handleLeadClick(lead); // This will go to chat
      }}
    />


<AlertDialog open={open} onOpenChange={setOpen}>
  <AlertDialogTrigger asChild>
    <Trash
      className="h-4 w-4 text-red-500 hover:text-red-700 cursor-pointer transition-transform hover:scale-110"
      onClick={(e) => {
        e.stopPropagation();
        setOpen(true); // show confirmation
      }}
    />
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action will permanently delete the lead.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction
        onClick={() => {
          useCRMStore.getState().deleteLead(lead.id);
          setOpen(false);
        }}
      >
        Confirm
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>



</div>

                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
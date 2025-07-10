'use client';

//import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Users, TrendingUp, MessageSquare, Search, Plus, Trash, Bot } from 'lucide-react';
import { useCRMStore } from '@/store/crmStore';
import type { Lead } from '@/store/crmStore';
//import { useAI } from '@/providers/AIProvider';
import { useEffect, useState } from 'react';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogCancel, AlertDialogAction, AlertDialogTitle, AlertDialogDescription } from '@/components/ui/alert-dialog';


export default function AdvancedDashboard({ onLeadClick }: { onLeadClick: () => void }) {
  const {fetchLeads, leads, analytics, filter, searchTerm, setFilter, setSearchTerm, setSelectedLead } = useCRMStore();
  //const [isLoading, setIsLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  useEffect(() => {
    fetchLeads();
  }, []);
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
    <motion.div>
      <motion.button
       onClick={(e) => {
        e.stopPropagation();
        handleLeadClick(lead); // This will go to chat
      }}
      className="group flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-3 py-1 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
      whileHover={{ scale: 0.8 }}
      whileTap={{ scale: 0.90 }}
      >
      <Bot/>
        <span className="font-semibold">AI Assistant</span>
      </motion.button>
      </motion.div>


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
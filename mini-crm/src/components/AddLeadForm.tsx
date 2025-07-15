// src/components/AddLeadForm.tsx
'use client';
import { useState } from 'react';
import { createLead } from '@/lib/api';
import { useCRMStore } from '@/store/crmStore';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { ArrowRight, Plus, User, Mail, Phone, Loader2 } from 'lucide-react';

export default function AddLeadForm() {
  const { leads, setLeads, updateAnalytics } = useCRMStore();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'new',
    source: 'manual',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const newLead = await createLead(form);
      setLeads([newLead, ...leads]);
      updateAnalytics();
      toast.success('Lead created successfully');
      setForm({ name: '', email: '', phone: '', status: 'new', source: 'manual'});
      setOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to create lead');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.button
          className="group relative flex items-center justify-center space-x-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 w-56 h-16 overflow-hidden"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <Plus className="w-6 h-6 transition-transform duration-300 group-hover:rotate-90" />
          <span className="font-semibold text-lg">Add New Lead</span>
          <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0" />
        </motion.button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-lg bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
        <DialogHeader className="text-center pb-6">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Add New Lead
          </DialogTitle>
          <DialogDescription className="text-gray-600 mt-2">
            Fill in the details below to add a new lead to your CRM system.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <User className="w-4 h-4" />
              Full Name
            </Label>
            <Input
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="h-12 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl transition-all duration-300"
              placeholder="Enter full name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Address
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              className="h-12 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl transition-all duration-300"
              placeholder="Enter email address"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Phone Number
            </Label>
            <Input
              id="phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="h-12 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-xl transition-all duration-300"
              placeholder="Enter phone number (optional)"
            />
          </div>
          
          <div className="flex justify-end space-x-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="px-6 py-3 rounded-xl border-2 border-gray-300 hover:border-gray-400 transition-colors duration-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Lead
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
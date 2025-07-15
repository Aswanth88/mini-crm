'use client';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Users, Search, Plus, Edit, Trash, ArrowUpDown, Globe, Phone, MapPin, Filter, Download, MoreHorizontal, TrendingUp, Activity, Eye } from 'lucide-react';
import { useState, useEffect } from 'react';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogCancel, AlertDialogAction, AlertDialogTitle, AlertDialogDescription } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import CompanyForm from './CompanyForm';
import { useCRMStore } from '@/store/crmStore';

interface Company {
  id: string;
  name: string;
  industry?: string;
  revenue?: number;
  employee_count?: number;
  website?: string;
  phone?: string;
  address?: string;
  status: 'active' | 'inactive';
  created_at?: string;
  description?: string;
}

type SortableKeys = keyof Company;

export default function CompanyDashboard() {
  const { companies, fetchCompanies, addCompany, updateCompany, deleteCompany } = useCRMStore();
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortableKeys>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [deleteCompanyId, setDeleteCompanyId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  useEffect(() => {
    let filtered = companies.filter(company => {
      const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (company.industry?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || company.status === statusFilter;
      const matchesIndustry = industryFilter === 'all' || company.industry === industryFilter;
      return matchesSearch && matchesStatus && matchesIndustry;
    });

    filtered.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return 1;
      if (bValue === undefined) return -1;
      
      let comparison = 0;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredCompanies(filtered);
  }, [companies, searchTerm, statusFilter, industryFilter, sortBy, sortOrder]);

  const handleSort = (column: SortableKeys) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const formatRevenue = (revenue?: number) => {
    if (!revenue) return '$0';
    if (revenue >= 1000000) {
      return `$${(revenue / 1000000).toFixed(1)}M`;
    } else if (revenue >= 1000) {
      return `$${(revenue / 1000).toFixed(0)}K`;
    } else {
      return `$${revenue.toLocaleString()}`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'inactive': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getIndustryIcon = (industry?: string) => {
    if (!industry) return '🏢';
    const iconMap: { [key: string]: string } = {
      'technology': '💻',
      'healthcare': '🏥',
      'energy': '⚡',
      'finance': '💰',
      'manufacturing': '🏭',
      'education': '🎓',
      'retail': '🛍️',
      'real estate': '🏠',
      'transportation': '🚛',
      'media': '📺',
      'telecommunications': '📱',
      'agriculture': '🌾',
      'construction': '🏗️',
      'automotive': '🚗',
      'pharmaceuticals': '💊',
    };
    return iconMap[industry.toLowerCase()] || '🏢';
  };

  const handleAddCompany = () => {
    setEditingCompany(null);
    setShowForm(true);
  };

  const handleEditCompany = (company: Company) => {
    setEditingCompany(company);
    setShowForm(true);
  };

  const handleFormSubmit = async (companyData: Omit<Company, 'id' | 'created_at'>) => {
    try {
      if (editingCompany) {
        await updateCompany(editingCompany.id, companyData);
      } else {
        await addCompany(companyData);
      }
      setShowForm(false);
      setEditingCompany(null);
    } catch (error) {
      console.error('Error submitting company:', error);
    }
  };

  const handleDeleteCompany = async (companyId: string) => {
    try {
      await deleteCompany(companyId);
      setDeleteCompanyId(null);
    } catch (error) {
      console.error('Error deleting company:', error);
    }
  };

  const uniqueIndustries = [...new Set(companies.map(c => c.industry).filter(Boolean))] as string[];

  // Calculate stats
  const activeCompanies = companies.filter(c => c.status === 'active').length;
  const totalRevenue = companies.reduce((sum, c) => sum + (c.revenue || 0), 0);
  const totalEmployees = companies.reduce((sum, c) => sum + (c.employee_count || 0), 0);

  if (showForm) {
    return (
      <CompanyForm
        company={editingCompany}
        onSubmit={handleFormSubmit}
        onCancel={() => {
          setShowForm(false);
          setEditingCompany(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Company Management</h1>
              <p className="text-gray-600 mt-1">Manage your business relationships and partnerships</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" className="hidden sm:flex items-center space-x-2 hover:bg-gray-50">
                <Download className="h-4 w-4" />
                <span>Export</span>
              </Button>
              <Button
                onClick={handleAddCompany}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Company
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Companies</p>
                      <p className="text-2xl font-bold text-gray-900">{companies.length}</p>
                    </div>
                    <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <span className="text-sm text-green-600 font-medium">{activeCompanies} active</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-gray-900">{formatRevenue(totalRevenue)}</p>
                    </div>
                    <div className="h-12 w-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <span className="text-sm text-gray-600">Combined portfolio</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Employees</p>
                      <p className="text-2xl font-bold text-gray-900">{totalEmployees.toLocaleString()}</p>
                    </div>
                    <div className="h-12 w-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <span className="text-sm text-gray-600">Across all companies</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search companies by name or industry..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-48 border-gray-200 focus:border-blue-500">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={industryFilter} onValueChange={setIndustryFilter}>
                    <SelectTrigger className="w-full sm:w-48 border-gray-200 focus:border-blue-500">
                      <SelectValue placeholder="Industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Industries</SelectItem>
                      {uniqueIndustries.map(industry => (
                        <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Companies Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="border-b border-gray-100 bg-white/80">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <span className="text-xl font-semibold text-gray-900">Companies</span>
                    <span className="text-sm text-gray-500 ml-2">({filteredCompanies.length} results)</span>
                  </div>
                </CardTitle>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {filteredCompanies.length} of {companies.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/80">
                      <th className="text-left p-6 font-semibold text-gray-900">
                        <button
                          onClick={() => handleSort('name')}
                          className="flex items-center space-x-2 hover:text-blue-600 transition-colors group"
                        >
                          <span>Company</span>
                          <ArrowUpDown className="h-4 w-4 opacity-50 group-hover:opacity-100" />
                        </button>
                      </th>
                      <th className="text-left p-6 font-semibold text-gray-900">
                        <button
                          onClick={() => handleSort('industry')}
                          className="flex items-center space-x-2 hover:text-blue-600 transition-colors group"
                        >
                          <span>Industry</span>
                          <ArrowUpDown className="h-4 w-4 opacity-50 group-hover:opacity-100" />
                        </button>
                      </th>
                      <th className="text-left p-6 font-semibold text-gray-900">
                        <button
                          onClick={() => handleSort('revenue')}
                          className="flex items-center space-x-2 hover:text-blue-600 transition-colors group"
                        >
                          <span>Revenue</span>
                          <ArrowUpDown className="h-4 w-4 opacity-50 group-hover:opacity-100" />
                        </button>
                      </th>
                      <th className="text-left p-6 font-semibold text-gray-900">
                        <button
                          onClick={() => handleSort('employee_count')}
                          className="flex items-center space-x-2 hover:text-blue-600 transition-colors group"
                        >
                          <span>Employees</span>
                          <ArrowUpDown className="h-4 w-4 opacity-50 group-hover:opacity-100" />
                        </button>
                      </th>
                      <th className="text-left p-6 font-semibold text-gray-900">Contact</th>
                      <th className="text-left p-6 font-semibold text-gray-900">Status</th>
                      <th className="text-center p-6 font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredCompanies.map((company, index) => (
                      <motion.tr
                        key={company.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-blue-50/50 transition-colors group"
                      >
                        <td className="p-6">
                          <div className="flex items-center space-x-4">
                            <div className="text-2xl bg-gray-100 rounded-lg p-2">
                              {getIndustryIcon(company.industry)}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                {company.name}
                              </h3>
                              {company.website && (
                                <a
                                  href={company.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1 mt-1"
                                >
                                  <Globe className="h-3 w-3" />
                                  <span>Visit Website</span>
                                </a>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-6">
                          <Badge variant="outline" className="border-gray-200 bg-gray-50">
                            {company.industry || 'N/A'}
                          </Badge>
                        </td>
                        <td className="p-6">
                          <span className="font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm">
                            {formatRevenue(company.revenue)}
                          </span>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-700 font-medium">
                              {(company.employee_count || 0).toLocaleString()}
                            </span>
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="space-y-2">
                            {company.phone && (
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <Phone className="h-3 w-3 text-gray-400" />
                                <span>{company.phone}</span>
                              </div>
                            )}
                            {company.address && (
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <MapPin className="h-3 w-3 text-gray-400" />
                                <span className="truncate max-w-32">{company.address}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-6">
                          <Badge className={`${getStatusColor(company.status)} border font-medium`}>
                            <Activity className="h-3 w-3 mr-1" />
                            {company.status}
                          </Badge>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center justify-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => handleEditCompany(company)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Company
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setDeleteCompanyId(company.id)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash className="h-4 w-4 mr-2" />
                                  Delete Company
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
                {filteredCompanies.length === 0 && (
                  <div className="text-center py-16">
                    <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Building2 className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600 text-lg font-medium">No companies found</p>
                    <p className="text-sm text-gray-400 mt-1">Try adjusting your search criteria or add a new company</p>
                    <Button 
                      onClick={handleAddCompany}
                      className="mt-4 bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Company
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteCompanyId !== null} onOpenChange={(open) => !open && setDeleteCompanyId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Company</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this company? This action cannot be undone and will permanently remove all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteCompanyId(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteCompanyId && handleDeleteCompany(deleteCompanyId)}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Company
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
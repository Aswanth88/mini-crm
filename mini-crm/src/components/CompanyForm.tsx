'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Building2, Save, X, DollarSign, Users, Globe, Phone, MapPin, FileText, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

const industries = [
  'Technology',
  'Healthcare',
  'Finance',
  'Manufacturing',
  'Energy',
  'Education',
  'Retail',
  'Real Estate',
  'Transportation',
  'Media',
  'Telecommunications',
  'Agriculture',
  'Construction',
  'Automotive',
  'Pharmaceuticals',
  'Other'
];

interface CompanyFormProps {
  company?: any;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export default function CompanyForm({ company, onSubmit, onCancel }: CompanyFormProps) {
  const [formData, setFormData] = useState({
    name: company?.name || '',
    industry: company?.industry || '',
    website: company?.website || '',
    revenue: company?.revenue?.toString() || '',
    employee_count: company?.employee_count?.toString() || '',
    phone: company?.phone || '',
    address: company?.address || '',
    description: company?.description || '',
    status: company?.status || 'active'
  });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Company name is required';
    }
    
    if (!formData.industry) {
      newErrors.industry = 'Industry is required';
    }
    
    if (formData.website && !isValidUrl(formData.website)) {
      newErrors.website = 'Please enter a valid URL';
    }
    
    if (formData.revenue && (isNaN(Number(formData.revenue)) || Number(formData.revenue) < 0)) {
      newErrors.revenue = 'Please enter a valid revenue amount';
    }
    
    if (formData.employee_count && (isNaN(Number(formData.employee_count)) || Number(formData.employee_count) < 0)) {
      newErrors.employee_count = 'Please enter a valid number of employees';
    }
    
    if (formData.phone && !isValidPhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const isValidPhone = (phone: string) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData = {
        ...formData,
        revenue: formData.revenue ? parseFloat(formData.revenue) : 0,
        employee_count: formData.employee_count ? parseInt(formData.employee_count) : 0,
        website: formData.website && !formData.website.startsWith('http') 
          ? `https://${formData.website}` 
          : formData.website
      };
      
      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="shadow-xl border-0">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardTitle className="flex items-center space-x-2 text-xl">
            <Building2 className="h-6 w-6" />
            <span>{company ? 'Edit Company' : 'Add New Company'}</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-8">
          <form onSubmit={handleSubmit}>
            <div className="space-y-8">
              {/* Basic Information */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                      Company Name *
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter company name"
                      className={`transition-all duration-200 ${
                        errors.name ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'
                      }`}
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm">{errors.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="industry" className="text-sm font-medium text-gray-700">
                      Industry *
                    </Label>
                    <Select 
                      value={formData.industry} 
                      onValueChange={(value) => handleInputChange('industry', value)}
                    >
                      <SelectTrigger className={`transition-all duration-200 ${
                        errors.industry ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'
                      }`}>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {industries.map(industry => (
                          <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.industry && (
                      <p className="text-red-500 text-sm">{errors.industry}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website" className="text-sm font-medium text-gray-700 flex items-center space-x-1">
                      <Globe className="h-4 w-4" />
                      <span>Website</span>
                    </Label>
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      placeholder="https://example.com"
                      className={`transition-all duration-200 ${
                        errors.website ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'
                      }`}
                    />
                    {errors.website && (
                      <p className="text-red-500 text-sm">{errors.website}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                      Status
                    </Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(value) => handleInputChange('status', value)}
                    >
                      <SelectTrigger className="focus:border-blue-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>Active</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="inactive">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span>Inactive</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Financial Information */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Financial Information</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="revenue" className="text-sm font-medium text-gray-700 flex items-center space-x-1">
                      <DollarSign className="h-4 w-4" />
                      <span>Annual Revenue (USD)</span>
                    </Label>
                    <Input
                      id="revenue"
                      type="number"
                      value={formData.revenue}
                      onChange={(e) => handleInputChange('revenue', e.target.value)}
                      placeholder="Enter annual revenue"
                      min="0"
                      className={`transition-all duration-200 ${
                        errors.revenue ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'
                      }`}
                    />
                    {errors.revenue && (
                      <p className="text-red-500 text-sm">{errors.revenue}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="employee_count" className="text-sm font-medium text-gray-700 flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>Number of Employees</span>
                    </Label>
                    <Input
                      id="employee_count"
                      type="number"
                      value={formData.employee_count}
                      onChange={(e) => handleInputChange('employee_count', e.target.value)}
                      placeholder="Enter number of employees"
                      min="0"
                      className={`transition-all duration-200 ${
                        errors.employee_count ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'
                      }`}
                    />
                    {errors.employee_count && (
                      <p className="text-red-500 text-sm">{errors.employee_count}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
                  <Phone className="h-5 w-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700 flex items-center space-x-1">
                      <Phone className="h-4 w-4" />
                      <span>Phone Number</span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+1-555-0123"
                      className={`transition-all duration-200 ${
                        errors.phone ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'
                      }`}
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm">{errors.phone}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-sm font-medium text-gray-700 flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>Address</span>
                    </Label>
                    <Input
                      id="address"
                      type="text"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Enter company address"
                      className="transition-all duration-200 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
                  <FileText className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Enter company description..."
                    rows={4}
                    className="transition-all duration-200 focus:border-blue-500 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-8 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="px-6 py-2 border-gray-300 hover:bg-gray-50"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {company ? 'Update Company' : 'Add Company'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
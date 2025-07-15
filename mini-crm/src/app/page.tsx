'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AddLeadForm from '@/components/AddLeadForm';
import { 
  BarChart, 
  Workflow, 
  FileText, 
  MessageSquare, 
  Sparkles, 
  User, 
  Bell, 
  Settings, 
  Search, 
  ChevronDown, 
  Zap, 
  Plus,
  Upload,
  TrendingUp,
  Users,
  Calendar,
  Target,
  Activity,
  ArrowRight,
  Clock,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import AdvancedDashboard from '@/components/AdvancedDashboard';
import WorkflowBuilder from '@/components/WorkflowBuilder';
import OCRUpload from '@/components/OCRUpload';
import AIChat from '@/components/AIChat';
import { useCRMStore } from '@/store/crmStore';

export default function Home() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showWorkflows, setShowWorkflows] = useState(false);
  const [showOCR, setShowOCR] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const {fetchLeads, leads, analytics } = useCRMStore();

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchLeads();
      setIsLoading(false);
    };
    loadData();
  }, [fetchLeads]);

  // Calculate real-time stats based on actual data
  const getChangePercentage = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? '+100%' : '0%';
    const change = ((current - previous) / previous) * 100;
    return change > 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
  };

  const quickStats = [
    { 
      label: 'Total Leads', 
      value: analytics.totalLeads.toString(), 
      change: isLoading ? '...' : analytics.totalLeads > 0 ? `${analytics.totalLeads} leads` : 'No leads yet', 
      icon: Users, 
      color: 'from-blue-500 to-blue-600' 
    },
    { 
      label: 'Conversion Rate', 
      value: `${analytics.conversionRate}%`, 
      change: isLoading ? '...' : analytics.totalLeads > 0 ? 'Based on closed leads' : 'Add leads to track', 
      icon: TrendingUp, 
      color: 'from-green-500 to-green-600' 
    },
    { 
      label: 'Active Chats', 
      value: analytics.activeChats.toString(), 
      change: isLoading ? '...' : analytics.activeChats > 0 ? 'Recent interactions' : 'No recent activity', 
      icon: MessageSquare, 
      color: 'from-purple-500 to-purple-600' 
    },
    { 
      label: 'AI Accuracy', 
      value: `${analytics.aiAccuracy}%`, 
      change: isLoading ? '...' : analytics.totalLeads > 0 ? 'Lead qualification rate' : 'No data available', 
      icon: BarChart, 
      color: 'from-orange-500 to-orange-600' 
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Enhanced Professional Header */}
      <motion.header 
        className="relative bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 text-white shadow-2xl overflow-hidden"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-500/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-violet-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        {/* Navigation Bar */}
        <nav className="relative z-10 px-6 py-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center space-x-6">
            <motion.div 
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  CRM Pro
                </h1>
                <p className="text-xs text-blue-200">AI-Powered</p>
              </div>
            </motion.div>
          </div>
        </nav>

        {/* Hero Section with Action Buttons */}
        <div className="relative z-10 px-6 py-12">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-center mb-8"
            >
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full px-4 py-2 mb-6 border border-white/20">
                <Zap className="w-4 h-4 text-yellow-300" />
                <span className="text-sm font-medium text-blue-200">AI-Powered CRM Platform</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent leading-tight">
                Advanced Mini-CRM
              </h1>
              
              <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-2xl mx-auto leading-relaxed">
                Professional CRM with AI-powered automation and intelligent insights
              </p>
            </motion.div>
            <motion.div 
              className="flex flex-wrap justify-center gap-4 mb-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              {/* Action Buttons */}
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <AddLeadForm />
                <motion.button
                  onClick={() => setShowOCR(true)}
                  className="group flex items-center space-x-3 bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Upload className="w-5 h-5" />
                  <span className="font-semibold">Document Upload</span>
                </motion.button>

                <motion.button
                  onClick={() => setShowWorkflows(true)}
                  className="group flex items-center space-x-3 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Workflow className="w-5 h-5" />
                  <span className="font-semibold">Workflows</span>
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Decorative Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg className="w-full h-4" viewBox="0 0 1440 74" fill="none">
            <path d="M0,32L48,37.3C96,43,192,53,288,58.7C384,64,480,64,576,58.7C672,53,768,43,864,42.7C960,43,1056,53,1152,58.7C1248,64,1344,64,1392,64L1440,64L1440,74L1392,74C1344,74,1248,74,1152,74C1056,74,960,74,864,74C768,74,672,74,576,74C480,74,384,74,288,74C192,74,96,74,48,74L0,74Z" fill="url(#gradient)" />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(59, 130, 246, 0.1)" />
                <stop offset="50%" stopColor="rgba(99, 102, 241, 0.1)" />
                <stop offset="100%" stopColor="rgba(168, 85, 247, 0.1)" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Quick Stats */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            {quickStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300"
                whileHover={{ scale: 1.02, translateY: -2 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {isLoading ? (
                        <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                      ) : (
                        stat.value
                      )}
                    </div>
                    <p className="text-xs text-gray-500 font-medium">{stat.change}</p>
                  </div>
                  <div className={`bg-gradient-to-r ${stat.color} p-3 rounded-lg shadow-sm`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* No Data State */}
          {!isLoading && leads.length === 0 && (
            <motion.div 
              className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 text-center mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Leads Yet</h3>
                <p className="text-gray-600 mb-4">
                  Start building your pipeline by adding your first lead or importing existing data.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <AddLeadForm />
                  <Button 
                    onClick={() => setShowOCR(true)}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Import Data
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Dashboard Section */}
          <motion.div 
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <BarChart className="w-5 h-5 text-blue-600" />
                    Dashboard Overview
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {isLoading ? 'Loading data...' : `${analytics.totalLeads} leads in your pipeline`}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${isLoading ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                  <span className="text-sm text-gray-600">
                    {isLoading ? 'Loading...' : 'Live Data'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <AdvancedDashboard onLeadClick={() => setShowChat(true)} />
            </div>
          </motion.div>

          {/* AI Features Section */}
          <motion.div 
            className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
          >
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                AI-Powered Features
              </h2>
              <p className="text-sm text-gray-600 mt-1">Intelligent automation at your fingertips</p>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Activity className="w-4 h-4 text-emerald-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Lead Management</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Lead analysis and scoring</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Automated follow-up suggestions</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Communication</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Email template generation</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Conversation summarization</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-orange-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Analytics</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Pipeline insights</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Performance tracking</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
      
      {/* Modal Overlays */}
      {showWorkflows && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div 
            className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold">Workflow Builder</h2>
              <button 
                onClick={() => setShowWorkflows(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <WorkflowBuilder />
            </div>
          </motion.div>
        </div>
      )}

      {showOCR && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div 
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold">Document Upload & OCR</h2>
              <button 
                onClick={() => setShowOCR(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <OCRUpload />
            </div>
          </motion.div>
        </div>
      )}

      {showChat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div 
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold">AI Assistant</h2>
              <button 
                onClick={() => setShowChat(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <AIChat />
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
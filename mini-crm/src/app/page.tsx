'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Workflow, FileText, MessageSquare } from 'lucide-react';
import AdvancedDashboard from '@/components/AdvancedDashboard';
import WorkflowBuilder from '@/components/WorkflowBuilder';
import OCRUpload from '@/components/OCRUpload';
import AIChat from '@/components/AIChat';

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Advanced Mini-CRM
          </h1>
          <p className="text-gray-600">
            Professional CRM with AI-powered automation and intelligent insights
          </p>
        </motion.div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-fit">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="workflow" className="flex items-center gap-2">
              <Workflow className="h-4 w-4" />
              Workflows
            </TabsTrigger>
            <TabsTrigger value="ocr" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              OCR Upload
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              AI Chat
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <AdvancedDashboard onLeadClick={() => setActiveTab('chat')} />
          </TabsContent>

          <TabsContent value="workflow">
            <WorkflowBuilder />
          </TabsContent>

          <TabsContent value="ocr">
            <OCRUpload />
          </TabsContent>

          <TabsContent value="chat">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <AIChat />
              </div>
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">AI Capabilities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li>• Lead analysis and scoring</li>
                      <li>• Automated follow-up suggestions</li>
                      <li>• Email template generation</li>
                      <li>• Meeting scheduling</li>
                      <li>• Pipeline insights</li>
                      <li>• Conversation summarization</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
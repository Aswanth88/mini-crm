'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Check, X } from 'lucide-react';
import { useCRMStore } from '@/store/crmStore';

export default function OCRUpload() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { addLead } = useCRMStore();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setResult(null);

  };

  const handleAcceptResult = () => {
    if (result) {
      addLead({
        name: result.name,
        email: result.email,
        phone: result.phone,
        status: 'new',
        source: 'OCR Upload',
      });
      setResult(null);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Document OCR Processing
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium mb-2">Upload Business Card or Document</p>
            <p className="text-gray-600 mb-4">Drag and drop or click to select</p>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button variant="outline" className="cursor-pointer">
                Select File
              </Button>
            </label>
          </div>

          {/* Processing State */}
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-8"
            >
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-lg font-medium">Processing document...</p>
              <p className="text-gray-600">Extracting contact information</p>
            </motion.div>
          )}

          {/* Results */}
          {result && !isProcessing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">Extracted Information</h3>
                <div className="space-y-2">
                  <p><strong>Name:</strong> {result.name}</p>
                  <p><strong>Email:</strong> {result.email}</p>
                  <p><strong>Phone:</strong> {result.phone}</p>
                  <p><strong>Confidence:</strong> {(result.confidence * 100).toFixed(1)}%</p>
                </div>
              </div>

              <div className="flex gap-4">
                <Button onClick={handleAcceptResult} className="flex-1">
                  <Check className="h-4 w-4 mr-2" />
                  Accept & Add to CRM
                </Button>
                <Button variant="outline" onClick={() => setResult(null)} className="flex-1">
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
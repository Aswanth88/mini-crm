'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Check, X, AlertCircle, Eye, Settings, RefreshCw } from 'lucide-react';
import { useCRMStore } from '@/store/crmStore';
import { extractLeadFromFile, createLead } from '@/lib/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

export default function OCRUpload() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [selectedLeadIndex, setSelectedLeadIndex] = useState(0);
  const [showRawText, setShowRawText] = useState(false);
  const [showDebugLogs, setShowDebugLogs] = useState(false);
  const [logs, setLogs] = useState([]);
  const { addLead, fetchLeads, updateAnalytics } = useCRMStore();

  const addLog = (message) => {
    console.log(message);
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `${timestamp}: ${message}`]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const testAPIConnection = async () => {
    addLog('Testing API connection...');
    try {
      const response = await fetch('http://localhost:8000/health');
      addLog(`Health check status: ${response.status}`);
      const data = await response.json();
      addLog(`Health check response: ${JSON.stringify(data)}`);
      return response.ok;
    } catch (error) {
      addLog(`Health check error: ${error.message}`);
      return false;
    }
  };

  const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setResult(null);
    setError(null);
    clearLogs();

    const allResults = [];
    for (let file of files) {
      try {
        if (showDebugLogs) addLog(`Processing file: ${file.name}`);

        const ocrResult = await extractLeadFromFile(file);

        if (!ocrResult.success || !ocrResult.leads?.length) {
          throw new Error(`No contacts found in "${file.name}"`);
        }

        allResults.push({
          fileName: file.name,
          ...ocrResult,
        });

        if (showDebugLogs) addLog(`OCR success for: ${file.name}`);

      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        addLog(`Error with ${file.name}: ${message}`);
        toast.error(`Failed to process ${file.name}: ${message}`);
      }
    }

    if (allResults.length > 0) {
      setResult(allResults[0]); // show the first result by default
      setSelectedLeadIndex(0);
      toast.success(`${allResults.length} file(s) processed successfully!`);
    } else {
      setError('No valid contacts found in uploaded files.');
    }

    setIsProcessing(false);
  };


  const handleAcceptResult = async () => {
    if (!result || !result.leads[selectedLeadIndex]) return;

    const selectedLead = result.leads[selectedLeadIndex];
    setIsSaving(true);
    setError(null);

    if (showDebugLogs) addLog(`Accepting lead: ${selectedLead.name}`);

    try {
      // Prepare lead data for database
      const leadData = {
        name: selectedLead.name || 'Unknown',
        email: selectedLead.email || '',
        phone: selectedLead.phone || '',
        status: 'new',
        source: 'document',
        company: selectedLead.company || null,
        title: selectedLead.title || null,
        address: selectedLead.address || null,
        industry: selectedLead.industry || null,
        website: selectedLead.website || null,
        additional_info: selectedLead.additional_info || null,
        confidence: selectedLead.confidence || 0
      };

      if (showDebugLogs) {
        addLog(`Lead data prepared: ${JSON.stringify(leadData)}`);
      }

      // Create lead in database
      const createdLead = await createLead(leadData);

      if (showDebugLogs) {
        addLog(`Lead created in database: ${JSON.stringify(createdLead)}`);
      }

      // Update local state - use the returned lead data from database
      addLead(createdLead);
      updateAnalytics();

      // Optionally refresh leads from database to ensure consistency
      await fetchLeads();

      toast.success(`Lead "${selectedLead.name}" has been added to CRM successfully!`);

      // Reset form
      setResult(null);
      setSelectedLeadIndex(0);
      setError(null);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save lead';
      setError(errorMessage);
      if (showDebugLogs) addLog(`Error saving lead: ${errorMessage}`);
      toast.error(`Failed to save lead: ${errorMessage}`);
      console.error('Error saving lead:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReject = () => {
    if (showDebugLogs) addLog('Lead rejected by user');
    setResult(null);
    setSelectedLeadIndex(0);
    setError(null);
    toast.info('Lead rejected');
  };

  const selectedLead = result?.leads[selectedLeadIndex];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Document OCR Processing
        </CardTitle>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDebugLogs(!showDebugLogs)}
          >
            <Settings className="h-4 w-4 mr-2" />
            {showDebugLogs ? 'Hide' : 'Show'} Debug
          </Button>
          {showDebugLogs && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={testAPIConnection}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Test API
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearLogs}
              >
                Clear Logs
              </Button>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium mb-2">Upload Business Card or Document</p>
            <p className="text-gray-600 mb-4">Supports: JPG, PNG, GIF, BMP, PDF (max 10MB)</p>
            <input
              type="file"
              accept="image/jpeg,image/png,image/jpg,image/gif,image/bmp,application/pdf"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
              disabled={isProcessing}
            />
            <Button
              variant="outline"
              disabled={isProcessing}
              onClick={() => document.getElementById('file-upload').click()}
            >
              Select File
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {showDebugLogs && (
            <div className="bg-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto">
              <h3 className="font-semibold mb-2">Debug Logs:</h3>
              {logs.length === 0 ? (
                <p className="text-gray-500">No logs yet...</p>
              ) : (
                <div className="space-y-1">
                  {logs.map((log, index) => (
                    <div key={index} className="text-sm font-mono bg-white p-2 rounded">
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {isProcessing && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-lg font-medium">Processing document...</p>
              <p className="text-gray-600">Extracting contact information using AI</p>
            </motion.div>
          )}

          {result && !isProcessing && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {result.leads.length > 1 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">Multiple contacts found ({result.leads.length})</h3>
                  <div className="flex gap-2 flex-wrap">
                    {result.leads.map((lead, index) => (
                      <Button
                        key={index}
                        variant={selectedLeadIndex === index ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedLeadIndex(index)}
                      >
                        {lead.name || `Contact ${index + 1}`}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {selectedLead && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 mb-3">Extracted Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedLead.name && <Info label="Name" value={selectedLead.name} />}
                    {selectedLead.email && <Info label="Email" value={selectedLead.email} />}
                    {selectedLead.phone && <Info label="Phone" value={selectedLead.phone} />}
                    {selectedLead.company && <Info label="Company" value={selectedLead.company} />}
                    {selectedLead.title && <Info label="Title" value={selectedLead.title} />}
                    {selectedLead.website && <Info label="Website" value={selectedLead.website} />}
                    {selectedLead.address && (
                      <div className="md:col-span-2">
                        <Info label="Address" value={selectedLead.address} />
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <strong className="text-gray-700">Confidence:</strong>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${selectedLead.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {(selectedLead.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    Processing time: {result.processing_time.toFixed(2)}s
                  </div>
                </div>
              )}

              {result.raw_text && (
                <div className="border rounded-lg p-4">
                  <Button variant="ghost" size="sm" onClick={() => setShowRawText(!showRawText)} className="mb-2">
                    <Eye className="h-4 w-4 mr-2" />
                    {showRawText ? 'Hide' : 'Show'} Raw Extracted Text
                  </Button>
                  {showRawText && (
                    <div className="bg-gray-50 p-3 rounded text-sm max-h-40 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-xs">{result.raw_text}</pre>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-4">
                <Button
                  onClick={handleAcceptResult}
                  className="flex-1"
                  disabled={isSaving}
                >
                  <Check className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Accept & Add to CRM'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleReject}
                  className="flex-1"
                  disabled={isSaving}
                >
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

function Info({ label, value }) {
  return (
    <div>
      <strong className="text-gray-700">{label}:</strong>
      <p className="text-gray-900">{value}</p>
    </div>
  );
}
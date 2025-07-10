'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Bot, User, Send, Loader2, Sparkles, MessageSquare, Brain, Zap, TrendingUp, Target, Clock, Star, BarChart3, Calendar, FileText, Search, AlertCircle } from 'lucide-react';
import { useAI } from '@/providers/AIProvider';
import { useCRMStore } from '@/store/crmStore';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
  intent?: string;
  confidence?: number;
  actions?: any[];
}

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { processQuery } = useAI();
  const { selectedLead } = useCRMStore();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const quickActions = [
    { icon: TrendingUp, text: "Lead details", color: "bg-gradient-to-r from-emerald-500 to-teal-600" },
    { icon: Target, text: "Follow-up request", color: "bg-gradient-to-r from-blue-500 to-cyan-600" },
    { icon: Brain, text: "Analytics request", color: "bg-gradient-to-r from-purple-500 to-pink-600" },
    { icon: Zap, text: "Schedule meeting", color: "bg-gradient-to-r from-orange-500 to-red-600" }
  ];

  const smallQuickActions = [
    { icon: TrendingUp, text: "Details", color: "bg-gradient-to-r from-emerald-500 to-teal-600" },
    { icon: Target, text: "Follow-up", color: "bg-gradient-to-r from-blue-500 to-cyan-600" },
    { icon: Brain, text: "Analytics", color: "bg-gradient-to-r from-purple-500 to-pink-600" },
    { icon: Zap, text: "Meeting", color: "bg-gradient-to-r from-orange-500 to-red-600" },
    { icon: User, text: "Status update", color: "bg-gradient-to-r from-indigo-500 to-violet-600" }
  ];

  // Intent styling configuration
  const getIntentStyle = (intent: string) => {
    const intentStyles = {
      'lead_details': { 
        color: 'bg-gradient-to-r from-emerald-500 to-teal-600', 
        icon: TrendingUp 
      },

      'lead_details_request': { 
        color: 'bg-gradient-to-r from-emerald-500 to-teal-600', 
        icon: TrendingUp 
      },

      'follow_up': { 
        color: 'bg-gradient-to-r from-blue-500 to-cyan-600', 
        icon: Target 
      },

      'follow_up_request': { 
        color: 'bg-gradient-to-r from-blue-500 to-cyan-600', 
        icon: Target 
      },

      'analytics': { 
        color: 'bg-gradient-to-r from-purple-500 to-pink-600', 
        icon: BarChart3 
      },

      'analytics_request': { 
        color: 'bg-gradient-to-r from-purple-500 to-pink-600', 
        icon: BarChart3 
      },
      
      'schedule_meeting': { 
        color: 'bg-gradient-to-r from-orange-500 to-red-600', 
        icon: Calendar 
      },
      'status_update': { 
        color: 'bg-gradient-to-r from-indigo-500 to-violet-600', 
        icon: FileText 
      },
      'search': { 
        color: 'bg-gradient-to-r from-rose-500 to-pink-600', 
        icon: Search 
      },
      'general': { 
        color: 'bg-gradient-to-r from-slate-500 to-gray-600', 
        icon: Brain 
      },
      'error': { 
        color: 'bg-gradient-to-r from-red-500 to-rose-600', 
        icon: AlertCircle 
      }
    };

    // Default to general if intent not found
    return intentStyles[intent as keyof typeof intentStyles] || intentStyles.general;
  };

  const handleQuickAction = async (action: string) => {
    if (isLoading) return;
    
    setInputValue(action);
    
    // Auto-send the message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: action,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setIsTyping(true);

    try {
      const leadData = selectedLead 
        ? {
            id: selectedLead.id,
            name: selectedLead.name,
            email: selectedLead.email,
            phone: selectedLead.phone,
            source: selectedLead.source,
          }
        : null;

      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Simulate AI thinking delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));

      const aiResponse = await processQuery(action, leadData, conversationHistory);
      
      setIsTyping(false);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: aiResponse.response,
        timestamp: new Date(),
        intent: aiResponse.intent,
        confidence: aiResponse.confidence,
        actions: aiResponse.actions,
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI processing failed:', error);
      setIsTyping(false);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: 'I apologize, but I encountered an issue processing your request. Please try again, and I\'ll do my best to assist you.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setInputValue('');
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      const leadData = selectedLead 
        ? {
            id: selectedLead.id,
            name: selectedLead.name,
            email: selectedLead.email,
            phone: selectedLead.phone,
            source: selectedLead.source,
          }
        : null;

      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Simulate AI thinking delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));

      const aiResponse = await processQuery(inputValue, leadData, conversationHistory);
      
      setIsTyping(false);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: aiResponse.response,
        timestamp: new Date(),
        intent: aiResponse.intent,
        confidence: aiResponse.confidence,
        actions: aiResponse.actions,
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI processing failed:', error);
      setIsTyping(false);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: 'I apologize, but I encountered an issue processing your request. Please try again, and I\'ll do my best to assist you.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-[700px] flex flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50/30 rounded-2xl shadow-2xl border border-slate-200/50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  AI Sales Assistant
                </h2>
                <p className="text-sm text-slate-300">Intelligent CRM Companion</p>
              </div>
            </div>
            {selectedLead && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2"
              >
                <Badge className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0 shadow-lg">
                  <User className="h-3 w-3 mr-1" />
                  {selectedLead.name}
                </Badge>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Warning for no selected lead */}
      {!selectedLead && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-6 mt-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl"
        >
          <div className="flex items-center gap-2 text-amber-700">
            <Star className="h-4 w-4" />
            <span className="text-sm font-medium">Select a lead from the Dashboard for personalized assistance</span>
          </div>
        </motion.div>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="relative mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto flex items-center justify-center shadow-xl">
                <MessageSquare className="h-10 w-10 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                <Sparkles className="h-3 w-3 text-yellow-900" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Welcome to AI Sales Assistant</h3>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              Your intelligent companion for lead management, sales insights, and automated follow-ups. 
              Start by asking a question or selecting a quick action below.
            </p>
            
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
              {quickActions.map((action, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleQuickAction(action.text)}
                  className={`${action.color} text-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group`}
                >
                  <action.icon className="h-6 w-6 mx-auto mb-2 group-hover:rotate-12 transition-transform" />
                  <span className="text-sm font-medium">{action.text}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] group ${message.role === 'user' ? 'ml-12' : 'mr-12'}`}>
                <div
                  className={`relative p-4 rounded-2xl shadow-lg ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white'
                      : 'bg-white border border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === 'user' 
                        ? 'bg-white/20' 
                        : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                    }`}>
                      {message.role === 'user' ? (
                        <User className="h-4 w-4 text-white" />
                      ) : (
                        <Bot className="h-4 w-4 text-white" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-medium ${
                          message.role === 'user' ? 'text-white/80' : 'text-slate-500'
                        }`}>
                          {message.role === 'user' ? 'You' : 'AI Assistant'}
                        </span>
                        <span className={`text-xs ${
                          message.role === 'user' ? 'text-white/60' : 'text-slate-400'
                        }`}>
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                      
                      <p className="text-sm leading-relaxed whitespace-pre-line">
                        {message.content}
                      </p>
                      
                      {message.intent && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="mt-3 flex items-center gap-2"
                        >
                          {(() => {
                            const intentStyle = getIntentStyle(message.intent);
                            const IconComponent = intentStyle.icon;
                            return (
                              <div className={`${intentStyle.color} text-white px-3 py-1 rounded-lg shadow-md text-xs font-medium flex items-center gap-1`}>
                                <IconComponent className="h-3 w-3" />
                                {message.intent.replace('_', ' ')}
                              </div>
                            );
                          })()}
                          {message.confidence && (
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-xs text-slate-500">
                                {Math.round(message.confidence * 100)}% confident
                              </span>
                            </div>
                          )}
                        </motion.div>
                      )}
                      
                      {message.actions && message.actions.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-3 flex flex-wrap gap-2"
                        >
                          {message.actions.map((action, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              className="text-xs bg-gradient-to-r from-slate-50 to-white border-slate-200 hover:from-blue-50 hover:to-indigo-50 hover:border-blue-200 transition-all duration-200"
                              onClick={() => console.log('Action:', action)}
                            >
                              <Zap className="h-3 w-3 mr-1" />
                              {action.type.replace('_', ' ')}
                            </Button>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Small Quick Actions - Show when there are messages */}
        {messages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap gap-2 justify-center py-4"
          >
            {smallQuickActions.map((action, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleQuickAction(action.text)}
                disabled={isLoading}
                className={`${action.color} text-white px-3 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-xs font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <action.icon className="h-3 w-3" />
                {action.text}
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* Typing Indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex justify-start"
          >
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-lg mr-12">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                  <span className="text-sm text-slate-500">AI is analyzing...</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white border-t border-slate-200">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about lead insights, follow-up strategies, or sales analytics..."
              disabled={isLoading}
              className="pr-12 h-12 bg-slate-50 border-slate-200 rounded-xl focus:bg-white focus:border-blue-400 transition-all duration-200 text-sm placeholder:text-slate-400"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="h-12 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 group"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
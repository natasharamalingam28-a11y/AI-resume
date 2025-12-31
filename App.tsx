
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GeminiService } from './services/geminiService';
import { ResumeAnalysis, ChatMessage } from './types';
import { AnalysisDashboard } from './components/AnalysisDashboard';
import { 
  FileText, Upload, Send, MessageSquare, 
  Search, Loader2, Sparkles, X, ChevronRight,
  RefreshCcw, Info, Zap
} from 'lucide-react';

const gemini = new GeminiService();

const App: React.FC = () => {
  const [resumeInput, setResumeInput] = useState<string>('');
  const [resumeFile, setResumeFile] = useState<{ data: string; mimeType: string } | null>(null);
  const [jobDescription, setJobDescription] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [quickTip, setQuickTip] = useState<string>('');
  const [marketInsight, setMarketInsight] = useState<{ text: string; sources: any[] } | null>(null);
  const [isInsightLoading, setIsInsightLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'input' | 'analysis'>('input');
  const [showChat, setShowChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gemini.getQuickTip().then(setQuickTip);
  }, []);

  useEffect(() => {
    if (showChat) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, showChat]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const base64Data = base64.split(',')[1];
        setResumeFile({ data: base64Data, mimeType: file.type });
        setResumeInput(`[File uploaded: ${file.name}]`);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!resumeInput && !resumeFile) return;
    setIsAnalyzing(true);
    setAnalysis(null);
    try {
      const content = resumeFile || resumeInput;
      const result = await gemini.analyzeResume(content, jobDescription);
      setAnalysis(result);
      setActiveTab('analysis');
      
      // Fetch market insights based on analysis
      setIsInsightLoading(true);
      const insight = await gemini.getMarketInsights(result.candidateSummary.industry, result.candidateSummary.primarySkills[0]);
      setMarketInsight(insight);
      setIsInsightLoading(false);

    } catch (err) {
      console.error(err);
      alert("Analysis failed. Please check your inputs.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleChatSend = async () => {
    if (!chatInput.trim()) return;
    const userMsg: ChatMessage = { role: 'user', parts: [{ text: chatInput }] };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await gemini.getChatResponse(chatHistory, chatInput);
      setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: response || '' }] }]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <Sparkles size={20} />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">AI Resume Agent</h1>
          </div>
          
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab('input')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'input' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Analyze
            </button>
            <button 
              onClick={() => setActiveTab('analysis')}
              disabled={!analysis}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${!analysis ? 'opacity-50 cursor-not-allowed' : activeTab === 'analysis' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Results
            </button>
          </nav>

          <button 
            onClick={() => setShowChat(!showChat)}
            className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full text-sm font-semibold hover:bg-indigo-100 transition-colors"
          >
            <MessageSquare size={18} />
            <span>Career Coach</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto w-full p-4 md:p-8">
        {activeTab === 'input' ? (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-extrabold text-slate-900">Let's build your dream career.</h2>
              <p className="text-slate-500">Upload your resume (PDF/Image) or paste text to get expert HR feedback instantly.</p>
            </div>

            {quickTip && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3 items-center text-amber-800 shadow-sm">
                <Info size={20} className="flex-shrink-0" />
                <p className="text-sm font-medium italic">Tip: "{quickTip}"</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Resume Side */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">1. Your Resume</label>
                  {resumeFile && (
                    <button 
                      onClick={() => { setResumeFile(null); setResumeInput(''); }}
                      className="text-xs text-rose-500 flex items-center gap-1 hover:underline"
                    >
                      <X size={12} /> Clear file
                    </button>
                  )}
                </div>
                
                <div className="relative group">
                  <textarea 
                    value={resumeInput}
                    onChange={(e) => setResumeInput(e.target.value)}
                    placeholder="Paste your resume text here..."
                    className="w-full h-80 bg-white border border-slate-200 rounded-2xl p-6 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm resize-none"
                    disabled={!!resumeFile}
                  />
                  {!resumeInput && !resumeFile && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-30">
                      <FileText size={48} className="mb-2" />
                      <p className="text-xs">Ctrl+V or type here</p>
                    </div>
                  )}
                  
                  <div className="absolute bottom-4 right-4 flex gap-2">
                    <label className="cursor-pointer bg-slate-50 hover:bg-slate-100 text-slate-600 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium transition-colors flex items-center gap-2">
                      <Upload size={16} />
                      <span>{resumeFile ? 'Change File' : 'Upload PDF/Image'}</span>
                      <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleFileUpload} />
                    </label>
                  </div>
                </div>
              </div>

              {/* Job Side */}
              <div className="space-y-4">
                <label className="text-sm font-bold text-slate-700 uppercase tracking-wide">2. Job Description (Optional)</label>
                <textarea 
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description to see how you match..."
                  className="w-full h-80 bg-white border border-slate-200 rounded-2xl p-6 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm resize-none"
                />
              </div>
            </div>

            <div className="flex justify-center pt-6">
              <button 
                onClick={handleAnalyze}
                disabled={isAnalyzing || (!resumeInput && !resumeFile)}
                className={`
                  relative overflow-hidden group flex items-center gap-3 px-12 py-4 rounded-2xl font-bold text-lg shadow-xl transition-all
                  ${isAnalyzing || (!resumeInput && !resumeFile) 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-1 active:scale-95'}
                `}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="animate-spin" size={24} />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Zap size={24} />
                    <span>Generate AI Analysis</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            {analysis && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Left Side: Dashboards */}
                <div className="lg:col-span-3 space-y-8">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                      <ChevronRight className="text-indigo-600" />
                      Comprehensive Analysis
                    </h2>
                    <button 
                      onClick={() => setActiveTab('input')}
                      className="text-indigo-600 text-sm font-semibold hover:underline flex items-center gap-1"
                    >
                      <RefreshCcw size={14} /> New Analysis
                    </button>
                  </div>
                  <AnalysisDashboard analysis={analysis} />
                </div>

                {/* Right Side: Insights & Market Data */}
                <div className="space-y-6">
                  <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm sticky top-24">
                    <div className="flex items-center gap-2 mb-4 text-emerald-600 font-bold">
                      <Search size={18} />
                      <h3>Market Insights</h3>
                    </div>
                    {isInsightLoading ? (
                      <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-2">
                        <Loader2 className="animate-spin" size={24} />
                        <p className="text-xs">Searching market data...</p>
                      </div>
                    ) : marketInsight ? (
                      <div className="space-y-4">
                        <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                          {marketInsight.text}
                        </div>
                        {marketInsight.sources.length > 0 && (
                          <div className="pt-4 border-t border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Sources Found</p>
                            <ul className="space-y-2">
                              {marketInsight.sources.map((src: any, i: number) => (
                                <li key={i}>
                                  <a 
                                    href={src.web?.uri} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="text-xs text-indigo-500 hover:underline line-clamp-1 flex items-center gap-1"
                                  >
                                    <ChevronRight size={10} /> {src.web?.title || 'External Source'}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">No market data found for this role.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Career Coach Chat */}
      {showChat && (
        <div className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-3rem)] h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-50 animate-in slide-in-from-right-8 fade-in duration-300">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-indigo-600 rounded-t-2xl text-white">
            <div className="flex items-center gap-2">
              <MessageSquare size={18} />
              <span className="font-bold">Career Coach AI</span>
            </div>
            <button onClick={() => setShowChat(false)} className="hover:bg-white/10 p-1 rounded">
              <X size={18} />
            </button>
          </div>
          
          <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {chatHistory.length === 0 && (
              <div className="text-center py-8 opacity-40">
                <Sparkles size={48} className="mx-auto mb-2" />
                <p className="text-sm font-medium">Ask me anything about your career path, interview tips, or how to improve your resume!</p>
              </div>
            )}
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none shadow-md' 
                    : 'bg-slate-100 text-slate-700 rounded-tl-none border border-slate-200'
                }`}>
                  {msg.parts[0].text}
                </div>
              </div>
            ))}
            {isChatLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 p-3 rounded-2xl rounded-tl-none animate-pulse flex gap-1">
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-75"></div>
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-150"></div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 border-t border-slate-100">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleChatSend(); }}
              className="flex gap-2"
            >
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask your career coach..."
                className="flex-grow bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              />
              <button 
                type="submit"
                disabled={isChatLoading || !chatInput.trim()}
                className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                <Send size={20} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-8 bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-xs">
          <p>© 2024 AI Resume Analyzer Agent. Powered by Gemini 3 Pro Intelligence.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;

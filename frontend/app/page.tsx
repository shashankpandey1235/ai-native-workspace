'use client';
import { useState, useEffect } from 'react';
import { Brain, Search, MessageSquare, Layers, Send, RefreshCw } from 'lucide-react';

const API_BASE = 'https://ai-native-workspace.onrender.com';

export default function WorkspaceDashboard() {
  // Application Ingestion/Chat States
  const [file, setFile] = useState<File | null>(null);
  const [topic, setTopic] = useState('');
  const [content, setContent] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [chatLog, setChatLog] = useState<{ sender: 'user' | 'ai'; text: string }[]>([]);
  
  // Graph & Structural Data Response Matrices
  const [graphData, setGraphData] = useState<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] });
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWorkspaceState = async () => {
    try {
      const res = await fetch(`${API_BASE}/workspace`);
      const data = await res.json();
      setGraphData(data.graph || { nodes: [], edges: [] });
      setInsights(data.insights || []);
    } catch (err) {
      console.error("Error communicating with memory matrix state backend:", err);
    }
  };

  useEffect(() => { 
    fetchWorkspaceState(); 
  }, []);

  const handleTriggerResearch = async () => {
    if (!topic || (!content && !file)) return;
    setLoading(true);
    try {
      if (file) {
        const formData = new FormData();
        formData.append('topic', topic);
        formData.append('file', file);

        await fetch(`${API_BASE}/research/file`, {
          method: 'POST',
          body: formData,
        });
      } else {
        await fetch(`${API_BASE}/research`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic, content }),
        });
      }
      setTopic(''); 
      setContent(''); 
      setFile(null);
      await fetchWorkspaceState();
    } catch (err) { 
      alert('Research execution failed.'); 
    }
    setLoading(false);
  };

  const handleSendChatMessage = async () => {
    if (!chatInput || !chatInput.trim()) return;
    const currentInput = chatInput;
    setChatLog(prev => [...prev, { sender: 'user', text: currentInput }]);
    setChatInput('');
    
    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentInput }),
      });
      const data = await res.json();
      setChatLog(prev => [...prev, { sender: 'ai', text: data.response }]);
    } catch (err) { 
      console.error(err); 
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <header className="border-b border-slate-800 bg-slate-950 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="w-8 h-8 text-indigo-400" />
          <h1 className="text-xl font-bold tracking-tight">AI-Native Intelligence Workspace</h1>
        </div>
        <button onClick={fetchWorkspaceState} className="p-2 hover:bg-slate-800 rounded text-slate-400">
          <RefreshCw className="w-5 h-5" />
        </button>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 overflow-hidden">
        
        <section className="p-4 border-r border-slate-800 flex flex-col gap-4 bg-slate-950/50 overflow-y-auto">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Search className="w-4 h-4" /> Workflow 1: Research Autonomous Mode
          </h2>
          <div className="space-y-3">
            <input 
              type="text" 
              placeholder="Context Research Topic (e.g. Space Propulsion)" 
              value={topic} 
              onChange={(e) => setTopic(e.target.value)} 
              className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded text-sm focus:outline-none focus:border-indigo-500" 
            />
            
            <div className="grid grid-cols-2 gap-2 text-xs mb-1">
              <button 
                type="button" 
                onClick={() => setFile(null)} 
                className={`py-1.5 rounded border font-medium transition-colors ${!file ? 'bg-indigo-950/40 border-indigo-500 text-indigo-300' : 'border-slate-800 text-slate-400 hover:text-slate-200'}`}
              >
                Raw Text Input
              </button>
              <label 
                className={`py-1.5 rounded border text-center cursor-pointer font-medium transition-colors ${file ? 'bg-indigo-950/40 border-indigo-500 text-indigo-300' : 'border-slate-800 text-slate-400 hover:text-slate-200'}`}
              >
                {file ? 'File Attached' : 'Upload PDF / Text'}
                <input 
                  type="file" 
                  accept=".pdf,.txt" 
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFile(e.target.files[0]);
                    }
                  }} 
                  className="hidden" 
                />
              </label>
            </div>

            {!file ? (
              <textarea 
                placeholder="Paste unstructured raw operational research text dump here..." 
                rows={6} 
                value={content} 
                onChange={(e) => setContent(e.target.value)} 
                className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded text-sm focus:outline-none focus:border-indigo-500 resize-none" 
              />
            ) : (
              <div className="p-6 bg-slate-900 border border-dashed border-slate-700 rounded text-center text-xs text-slate-400">
                Selected file: <span className="font-mono text-indigo-400 font-bold">{file.name}</span>
              </div>
            )}

            <button 
              onClick={handleTriggerResearch} 
              disabled={loading} 
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2 rounded text-sm transition-colors"
            >
              {loading ? 'Analyzing Content Matrix...' : 'Ingest & Extract Structured Knowledge'}
            </button>
          </div>

          <div className="mt-4 flex-1">
            <h3 className="text-xs font-bold uppercase text-slate-500 mb-2">Live Surfaced Insights Stack</h3>
            <div className="space-y-2">
              {insights.map((ins, index) => (
                <div key={index} className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">{ins.category}</span>
                    <span className="text-xs text-slate-400 font-mono">Conf: {ins.confidence}</span>
                  </div>
                  <h4 className="text-sm font-medium text-slate-200">{ins.title}</h4>
                  <p className="text-xs text-slate-400 mt-1">{ins.summary}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="p-4 border-r border-slate-800 flex flex-col overflow-y-auto">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4" /> Mandatory Knowledge Graph Structures
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Identified Entities</h3>
              {graphData.nodes.length === 0 ? (
                <p className="text-xs text-slate-600 italic">No structured node extractions recorded.</p>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {graphData.nodes.map((node: any) => (
                    <div key={node.id} className="p-2.5 bg-slate-950 border border-slate-800 rounded">
                      <div className="text-xs text-indigo-400 font-mono font-medium">{node.type}</div>
                      <div className="text-sm font-bold text-slate-200">{node.label}</div>
                      {node.description && <p className="text-xs text-slate-400 mt-1">{node.description}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Direct Functional Topology Relationships</h3>
              {graphData.edges.length === 0 ? (
                <p className="text-xs text-slate-600 italic">No graph connection links established.</p>
              ) : (
                <div className="space-y-2">
                  {graphData.edges.map((edge: any, i: number) => (
                    <div key={i} className="p-2.5 bg-slate-950 border border-slate-800 rounded text-xs">
                      <span className="font-bold text-indigo-300">{edge.source}</span>
                      <span className="mx-2 text-slate-500 font-mono">--[{edge.type}]--&gt;</span>
                      <span className="font-bold text-indigo-300">{edge.target}</span>
                      {edge.explanation && <p className="text-slate-400 mt-1 italic">{edge.explanation}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="p-4 flex flex-col bg-slate-950/20 h-full overflow-hidden">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-4">
            <MessageSquare className="w-4 h-4" /> Workflow 2: Knowledge-Augmented Chat
          </h2>
          
          <div className="flex-1 overflow-y-auto space-y-4 p-2 border border-slate-800 bg-slate-950/60 rounded-xl mb-4">
            {chatLog.length === 0 && (
              <p className="text-xs text-slate-500 italic text-center p-4">
                Ask complex trace questions backed by graph records.
              </p>
            )}
            {chatLog.map((chat: any, idx: number) => (
              <div 
                key={idx} 
                className={`flex flex-col ${chat.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div 
                  className={`p-3 rounded-xl max-w-[90%] text-sm whitespace-pre-wrap leading-relaxed ${
                    chat.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-200'
                  }`}
                >
                  {chat.text}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Query accumulated structures (e.g. Verify efficiency anomalies)..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
              className="flex-1 bg-slate-900 border border-slate-700 p-2.5 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
            />
            <button 
              onClick={handleSendChatMessage} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-lg transition-colors flex-shrink-0"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </section>

      </main>
    </div>
  );
}

   
                
        

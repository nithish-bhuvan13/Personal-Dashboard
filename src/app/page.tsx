"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  CheckSquare, PenTool, Dumbbell, Wallet, Mic, Sparkles, Brain, Clock, 
  TrendingUp, TrendingDown, X, Download, Check, Trash, Send, MessageSquare, 
  Activity, Paperclip, Calendar, CalendarDays
} from "lucide-react";
import confetti from "canvas-confetti";
import { Background } from "@/components/Background";
import CalisthenicsPlan from "../../calisthenics-month-plan";

type View = "tasks" | "journal" | "fitness" | "expense";

export default function Dashboard() {
  const [activeView, setActiveView] = useState<View>("tasks");
  const [isListening, setIsListening] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [greeting, setGreeting] = useState("GOOD DAY");
  
  // AI State Tracker
  const [aiMessage, setAiMessage] = useState("I am Jan, your Personal Assistant. Analyzing your dashboard...");
  const [chatInputValue, setChatInputValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const aiInitialized = useRef(false);

  // Conversation memory — persists across tab switches
  const [chatHistory, setChatHistory] = useState<{role: "user"|"assistant", content: string}[]>([]);

  // Main Data State
  const [data, setData] = useState<any>({ 
    expenses: [], 
    tasks: [], 
    fitness: [],
    journal: [],
    balances: { saving: 0, spending: 0, cash: 0 } 
  });

  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>("");
  const silenceTimerRef = useRef<any>(null);

  // Stable submit ref so voice closure always uses fresh state
  const handleJanChatSubmitRef = useRef<typeof handleJanChatSubmit | null>(null);

  useEffect(() => {
    updateTime();
    const interval = setInterval(updateTime, 60000);
    fetchData(true);
    return () => clearInterval(interval);
  }, []);

  // Keep the submit ref fresh on every render
  useEffect(() => {
    handleJanChatSubmitRef.current = handleJanChatSubmit;
  });

  // Set up speech recognition once on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) return;

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onresult = (event: any) => {
      let interim = "";
      let finalText = "";
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      // Show live text in the chat input as you speak
      setChatInputValue(finalText || interim);
      transcriptRef.current = finalText || interim;
    };

    rec.onerror = (e: any) => {
      console.warn("Speech error:", e.error);
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
      clearTimeout(silenceTimerRef.current);
      // Keep whatever was transcribed in the input — user sends manually
    };

    recognitionRef.current = rec;
  }, []);

  const toggleVoice = () => {
    const rec = recognitionRef.current;
    if (!rec) {
      alert("Speech recognition is not supported in this browser. Please use Chrome.");
      return;
    }
    if (isListening) {
      rec.stop();
      setIsListening(false);
    } else {
      transcriptRef.current = "";
      rec.start();
      setIsListening(true);
    }
  };

  // Journal Paste Support (Images)
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (activeView !== 'journal') return;
      // We're expecting a visual paste
      const items = e.clipboardData?.items;
      if (!items) return;
      
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (!file) continue;
          
          const reader = new FileReader();
          reader.onload = async (event) => {
            const base64 = event.target?.result as string;
            await syncData("POST", { 
              type: "journal", 
              payload: { content: "Pasted Media", color: "electric", date: new Date().toISOString(), imgBase64: base64 } 
            });
            confetti({ particleCount: 40 });
          };
          reader.readAsDataURL(file);
          return;
        }
      }
    };
    
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [activeView]);

  const updateTime = () => {
    const now = new Date();
    const hour = now.getHours();
    setCurrentTime(now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }));
    if (hour >= 5 && hour < 12) setGreeting("GOOD MORNING");
    else if (hour >= 12 && hour < 17) setGreeting("GOOD AFTERNOON");
    else setGreeting("GOOD EVENING");
  };

  const fetchData = async (isInitial = false) => {
    try {
      // Disable cache for real-time reads
      const res = await fetch(`/api/data?t=${Date.now()}`, { cache: "no-store", next: { revalidate: 0 } });
      const json = await res.json();
      if (!json.balances) json.balances = { saving: 0, spending: 0, cash: 0 };
      if (!json.fitness) json.fitness = [];
      if (!json.journal) json.journal = [];
      setData(json);

      if (isInitial && !aiInitialized.current) {
         aiInitialized.current = true;
         // AI Initial Dashboard Scan
         await handleJanChatSubmit(null, "Analyze my entire dashboard visually and tell me what I strictly need to focus on today. Keep it short, actionable, and punchy.", undefined, json);
      }
    } catch (err) {
      console.error("Fetch failed", err);
    }
  };

  const syncData = async (method: string, payload: any) => {
    try {
      const res = await fetch("/api/data", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store"
      });
      const updated = await res.json();
      if (!res.ok || updated.error) {
        console.error("API Error Response:", updated);
        alert(`Failed to sync data: ${updated.error || "Unknown Error"}`);
        return;
      }
      if (!updated.balances) updated.balances = { saving: 0, spending: 0, cash: 0 };
      if (!updated.fitness) updated.fitness = [];
      if (!updated.journal) updated.journal = [];
      if (!updated.tasks) updated.tasks = [];
      if (!updated.expenses) updated.expenses = [];
      
      setData(updated);
      return updated;
    } catch (err) {
      console.error("Sync failed", err);
    }
  };

  // --- AI CHATBOT LOGIC (JAN) ---
  const handleJanChatSubmit = async (e?: React.FormEvent | null, textOverride?: string, fileBase64?: string, overwriteContext?: any) => {
    e?.preventDefault();
    const input = textOverride || chatInputValue;
    if (!input && !fileBase64) return;

    setAiMessage(`Jan is scanning systems...`);
    setChatInputValue("");

    // Append user message to local history
    const userMsg = { role: "user" as const, content: input || "[image attached]" };
    const updatedHistory = [...chatHistory, userMsg];
    setChatHistory(updatedHistory);

    try {
      const dbContext = overwriteContext || data;
      const res = await fetch("/api/ai", {
        method: "POST",
        body: JSON.stringify({ 
          prompt: input, 
          imageBase64: fileBase64, 
          context: dbContext,
          history: updatedHistory.slice(-20) // Send last 20 messages (keeps tokens manageable)
        }),
      });
      const json = await res.json();
      setAiMessage(json.text);

      // Append Jan's reply to memory
      if (json.text) {
        setChatHistory(prev => [...prev, { role: "assistant", content: json.text }]);
      }

      if (json.actionsExecuted) {
         await fetchData();
         confetti({ particleCount: 30, spread: 40 });
      }
    } catch (err) {
      setAiMessage("Processing failure, Sir. Mainframe unreachable.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      handleJanChatSubmit(null, "Analyze the attached file and provide insights or process its contents into my dashboard.", base64);
    };
    reader.readAsDataURL(file);
  };



  // --- MODULE ACTIONS ---
  const handleExpense = async (e: React.FormEvent, isIncome: boolean = false) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const amount = (form.elements.namedItem("amount") as HTMLInputElement).value;
    const account = (form.elements.namedItem("account") as HTMLSelectElement).value;
    const categoryOrSource = (form.elements.namedItem("category") as HTMLInputElement | HTMLSelectElement).value;
    const notes = (form.elements.namedItem("notes") as HTMLInputElement)?.value || "";
    const dateInput = (form.elements.namedItem("date") as HTMLInputElement).value;
    const dateVal = dateInput ? new Date(dateInput).toISOString() : new Date().toISOString();

    await syncData("POST", { 
      type: isIncome ? "income" : "expense", 
      payload: { amount, account, category: categoryOrSource, notes, date: dateVal } 
    });
    form.reset();
    if (isIncome) confetti({ particleCount: 50 });
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    
    // Using separated attractive dates
    const startDate = (form.elements.namedItem("startDate") as HTMLInputElement).value;
    const startTime = (form.elements.namedItem("startTime") as HTMLInputElement).value;
    const endDate = (form.elements.namedItem("endDate") as HTMLInputElement).value;
    const endTime = (form.elements.namedItem("endTime") as HTMLInputElement).value;

    const startDT = startDate && startTime ? `${startDate}T${startTime}` : "";
    const endDT = endDate && endTime ? `${endDate}T${endTime}` : "";

    const payload = {
      name: (form.elements.namedItem("taskName") as HTMLInputElement).value,
      category: (form.elements.namedItem("category") as HTMLSelectElement).value,
      start: startDT,
      end: endDT,
      durationReq: (form.elements.namedItem("duration") as HTMLInputElement).value,
    };
    await syncData("POST", { type: "task", payload });
    form.reset();
  };

  const logFitness = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const payload = {
      target: (form.elements.namedItem("target") as HTMLSelectElement).value,
      exercise: (form.elements.namedItem("exercise") as HTMLInputElement).value,
      reps: (form.elements.namedItem("reps") as HTMLInputElement).value,
      sets: (form.elements.namedItem("sets") as HTMLInputElement).value,
      duration: (form.elements.namedItem("duration") as HTMLInputElement).value,
      date: (form.elements.namedItem("date") as HTMLInputElement).value || new Date().toISOString().split('T')[0],
    };
    await syncData("POST", { type: "fitness", payload });
    form.reset();
    confetti({ particleCount: 30 });
  };

  // --- ANALYTICS DATA ---
  const cats = { coding: 0, academics: 0, self_interest: 0, courses: 0, fitness: 0, other: 0 } as any;
  const colors = { coding: "#00d9ff", academics: "#a78bfa", self_interest: "#ffaa00", courses: "#00ff88", fitness: "#ff0055", other: "#6b7280" } as any;
  let totalTasksCount = 0;
  data.tasks.forEach((t:any) => {
     let c = String(t.category || "other").toLowerCase().replace(/[\s\-_]+/g, "");
     if (c === "selfinterest") c = "self_interest";
     if (cats[c] === undefined) c = "other";
     cats[c]++;
     totalTasksCount++;
  });

  let conicGradient = "";
  let currPercent = 0;
  if (totalTasksCount === 0) {
      conicGradient = "transparent 0% 100%";
  } else {
      const stops = Object.keys(cats).map(k => {
         if (cats[k] === 0) return "";
         const pct = (cats[k] / totalTasksCount) * 100;
         const start = currPercent;
         currPercent += pct;
         return `${colors[k]} ${start}% ${currPercent}%`;
      }).filter(s => s !== "").join(", ");
      conicGradient = stops;
  }

  // Handle Journal Textarea auto-sizing
  const handleInputGrow = (e: any) => {
     e.target.style.height = "auto";
     e.target.style.height = (e.target.scrollHeight) + "px";
  }

  const groupedFitness = data.fitness.reduce((acc: any, cur: any) => {
    if (!acc[cur.date]) acc[cur.date] = [];
    acc[cur.date].push(cur);
    return acc;
  }, {});

  return (
    <>
      <Background />
      <div className="app">
        {/* HEADER */}
        <header className="header" style={{ padding: "0 24px" }}>
          <div className="greeting">
            <div className="greeting-time">
              <span className="time-dot"></span>
              <span>{greeting}</span> • <span>{currentTime}</span>
            </div>
            <div className="greeting-name">
              <span className="highlight">Nithish Bhuvan K</span>
            </div>
          </div>
          
          <nav className="nav">
            <button className={`nav-item ${activeView === 'tasks' ? 'active' : ''}`} onClick={() => setActiveView('tasks')}>
              <CheckSquare size={16} /> <span>TASKS</span>
            </button>
            <button className={`nav-item ${activeView === 'journal' ? 'active' : ''}`} onClick={() => setActiveView('journal')}>
              <PenTool size={16} /> <span>JOURNAL</span>
            </button>
            <button className={`nav-item ${activeView === 'fitness' ? 'active' : ''}`} onClick={() => setActiveView('fitness')}>
              <Dumbbell size={16} /> <span>FITNESS</span>
            </button>
            <button className={`nav-item ${activeView === 'expense' ? 'active' : ''}`} onClick={() => setActiveView('expense')}>
              <Wallet size={16} /> <span>EXPENSE</span>
            </button>
          </nav>
          
          <div className="header-actions">
            <button className={`voice-button ${isListening ? 'listening' : ''}`} onClick={toggleVoice} title="Voice Command Connected to Jan">
              <Mic size={20} />
            </button>
            <div className="avatar">NB</div>
          </div>
        </header>

        <main className="main" style={{ padding: "32px", overflowY: "auto", display: "flex", flexDirection: "column" }}>
          
          {/* =========================================================
              GLOBAL JAN AI COMMAND BAR
          ========================================================= */}
          <div className="ai-hero" style={{ padding: "24px", marginBottom: "32px", animation: "none", flexShrink: 0 }}>
            <div className="ai-hero-glow"></div>
            <div className="ai-content" style={{ flexDirection: 'row', gap: "20px", alignItems: "flex-start" }}>
              <div className="ai-icon" style={{ flexShrink: 0 }}>
                 <Brain size={32} color="var(--electric)" />
              </div>
              <div style={{ flex: 1 }}>
                <span className="ai-tag">JAN AI EXECUTIVE TERMINAL</span>
                <div style={{ color: "var(--text-primary)", fontSize: "15px", lineHeight: 1.5, marginBottom: "16px", background: "rgba(0, 0, 0, 0.4)", padding: "16px", borderRadius: "12px", border: "1px solid rgba(0, 217, 255, 0.1)" }}>
                  {aiMessage}
                  {isListening && <span style={{ color: "var(--electric)", marginLeft: "12px" }}>Listening...</span>}
                </div>
                <form onSubmit={handleJanChatSubmit} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <input type="file" onChange={handleFileUpload} ref={fileInputRef} style={{ display: "none" }} />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="ai-btn" style={{ height: "46px", padding: "0 16px" }} title="Upload Image or Document">
                     <Paperclip size={18} />
                  </button>
                  <input value={chatInputValue} onChange={(e) => setChatInputValue(e.target.value)} className="input-field" placeholder="Ask Jan to analyze targets, log an expense, add a task, or simply advise..." style={{ marginBottom: 0, padding: "12px 20px", borderRadius: "10px", flex: 1 }} autoComplete="off" />
                  <button type="button" onClick={toggleVoice} className={`voice-button ${isListening ? 'listening' : ''}`} style={{ width: "46px", height: "46px", flexShrink: 0, background: "rgba(0, 217, 255, 0.1)", border: "1px solid rgba(0, 217, 255, 0.3)" }}>
                     <Mic size={18} />
                  </button>
                  <button type="submit" className="ai-btn" style={{ height: "46px", padding: "0 24px" }}><Send size={18} /></button>
                </form>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, position: "relative" }}>
            {/* =========================================================
                TASKS VIEW 
            ========================================================= */}
            {activeView === 'tasks' && (
              <div className="fade-in">
                <div className="tasks-grid" style={{ gridTemplateColumns: "1fr 340px" }}>
                  
                  {/* Task Form & List */}
                  <div className="task-list">
                    <div className="glass-card" style={{ marginBottom: "24px", padding: "20px" }}>
                      <div className="card-title" style={{ marginBottom: "16px" }}>Deploy Mission Objective</div>
                      <form onSubmit={addTask} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        
                        {/* Title & Category Row */}
                        <div style={{ display: "flex", gap: "12px" }}>
                           <input name="taskName" className="input-field" style={{ marginBottom: 0, flex: 2 }} placeholder="What is the mission objective?" required />
                           <select name="category" className="input-select" style={{ marginBottom: 0, flex: 1 }} required>
                             <option value="coding">Coding</option>
                             <option value="academics">Academics</option>
                             <option value="self_interest">Self Interest</option>
                             <option value="courses">Courses</option>
                             <option value="fitness">Fitness</option>
                             <option value="other">Other</option>
                           </select>
                        </div>
                        
                        {/* Interactive Date & Time Pickers */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "rgba(0,0,0,0.3)", padding: "16px", borderRadius: "12px", border: "1px solid rgba(0,217,255,0.1)" }}>
                           <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                               <CalendarDays size={18} color="var(--electric)" />
                               <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500, letterSpacing: "1px" }}>SCHEDULE TIMELINE</span>
                           </div>
                           
                           <div style={{ display: "flex", gap: "16px" }}>
                              <div style={{ flex: 1, display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                 <div style={{ flex: 1, minWidth: "120px" }}>
                                    <label style={{ fontSize: "10px", color: "var(--text-tertiary)", display: "block", marginBottom: "4px" }}>MANDATORY START</label>
                                    <div style={{ display: "flex", gap: "4px" }}>
                                       <input name="startDate" type="date" className="input-field" onClick={(e: any) => e.target.showPicker && e.target.showPicker()} style={{ padding: "8px", fontSize: "12px", marginBottom: 0 }} />
                                       <input name="startTime" type="time" className="input-field" onClick={(e: any) => e.target.showPicker && e.target.showPicker()} style={{ padding: "8px", fontSize: "12px", marginBottom: 0, maxWidth: "100px" }} />
                                    </div>
                                 </div>
                                 
                                 <div style={{ flex: 1, minWidth: "120px" }}>
                                    <label style={{ fontSize: "10px", color: "var(--text-tertiary)", display: "block", marginBottom: "4px" }}>MANDATORY FINISH</label>
                                    <div style={{ display: "flex", gap: "4px" }}>
                                       <input name="endDate" type="date" className="input-field" onClick={(e: any) => e.target.showPicker && e.target.showPicker()} style={{ padding: "8px", fontSize: "12px", marginBottom: 0 }} />
                                       <input name="endTime" type="time" className="input-field" onClick={(e: any) => e.target.showPicker && e.target.showPicker()} style={{ padding: "8px", fontSize: "12px", marginBottom: 0, maxWidth: "100px" }} />
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </div>

                        {/* Duration Request */}
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                           <input name="duration" type="text" className="input-field" placeholder="Duration required (e.g. 2 hrs)" style={{ marginBottom: 0, flex: 1 }} />
                           <button type="submit" className="submit-btn" style={{ margin: 0, flex: 2 }}>DEPLOY TASK</button>
                        </div>
                      </form>
                    </div>

                    <div className="card-title" style={{ marginBottom: "16px", marginTop: "10px" }}>Active & Pending Missions</div>
                    {data.tasks.map((task: any) => (
                      <div key={task.id} className={`task-item ${task.status === 'completed' ? 'completed' : ''}`} style={{ position: "relative" }}>
                        <div className={`task-checkbox ${task.status === 'completed' ? 'checked' : ''}`} onClick={() => syncData("PUT", { type: "task_status", id: task.id })}>
                          <Check size={14} style={{ display: task.status === 'completed' ? 'block' : 'none' }} />
                        </div>
                        <div className="task-content">
                          <div className="task-name">{task.name}</div>
                          <div className="task-meta">
                            <span className="task-category" style={{ background: `rgba(var(--deep-1), 0.5)`, color: colors[task.category] || "var(--electric)", border: `1px solid ${colors[task.category]}` }}>{String(task.category).toUpperCase().replace(/[\s\-_]+/g, ' ')}</span>
                            {task.durationReq && <span className="task-time"><Clock size={12} /> {task.durationReq}</span>}
                            {task.start && <span className="task-time">| Start: {new Date(task.start).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</span>}
                          </div>
                        </div>
                        <button onClick={() => syncData("DELETE", { type: "task", id: task.id })} style={{ position: "absolute", right: "20px", background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer" }}>
                          <Trash size={16} />
                        </button>
                      </div>
                    ))}
                    {data.tasks.length === 0 && <p style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>No active missions logged.</p>}
                  </div>
                  
                  {/* Task Focus Analytics Sidebar */}
                  <div className="stats-sidebar">
                    <div className="glass-card" style={{ textAlign: "center", padding: "32px 20px" }}>
                      <div className="card-title">Task Focus Breakdown</div>
                      <div style={{ margin: "32px auto", width: "160px", height: "160px", borderRadius: "50%", background: `conic-gradient(${conicGradient})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "inset 0 0 40px rgba(0,0,0,0.8), 0 0 20px rgba(0,217,255,0.2)" }}>
                        <div style={{ width: "120px", height: "120px", borderRadius: "50%", background: "var(--deep-1)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ fontSize: "32px", fontFamily: "Clash Display", fontWeight: 700, color: "var(--text-primary)" }}>{totalTasksCount}</span>
                            <span style={{ fontSize: "10px", color: "var(--text-tertiary)", letterSpacing: "1px" }}>TOTAL TASKS</span>
                        </div>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "24px", textAlign: "left" }}>
                        {Object.keys(cats).filter(k => cats[k] > 0).map(k => (
                          <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "rgba(0,0,0,0.3)", borderRadius: "8px", border: `1px solid ${colors[k]}40` }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: colors[k] }}></div>
                                <span style={{ color: "var(--text-secondary)", fontSize: "13px", textTransform: "capitalize" }}>{k.replace('_', ' ')}</span>
                            </div>
                            <span style={{ color: colors[k], fontWeight: 600, fontSize: "14px", fontFamily: "JetBrains Mono" }}>{cats[k]} <span style={{ fontSize: "10px", color: "var(--text-tertiary)" }}>({Math.round((cats[k]/totalTasksCount)*100)}%)</span></span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================
                JOURNAL VIEW 
            ========================================================= */}
            {activeView === 'journal' && (
              <div 
                className="fade-in" 
                style={{ width: "100%", minHeight: "60vh", cursor: "text", position: "relative" }}
                onClick={async (e) => {
                  // Spawns note immediately strictly on empty space clicks.
                  if (e.target === e.currentTarget) {
                    await syncData("POST", { 
                      type: "journal", 
                      payload: { content: "", color: "electric", date: new Date().toISOString() } 
                    });
                  }
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }} onClick={(e) => e.stopPropagation()}>
                    <div className="card-label" style={{ marginBottom: 0 }}>NOTES & REFLECTIONS (Click anywhere empty to add a note instantly)</div>
                    <div className="greeting-time" style={{ color: "var(--electric)" }}><MessageSquare size={14} /> {data.journal.length} NOTES RECORDED</div>
                </div>

                <div className="journal-canvas" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", alignItems: "start", gap: "24px", minHeight: "auto", background: "none", paddingBottom: "100px" }} onClick={async (e) => {
                  if (e.target === e.currentTarget) {
                    await syncData("POST", { type: "journal", payload: { content: "", color: "electric", date: new Date().toISOString() } });
                  }
                }}>
                    {data.journal.map((j: any) => {
                      let bgCol = "0, 217, 255";
                      if (j.color === "green") bgCol = "0, 255, 136";
                      if (j.color === "amber") bgCol = "255, 170, 0";
                      if (j.color === "purple") bgCol = "167, 139, 250";
                      if (j.color === "red") bgCol = "255, 0, 85";

                      return (
                      <div key={j.id} className="glass-card" style={{ padding: "0", position: "relative", display: "flex", flexDirection: "column", height: "fit-content" }}>
                      <button onClick={() => syncData("DELETE", { type: "journal", id: j.id })} style={{ position: "absolute", top: "12px", right: "12px", background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer", zIndex: 10 }}><X size={16} /></button>
                      <div style={{ padding: "16px", background: `linear-gradient(90deg, rgba(${bgCol}, 0.1), transparent)`, borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: "6px" }}>
                          <div style={{ width:"8px", height:"8px", borderRadius:"50%", background: `var(--${j.color})` }}></div>
                          <div style={{ width:"8px", height:"8px", borderRadius:"50%", background: `var(--${j.color})`, opacity:0.6 }}></div>
                          <div style={{ width:"8px", height:"8px", borderRadius:"50%", background: `var(--${j.color})`, opacity:0.3 }}></div>
                      </div>
                      <div style={{ padding: "20px", display: "flex", flexDirection: "column", flex: 1 }}>
                          {j.imgBase64 && <img src={j.imgBase64} alt="Journal Attachment" style={{ width: "100%", borderRadius: "8px", marginBottom: "12px", objectFit: "contain", maxHeight: "400px" }} />}
                          <textarea 
                            className="note-textarea" 
                            defaultValue={j.content} 
                            placeholder="Start typing..." 
                            onChange={handleInputGrow}
                            style={{ 
                               flex: 1, width: "100%", fontFamily: "JetBrains Mono", 
                               fontSize: "13px", resize: "none", overflow: "hidden", minHeight: "40px",
                               background: "transparent", border: "none", outline: "none", color: "var(--text-primary)"
                            }}
                            onBlur={(e) => syncData("PUT", { type: "journal", id: j.id, payload: { ...j, content: e.target.value } })} 
                          ></textarea>
                          <span style={{ fontSize: "10px", color: "var(--text-tertiary)", marginTop: "24px" }}>{new Date(j.date).toLocaleDateString()} {new Date(j.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      </div>
                    )})}
                </div>
              </div>
            )}

            {/* =========================================================
                FITNESS VIEW 
            ========================================================= */}
            {activeView === 'fitness' && (
              <div className="fade-in">
                 {/* Progress Overview full-width component */}
                 <div style={{ marginBottom: "32px", overflow: "hidden", borderRadius: "20px", border: "1px solid rgba(0, 217, 255, 0.1)" }}>
                    <CalisthenicsPlan />
                 </div>

                <div className="fitness-grid" style={{ gridTemplateColumns: "380px 1fr" }}>
                   {/* ... keeping traditional log form as optional extension */}
                  <div className="workout-log glass-card" style={{ alignSelf: "start" }}>
                    <div className="card-label" style={{ marginBottom: "20px" }}>MANUAL LOG SESSION</div>
                    <form onSubmit={logFitness}>
                      <div className="input-group">
                        <label className="input-label">OVERALL TARGET</label>
                        <select name="target" className="input-select" required style={{ background: "rgba(0,0,0,0.5)" }}>
                          <option value="Upper Body">Upper Body</option>
                          <option value="Lower Body">Lower Body</option>
                          <option value="Abs">Abs</option>
                          <option value="Skill">Skill</option>
                          <option value="Rest">Rest</option>
                        </select>
                      </div>
                      <div className="input-group">
                        <label className="input-label">Date</label>
                        <input name="date" type="date" className="input-field" onClick={(e: any) => e.target.showPicker && e.target.showPicker()} defaultValue={new Date().toISOString().split('T')[0]} required />
                      </div>
                      <div className="input-group">
                        <label className="input-label">EXERCISE</label>
                        <input name="exercise" type="text" className="input-field" placeholder="e.g. Pull-ups" required />
                      </div>
                      <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
                        <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                          <label className="input-label">REPS</label>
                          <input name="reps" type="text" className="input-field" placeholder="12" required />
                        </div>
                        <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                          <label className="input-label">SETS</label>
                          <input name="sets" type="text" className="input-field" placeholder="4" required />
                        </div>
                      </div>
                      <div className="input-group">
                        <label className="input-label">DURATION (MINS)</label>
                        <input name="duration" type="number" className="input-field" placeholder="30" required />
                      </div>
                      <button type="submit" className="submit-btn" style={{ background: "var(--electric)", color: "var(--void)", marginTop: "8px" }}>LOG IT</button>
                    </form>
                  </div>
                  
                  <div className="glass-card">
                     <div className="card-label" style={{ marginBottom: "20px" }}>HISTORY (GROUPED BY DATE)</div>
                     
                     {Object.keys(groupedFitness).length === 0 && <p style={{ color: "var(--text-tertiary)", fontStyle: "italic", textAlign: "center", padding: "20px" }}>No workout sessions logged yet.</p>}

                     {Object.keys(groupedFitness).sort((a,b) => new Date(b).getTime() - new Date(a).getTime()).map(date => (
                        <div key={date} style={{ marginBottom: "24px" }}>
                           <h4 style={{ color: "var(--text-primary)", fontSize: "14px", fontFamily: "Clash Display", marginBottom: "12px", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "8px" }}>
                              {date === new Date().toISOString().split('T')[0] ? "Today" : new Date(date).toLocaleDateString()} 
                              <span style={{ marginLeft: "12px", color: "var(--text-tertiary)", fontSize: "12px", fontWeight: 400 }}>[{groupedFitness[date][0]?.target}]</span>
                           </h4>
                           <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                             <thead>
                               <tr style={{ color: "var(--text-tertiary)", borderBottom: "1px solid rgba(255,255,255,0.05)", textAlign: "left" }}>
                                 <th style={{ padding: "8px 0", width: "40%" }}>EXERCISE</th>
                                 <th style={{ padding: "8px 0" }}>REPS</th>
                                 <th style={{ padding: "8px 0" }}>SETS</th>
                                 <th style={{ padding: "8px 0" }}>TIME</th>
                                 <th style={{ padding: "8px 0", textAlign: "right" }}></th>
                               </tr>
                             </thead>
                             <tbody>
                               {groupedFitness[date].map((session: any) => (
                                 <tr key={session.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                                   <td style={{ padding: "12px 0", color: "var(--text-primary)", fontWeight: 500 }}>{session.exercise}</td>
                                   <td style={{ padding: "12px 0", color: "var(--electric)", fontFamily: "JetBrains Mono" }}>{session.reps}</td>
                                   <td style={{ padding: "12px 0", color: "var(--text-primary)" }}>{session.sets}</td>
                                   <td style={{ padding: "12px 0", color: "var(--text-tertiary)" }}>{session.duration}m</td>
                                   <td style={{ padding: "12px 0", textAlign: "right" }}>
                                      <button onClick={() => syncData("DELETE", { type: "fitness", id: session.id })} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer" }}><X size={14}/></button>
                                   </td>
                                 </tr>
                               ))}
                             </tbody>
                           </table>
                        </div>
                     ))}
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================
                EXPENSE VIEW 
            ========================================================= */}
            {activeView === 'expense' && (
              <div className="fade-in">
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
                   <button className="ai-coach-btn" onClick={() => window.location.href = "/api/report"} style={{ border: '1px solid rgba(0, 255, 136, 0.25)', color: 'var(--green)', padding: "8px 16px" }}>
                     <Download size={14} /> <span>DOWNLOAD REPORT</span>
                   </button>
                </div>
                <div className="expense-summary" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                  <div className="summary-card" style={{ borderTop: "3px solid var(--electric)" }}>
                    <div className="summary-label">Saving Account Balance</div>
                    <div className="summary-value">₹{data.balances.saving.toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
                    <div className="summary-trend"><span>Long-term repository</span></div>
                  </div>
                  <div className="summary-card" style={{ borderTop: "3px solid var(--purple)" }}>
                    <div className="summary-label">Spending Account Balance</div>
                    <div className="summary-value">₹{data.balances.spending.toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
                    <div className="summary-trend"><span>Day-to-day liquidity</span></div>
                  </div>
                  <div className="summary-card" style={{ borderTop: "3px solid var(--green)" }}>
                    <div className="summary-label">Cash on Hand</div>
                    <div className="summary-value">₹{data.balances.cash.toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
                    <div className="summary-trend"><span>Physical currency</span></div>
                  </div>
                </div>
                
                <div className="expense-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
                  <div className="glass-card">
                    <div className="card-title" style={{ marginBottom: "20px", color: "var(--red)" }}>Log Expense (Deduct)</div>
                    <form onSubmit={(e) => handleExpense(e, false)}>
                      <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
                         <div style={{ flex: 1 }}>
                            <label className="input-label">Account From</label>
                            <select name="account" className="input-select" required>
                               <option value="spending">Spending Account</option>
                               <option value="cash">Cash</option>
                               <option value="saving">Saving Account</option>
                            </select>
                         </div>
                         <div style={{ flex: 1 }}>
                            <label className="input-label">Amount (₹)</label>
                            <input name="amount" type="number" step="0.01" className="input-field" placeholder="0" required />
                         </div>
                      </div>
                      <div className="input-group">
                        <label className="input-label">Category</label>
                        <select name="category" className="input-select">
                          <option>Food</option>
                          <option>Transport</option>
                          <option>Books</option>
                          <option>Fitness</option>
                          <option>Other</option>
                        </select>
                      </div>
                      <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
                         <div style={{ flex: 1 }}>
                            <label className="input-label">Date</label>
                            <input name="date" type="date" className="input-field" onClick={(e: any) => e.target.showPicker && e.target.showPicker()} defaultValue={new Date().toISOString().split('T')[0]} />
                         </div>
                         <div style={{ flex: 2 }}>
                            <label className="input-label">Notes</label>
                            <input name="notes" type="text" className="input-field" placeholder="Optional" />
                         </div>
                      </div>
                      <button type="submit" className="submit-btn" style={{ background: "linear-gradient(135deg, #ff0055, #aa0033)" }}>DEDUCT AMOUNT</button>
                    </form>
                  </div>

                  <div className="glass-card">
                    <div className="card-title" style={{ marginBottom: "20px", color: "var(--green)" }}>Log Income (Add)</div>
                    <form onSubmit={(e) => handleExpense(e, true)}>
                      <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
                         <div style={{ flex: 1 }}>
                            <label className="input-label">Account To</label>
                            <select name="account" className="input-select" required>
                               <option value="saving">Saving Account</option>
                               <option value="spending">Spending Account</option>
                               <option value="cash">Cash</option>
                            </select>
                         </div>
                         <div style={{ flex: 1 }}>
                            <label className="input-label">Amount (₹)</label>
                            <input name="amount" type="number" step="0.01" className="input-field" placeholder="0" required />
                         </div>
                      </div>
                      <div className="input-group">
                        <label className="input-label">Source / Notes</label>
                        <input name="category" type="text" className="input-field" placeholder="e.g. Salary, Pocket Money" required />
                      </div>
                      <div className="input-group">
                         <label className="input-label">Date</label>
                         <input name="date" type="date" className="input-field" onClick={(e: any) => e.target.showPicker && e.target.showPicker()} defaultValue={new Date().toISOString().split('T')[0]} />
                      </div>
                      <button type="submit" className="submit-btn" style={{ background: "linear-gradient(135deg, #00ff88, #00aa55)" }}>ADD FUNDS</button>
                    </form>
                  </div>
                </div>
                
                <div className="transaction-list" style={{ marginTop: "24px" }}>
                  <div className="card-title" style={{ marginBottom: "20px" }}>Recent Transactions (Deductions)</div>
                  {data.expenses.map((exp: any) => (
                    <div key={exp.id} className="transaction-item" style={{ position: "relative" }}>
                      <div className="transaction-icon" style={{ color: "var(--red)", background: "rgba(255,0,85,0.1)" }}>₹</div>
                      <div className="transaction-details">
                        <div className="transaction-name">{exp.notes || exp.category} <span style={{ fontSize: "10px", color: "var(--electric)", marginLeft: "8px", border: "1px solid rgba(0,217,255,0.2)", padding: "2px 6px", borderRadius: "4px", background: "rgba(0,0,0,0.5)" }}>{exp.account?.toUpperCase()}</span></div>
                        <div className="transaction-date">{new Date(exp.date).toLocaleDateString()}</div>
                      </div>
                      <div className="transaction-amount" style={{ marginRight: "32px", color: "var(--red)" }}>- ₹{Number(exp.amount).toFixed(2)}</div>
                      <button 
                        onClick={() => syncData("DELETE", { type: "expense", id: exp.id })}
                        style={{ position: "absolute", right: "16px", background: "rgba(255, 0, 85, 0.1)", border: "1px solid rgba(255,0,85,0.3)", borderRadius: "6px", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--red)" }}
                      >
                        <Trash size={12} />
                      </button>
                    </div>
                  ))}
                  {data.expenses.length === 0 && <p style={{ color: "var(--text-tertiary)", fontStyle: "italic", textAlign: "center", padding: "20px" }}>No expenses logged yet. Keep saving.</p>}
                </div>
              </div>
            )}
            
          </div>
        </main>
      </div>
    </>
  );
}

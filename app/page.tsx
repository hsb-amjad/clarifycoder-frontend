"use client";

import { useState, Fragment } from "react";
import { motion } from "framer-motion";
import { Listbox, Transition } from "@headlessui/react";
import { Check, ChevronDown, Menu, X } from "lucide-react";
import { useEffect } from "react";

// ---- Types ----
interface DropdownProps {
  value: string;
  onChange: (val: string) => void;
  options: string[];
}

interface Prompt {
  id: number;
  prompt: string;
  category: string;
}

interface RefineResult {
  action: string;
  refined_code: string;
  re_eval_status: string;
}

interface Result {
  status?: string;
  clarifications?: string[];
  answers?: string[];
  output?: string;
  refine?: RefineResult;
  error?: string;
}

// ---- Dropdown Component ----
function PremiumDropdown({ value, onChange, options }: DropdownProps) {
  return (
    <Listbox value={value} onChange={onChange}>
      <div className="relative w-full">
        <Listbox.Button className="relative w-full min-w-[140px] sm:min-w-[180px] cursor-pointer rounded-xl bg-gradient-to-r from-indigo-500/80 to-purple-500/80 px-4 py-3 text-center font-semibold text-white shadow-md focus:outline-none focus:ring-4 focus:ring-purple-300 transition flex justify-between items-center">
          <span className="truncate">{value}</span>
          <ChevronDown className="h-5 w-5 opacity-80 ml-2 shrink-0" />
        </Listbox.Button>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-150"
          enterFrom="opacity-0 translate-y-1"
          enterTo="opacity-100 translate-y-0"
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 translate-y-1"
        >
          <Listbox.Options className="absolute z-10 mt-2 w-full rounded-xl bg-white shadow-lg ring-1 ring-black/10 focus:outline-none">
            {options.map((opt, i) => (
              <Listbox.Option
                key={i}
                value={opt}
                className={({ active }) =>
                  `cursor-pointer select-none px-4 py-2 text-gray-800 font-medium ${
                    active
                      ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
                      : ""
                  } rounded-lg m-1`
                }
              >
                {({ selected }) => (
                  <div className="flex items-center justify-between">
                    {opt}
                    {selected && <Check className="h-4 w-4" />}
                  </div>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  );
}

// ---- Sidebar Component ----
function Sidebar({
  setPrompt,
  closeSidebar,
}: {
  setPrompt: (p: string) => void;
  closeSidebar: () => void;
}) {
  const [prompts, setPrompts] = useState<Prompt[]>([]);

  useEffect(() => {
    fetch("/clarifycoder-agent/prompts.jsonl")
      .then((res) => {
        if (!res.ok) throw new Error("File not found: " + res.status);
        return res.text();
      })
      .then((text) => {
        const lines = text
          .split("\n")
          .filter((line) => line.trim() !== "")
          .map((line) => {
            try {
              return JSON.parse(line) as Prompt;
            } catch {
              return null;
            }
          })
          .filter((item): item is Prompt => item !== null);
        setPrompts(lines);
      })
      .catch((err) => console.error("Failed to load prompts:", err));
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Title */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h2 className="text-lg font-bold">PROMPTS</h2>
        <button
          className="md:hidden text-white"
          onClick={closeSidebar}
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Scrollable prompt list */}
      <div className="relative flex-1 overflow-y-auto px-2 space-y-2 no-scrollbar">
        {prompts.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              setPrompt(p.prompt);
              closeSidebar();
            }}
            className="w-full text-left px-3 py-2 rounded-lg bg-gray-800 hover:bg-indigo-600 transition"
          >
            {p.category} #{p.id}
          </button>
        ))}

        {/* Fade overlay at bottom */}
        <div className="pointer-events-none sticky bottom-0 left-0 right-0 h-16 
                        bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent"></div>
      </div>
    </div>
  );
}

// ---- Main App ----
export default function Home() {
  const [mode, setMode] = useState("LLM");
  const [answerMode, setAnswerMode] = useState("Auto-Answer");
  const [prompt, setPrompt] = useState("");
  const [clarifications, setClarifications] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const runPrompt = async (givenAnswers?: string[]) => {
    setLoading(true);
    try {
      const res = await fetch(
        "https://clarifycoder-backend.onrender.com/run_prompt",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            mode: mode.toLowerCase(),
            answer_mode: answerMode.toLowerCase().includes("human")
              ? "human"
              : "auto",
            answers: givenAnswers || null,
          }),
        }
      );
      const data: Result = await res.json();
      setResult(data);
      setClarifications(data.clarifications || []);
      setAnswers(data.answers || []);
    } catch (err) {
      console.error(err);
      setResult({ error: "Failed to connect to backend" });
    }
    setLoading(false);
  };

  const handleAnswerSubmit = () => {
    runPrompt(answers);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-screen w-64 bg-gray-900/90 backdrop-blur-md text-white transform transition-transform duration-300 z-30
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <Sidebar setPrompt={setPrompt} closeSidebar={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center 
                 p-4 md:p-6 overflow-y-auto w-full
                 justify-start mt-8 md:mt-12">
        {/* Top Bar (mobile only) */}
        <div className="md:hidden flex items-center justify-between w-full mb-4">
          <button onClick={() => setSidebarOpen(true)} className="text-white">
            <Menu className="h-7 w-7" />
          </button>
          <h1 className="flex-1 text-center text-2xl font-extrabold text-white drop-shadow-lg">
            AGENTIC CLARIFYCODER
          </h1>
          <div className="w-7" /> {/* spacer */}
        </div>

        {/* Heading (desktop) */}
        <motion.h1
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="hidden md:block text-5xl font-extrabold text-white mb-10 drop-shadow-lg tracking-tight"
        >
          AGENTIC CLARIFYCODER
        </motion.h1>

        {/* Input Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl p-6 w-full max-w-3xl"
        >
          <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between items-center">
            <div className="flex-1">
              <PremiumDropdown
                value={mode}
                onChange={setMode}
                options={["Baseline", "LLM"]}
              />
            </div>

            <div className="flex-1">
              <PremiumDropdown
                value={answerMode}
                onChange={setAnswerMode}
                options={["Auto-Answer", "Human Answer"]}
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => runPrompt()}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-2xl transition disabled:opacity-50 w-full sm:w-auto"
            >
              {loading ? "⚡ Running..." : "▶ Run Prompt"}
            </motion.button>
          </div>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault(); // prevent newline
                runPrompt();
              }
            }}
            placeholder="💡 Enter your coding task..."
            className="w-full h-32 p-4 rounded-xl bg-white/70 border-2 border-gray-300 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-300 shadow-inner transition"
          />
        </motion.div>

        {/* Pipeline Visualization */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mt-10 w-full max-w-3xl space-y-6"
          >
            {/* ClarifyAgent */}
            {clarifications.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-yellow-100 rounded-xl shadow-lg p-6"
              >
                <h2 className="text-xl font-bold text-yellow-800 mb-2">
                  ❓ ClarifyAgent
                </h2>
                <ul className="list-disc pl-6">
                  {clarifications.map((q, i) => (
                    <li key={i} className="mb-6">
                      <p className="font-medium text-gray-900">{q}</p>

                      {answerMode === "Human Answer" &&
                        result.status === "awaiting_answers" && (
                          <input
                            type="text"
                            value={answers[i] || ""}
                            onChange={(e) => {
                              const newAnswers = [...answers];
                              newAnswers[i] = e.target.value;
                              setAnswers(newAnswers);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault(); // prevent newline/submit issues
                                handleAnswerSubmit();
                              }
                            }}
                            placeholder="Type your answer..."
                            className="mt-2 w-full px-4 py-3 rounded-xl bg-white/40 backdrop-blur-md border-2 border-transparent 
                                      focus:border-purple-400 focus:ring-4 focus:ring-purple-200 
                                      shadow-inner text-gray-900 font-medium placeholder-gray-500 
                                      transition duration-200"
                          />
                        )}

                      {answerMode === "Human Answer" &&
                        result.status !== "awaiting_answers" &&
                        answers[i] && (
                          <p className="mt-2 text-green-700 font-semibold">
                            💡 Your Answer:{" "}
                            <span className="text-gray-900">
                              {answers[i]}
                            </span>
                          </p>
                        )}

                      {answerMode === "Auto-Answer" && answers[i] && (
                        <p className="mt-2 text-green-800 font-medium">
                          🤖 Auto-Answer: {answers[i]}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
                {answerMode === "Human Answer" &&
                  result.status === "awaiting_answers" && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleAnswerSubmit}
                      className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md"
                    >
                      Go!
                    </motion.button>
                  )}
              </motion.div>
            )}

            {/* CodeAgent */}
            {result.output && result.status !== "awaiting_answers" && (
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-2xl shadow-lg p-6 relative"
              >
                <h2 className="text-2xl font-bold text-indigo-700 mb-2">
                  📝 CodeAgent Output
                </h2>

                {/* Copy button (GitHub style) */}
                <button
                  onClick={() => {
                    // remove ``` markers and language labels safely
                    const cleanCode = (result.output ?? "")
                      .replace(/```[a-zA-Z]*\n?/, "") // removes ```python or ```js
                      .replace(/```$/, "");           // removes closing ```
                    navigator.clipboard.writeText(cleanCode.trim());
                  }}
                  className="absolute top-4 right-4 flex items-center gap-1 text-gray-600 hover:text-gray-900 text-sm"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.8}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 16h8M8 12h8m-6 8h6a2 2 0 002-2V8a2 
                        2 0 00-2-2h-2l-2-2H8a2 2 0 00-2 2v12a2 
                        2 0 002 2z"
                    />
                  </svg>
                  Copy code
                </button>

                <pre className="bg-gray-900 text-green-300 p-4 rounded-xl overflow-x-auto mt-6">
                  {result.output}
                </pre>
              </motion.div>
            )}

            {/* EvalAgent */}
            {result.status && result.status !== "awaiting_answers" && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-blue-100 rounded-2xl shadow-lg p-6"
              >
                <h2 className="text-xl font-bold text-blue-800 mb-2">
                  ✅ EvalAgent
                </h2>
                <p className="font-medium">Status: {result.status}</p>
              </motion.div>
            )}

            {/* RefineAgent */}
            {result.refine && (
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-purple-100 rounded-2xl shadow-lg p-6"
              >
                <h2 className="text-xl font-bold text-purple-800 mb-2">
                  🔧 RefineAgent
                </h2>
                <p className="font-medium mb-2">
                  Action:{" "}
                  <span className="italic">{result.refine.action}</span>
                </p>
                <pre className="bg-gray-900 text-yellow-200 p-4 rounded-xl overflow-x-auto">
                  {result.refine.refined_code}
                </pre>
                <p className="mt-2 text-purple-900 font-semibold">
                  Re-Eval Status: {result.refine.re_eval_status}
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}

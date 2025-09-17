"use client";

import { useState, Fragment } from "react";
import { motion } from "framer-motion";
import { Listbox, Transition } from "@headlessui/react";
import { Check, ChevronDown } from "lucide-react";
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

interface Metrics {
  ARSR?: number;
  CSR?: number;
  RFR?: number;
  USR?: number;
  CRR?: number;
  [key: string]: number | undefined;
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
  metrics?: Metrics;
  error?: string;
}

// ---- Dropdown Component ----
function PremiumDropdown({ value, onChange, options }: DropdownProps) {
  return (
    <Listbox value={value} onChange={onChange}>
      <div className="relative w-full">
        <Listbox.Button className="relative w-full cursor-pointer rounded-xl bg-gradient-to-r from-indigo-500/80 to-purple-500/80 px-4 py-3 text-left font-semibold text-white shadow-md focus:outline-none focus:ring-4 focus:ring-purple-300 transition flex justify-between items-center">
          <span>{value}</span>
          <ChevronDown className="h-5 w-5 opacity-80" />
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
  setView,
}: {
  setPrompt: (p: string) => void;
  setView: (v: "main" | "metrics") => void;
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
    <div className="fixed top-0 left-0 h-screen w-56 bg-gray-900 text-white flex flex-col">
      {/* Title */}
      <h2 className="text-lg font-bold p-4">PROMPTS</h2>

      {/* Scrollable prompt list */}
      <div className="relative flex-1 overflow-y-auto px-2 space-y-2 no-scrollbar">
        {prompts.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              setPrompt(p.prompt);
              setView("main");
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

      {/* Fixed Metrics button */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={() => setView("metrics")}
          className="w-full px-3 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90"
        >
          📊 Metrics
        </button>
      </div>
    </div>
  );
}

// ---- Metrics View ----
function MetricsView({
  metrics,
  setView,
}: {
  metrics: Metrics | null;
  setView: (v: "main" | "metrics") => void;
}) {
  const fullNames: Record<string, string> = {
    ARSR: "Ambiguity-Resolved Success Rate",
    CSR: "Code Success Rate",
    RFR: "Refinement Fix Rate",
    USR: "Unsupported Rate",
    CRR: "Clarification Request Rate",
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-3xl relative">
      {/* Back Button */}
      <button
        onClick={() => setView("main")}
        className="absolute top-4 left-4 px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg shadow"
      >
        ← Back
      </button>

      <h2 className="text-2xl font-bold text-indigo-700 mb-6 text-center">
        📊 Metrics Dashboard
      </h2>

      {metrics ? (
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b">
              <th className="py-2 px-3">Metric</th>
              <th className="py-2 px-3">Full Form</th>
              <th className="py-2 px-3">Value</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(metrics).map(([k, v]) => (
              <tr key={k} className="border-b hover:bg-gray-50">
                <td className="py-2 px-3 font-semibold">{k}</td>
                <td className="py-2 px-3">{fullNames[k] || "—"}</td>
                <td className="py-2 px-3 text-indigo-700 font-bold">
                  {v !== undefined ? `${(v * 100).toFixed(1)}%` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-600">Run prompts to generate metrics.</p>
      )}
    </div>
  );
}

// ---- Main App ----
export default function Home() {
  const [mode, setMode] = useState("LLM");
  const [answerMode, setAnswerMode] = useState("Auto-Answer");
  const [prompt, setPrompt] = useState("");
  const [view, setView] = useState<"main" | "metrics">("main");
  const [clarifications, setClarifications] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);

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
    <div className="flex min-h-screen">
      <Sidebar setPrompt={setPrompt} setView={setView} />

      <main className="ml-56 flex-1 flex flex-col items-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-6 overflow-y-auto">
        {view === "main" ? (
          <>
            <motion.h1
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="text-5xl font-extrabold text-white mb-10 drop-shadow-lg tracking-tight"
            >
              AGENTIC CLARIFYCODER
            </motion.h1>

            {/* Input Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl p-8 w-full max-w-3xl"
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
                  className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-2xl transition disabled:opacity-50"
                >
                  {loading ? "⚡ Running..." : "▶ Run Prompt"}
                </motion.button>
              </div>

              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
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

                          {/* Input for answers */}
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
                                placeholder="Type your answer..."
                                className="mt-2 w-full px-4 py-3 rounded-xl bg-white/40 backdrop-blur-md border-2 border-transparent 
                                          focus:border-purple-400 focus:ring-4 focus:ring-purple-200 
                                          shadow-inner text-gray-900 font-medium placeholder-gray-500 
                                          transition duration-200"
                              />
                            )}

                          {/* After submission */}
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

                          {/* Auto mode answers */}
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
                    className="bg-white rounded-2xl shadow-lg p-6"
                  >
                    <h2 className="text-2xl font-bold text-indigo-700 mb-2">
                      📝 CodeAgent Output
                    </h2>
                    <pre className="bg-gray-900 text-green-300 p-4 rounded-xl overflow-x-auto">
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
          </>
        ) : (
          <MetricsView metrics={result?.metrics || null} setView={setView} />
        )}
      </main>
    </div>
  );
}

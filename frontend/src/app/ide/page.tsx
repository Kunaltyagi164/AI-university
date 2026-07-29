"use client";

import React, { useState } from "react";
import { api } from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { useToast } from "@/components/ToastProvider";
import { 
  Play, 
  Terminal as TermIcon, 
  Sparkles, 
  Code2, 
  CheckCircle, 
  RefreshCw,
  FolderOpen,
  XCircle
} from "lucide-react";

const LANGUAGE_TEMPLATES: Record<string, string> = {
  python: `# NOVA AI Coding Lab — Python Sandbox
# Task: Write a function that returns the square of all even numbers in a list

def square_evens(nums: list) -> list:
    evens = [n**2 for n in nums if n % 2 == 0]
    return evens

# Test execution
test_numbers = [1, 2, 3, 4, 5, 6]
print("Result:", square_evens(test_numbers))
`,
  javascript: `// NOVA AI Coding Lab — JavaScript Sandbox
// Task: Return squares of even numbers

function squareEvens(nums) {
  return nums.filter(n => n % 2 === 0).map(n => n ** 2);
}

const testNums = [1, 2, 3, 4, 5, 6];
console.log("Result:", squareEvens(testNums));
`,
  typescript: `// NOVA AI Coding Lab — TypeScript Sandbox
function squareEvens(nums: number[]): number[] {
  return nums.filter(n => n % 2 === 0).map(n => n ** 2);
}
console.log(squareEvens([1, 2, 3, 4, 5, 6]));
`,
  cpp: `// NOVA AI Coding Lab — C++ Sandbox
#include <iostream>
#include <vector>
using namespace std;

vector<int> squareEvens(vector<int> nums) {
    vector<int> result;
    for (int n : nums)
        if (n % 2 == 0) result.push_back(n * n);
    return result;
}

int main() {
    for (int x : squareEvens({1,2,3,4,5,6}))
        cout << x << " ";
    return 0;
}
`,
  java: `// NOVA AI Coding Lab — Java Sandbox
import java.util.*;
import java.util.stream.*;

public class Main {
    public static List<Integer> squareEvens(int[] nums) {
        return Arrays.stream(nums)
            .filter(n -> n % 2 == 0)
            .map(n -> n * n)
            .boxed().collect(Collectors.toList());
    }
    public static void main(String[] args) {
        System.out.println(squareEvens(new int[]{1,2,3,4,5,6}));
    }
}
`,
  go: `// NOVA AI Coding Lab — Go Sandbox
package main
import "fmt"

func squareEvens(nums []int) []int {
    var result []int
    for _, n := range nums {
        if n%2 == 0 { result = append(result, n*n) }
    }
    return result
}

func main() { fmt.Println(squareEvens([]int{1,2,3,4,5,6})) }
`,
  bash: `#!/bin/bash
# NOVA AI Coding Lab — Bash Sandbox
nums=(1 2 3 4 5 6)
for n in "\${nums[@]}"; do
  if (( n % 2 == 0 )); then
    echo "Even square: $(( n * n ))"
  fi
done
`,
};

export default function IdePage() {
  const { addToast } = useToast();
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState(LANGUAGE_TEMPLATES["python"]);
  const [stdout, setStdout] = useState("Terminal ready... click 'Run Code' to execute sandbox tests.");
  const [stderr, setStderr] = useState("");
  const [exitCode, setExitCode] = useState<number | null>(null);
  const [aiReview, setAiReview] = useState("Review pending... execute a program to trigger the AI Coding Professor.");
  const [loading, setLoading] = useState(false);
  const [passed, setPassed] = useState<boolean | null>(null);

  const handleRunCode = async () => {
    setLoading(true);
    setStdout("Connecting to sandbox kernel...");
    setStderr("");
    setExitCode(null);
    setPassed(null);

    try {
      const res = await api.runCode({ code, language });
      setStdout(res.stdout || "Execution finished (no output).");
      setStderr(res.stderr || "");
      setExitCode(res.exit_code);
      setAiReview(res.review || "No review returned.");
      setPassed(res.passed);

      if (res.passed) {
        const savedProfile = localStorage.getItem("nova_profile");
        if (savedProfile) {
          const profile = JSON.parse(savedProfile);
          profile.xp += 15;
          localStorage.setItem("nova_profile", JSON.stringify(profile));
        }
        addToast({ type: "xp", title: "+15 XP — Code Passed!", message: "Your code review was successful." });
      }
    } catch (e: any) {
      setStdout("");
      setStderr(e.message || "Failed to connect to compiler kernel.");
      setPassed(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    setCode(LANGUAGE_TEMPLATES[lang] || "");
    setStdout("Terminal ready...");
    setStderr("");
    setExitCode(null);
    setPassed(null);
    setAiReview("Review pending...");
  };

  const handleReset = () => {
    setCode(LANGUAGE_TEMPLATES[language] || "");
    setStdout("Terminal ready... click 'Run Code' to execute sandbox tests.");
    setStderr("");
    setExitCode(null);
    setAiReview("Review pending... execute a program to trigger the AI Coding Professor.");
    setPassed(null);
  };

  return (
    <div className="min-h-screen bg-[#06060c] flex">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main IDE grid workspace */}
      <main className="flex-1 flex overflow-hidden h-screen">
        
        {/* Left Column: Instructions and files */}
        <section className="w-80 border-r border-white/[0.04] bg-[#07070e] flex flex-col h-full">
          <div className="p-4 border-b border-white/[0.04] bg-[#090914] flex items-center space-x-2">
            <Code2 className="h-5 w-5 text-purple-400" />
            <h2 className="text-sm font-bold text-white">Coding Lab</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            <div className="space-y-2">
              <span className="text-[10px] text-purple-400 font-mono font-bold uppercase tracking-wider">LAB OBJECTIVE</span>
              <h3 className="text-sm font-semibold text-white">List Comprehension Filter</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Filters an array of integer inputs, squashing values by square exponentials, and yielding only numbers matching odd/even modules.
              </p>
            </div>

            <div className="space-y-3">
              <span className="text-[10px] text-purple-400 font-mono font-bold uppercase tracking-wider">TASKS & BOUNDARIES</span>
              <ul className="text-xs text-gray-400 space-y-2 list-disc list-inside">
                <li>Input parameters are lists of positive integers.</li>
                <li>Verify time complexity is O(N).</li>
                <li>Do not import external system sub-libraries.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] text-purple-400 font-mono font-bold uppercase tracking-wider">WORKSPACE FILES</span>
              <div className="flex items-center gap-2 p-2 bg-white/5 border border-white/5 rounded-lg text-xs text-gray-300">
                <FolderOpen className="h-4 w-4 text-amber-500" />
                <span className="font-mono">solution.py</span>
              </div>
            </div>
          </div>
        </section>

        {/* Center Column: Code Editor and Terminal */}
        <section className="flex-1 flex flex-col justify-between bg-[#080812] border-r border-white/[0.04] h-full overflow-hidden">
          
          {/* Editor Header settings */}
          <div className="h-12 border-b border-white/[0.04] bg-[#090914] px-4 flex justify-between items-center z-10">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-400 font-mono">Language:</span>
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-[#0b0b14] border border-white/10 rounded text-xs text-white px-2 py-0.5"
              >
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
                <option value="go">Go</option>
                <option value="bash">Bash</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleReset}
                className="p-1.5 hover:bg-white/5 border border-transparent rounded text-xs text-gray-400 hover:text-white flex items-center gap-1 cursor-pointer"
                title="Reset Workspace"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
              
              <button
                onClick={handleRunCode}
                disabled={loading}
                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer shadow-md"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>{loading ? "Running..." : "Run Code"}</span>
              </button>
            </div>
          </div>

          {/* Textarea code editor */}
          <div className="flex-1 p-4 font-mono text-sm relative flex bg-[#06060c]">
            {/* Custom line counts mock */}
            <div className="w-8 select-none text-gray-700 text-right pr-3 border-r border-white/5 space-y-0.5">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1 bg-transparent text-gray-200 outline-none resize-none pl-3 font-mono leading-relaxed h-full w-full whitespace-pre"
              spellCheck="false"
            />
          </div>

          {/* Color-coded Terminal console */}
          <div className="h-64 border-t border-white/[0.04] bg-[#090914] flex flex-col">
            <div className="h-8 border-b border-white/[0.04] px-4 bg-[#0a0a16] flex items-center justify-between text-xs text-gray-400">
              <span className="flex items-center gap-1 font-mono">
                <TermIcon className="h-3.5 w-3.5" /> CONSOLE OUTPUT
              </span>
              {passed !== null && (
                <span className={`font-semibold uppercase flex items-center gap-1 ${passed ? "text-emerald-400" : "text-red-400"}`}>
                  {passed ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                  {passed ? "PASS" : "FAIL"}
                </span>
              )}
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-1.5 select-text">
              {stdout && stdout !== "Terminal ready... click 'Run Code' to execute sandbox tests." && (
                <div>
                  <span className="text-emerald-500/60 text-[10px] uppercase tracking-widest">stdout</span>
                  <p className="text-emerald-300 whitespace-pre-wrap mt-0.5">{stdout}</p>
                </div>
              )}
              {stderr && (
                <div>
                  <span className="text-red-500/60 text-[10px] uppercase tracking-widest">stderr</span>
                  <p className="text-red-400 whitespace-pre-wrap mt-0.5">{stderr}</p>
                </div>
              )}
              {!stdout && !stderr && (
                <p className="text-gray-600 italic">Terminal ready... click 'Run Code' to execute sandbox tests.</p>
              )}
              {exitCode !== null && (
                <p className="text-gray-500 border-t border-white/5 pt-1 mt-1 font-mono">
                  Process exited with code: <span className={exitCode === 0 ? "text-emerald-400" : "text-red-400"}>{exitCode}</span>
                </p>
              )}
            </div>
          </div>

        </section>

        {/* Right Column: AI Coding Professor Review panel */}
        <aside className="w-80 border-l border-white/[0.04] bg-[#090914] p-5 flex flex-col h-full space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-white/[0.04]">
            <Sparkles className="h-5 w-5 text-cyan-400 animate-pulse" />
            <h3 className="text-sm font-bold text-white">AI Code Review</h3>
          </div>
          
          <div className="flex-1 bg-[#05050c] border border-white/[0.04] rounded-xl p-4 overflow-y-auto">
            {aiReview && aiReview !== "Review pending... execute a program to trigger the AI Coding Professor." ? (
              <MarkdownRenderer content={aiReview} />
            ) : (
              <p className="text-xs text-gray-600 italic font-mono">Review pending... run your code to get AI feedback.</p>
            )}
          </div>
          
          <div className="text-[10px] text-gray-600 text-center font-mono">
            Complexity · Style · Security · Edge Cases
          </div>
        </aside>

      </main>
    </div>
  );
}

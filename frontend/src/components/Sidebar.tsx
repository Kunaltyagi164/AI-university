"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Image from "next/image";
import NotificationBell from "@/components/NotificationBell";
import { 
  LayoutDashboard, 
  MessageSquareCode, 
  Code2, 
  ShieldAlert, 
  BookOpen, 
  Cpu, 
  LogOut,
  Trophy,
  Coins,
  Sun,
  Moon,
  User,
  BarChart2
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Sync profile details from localStorage
  const refreshProfile = () => {
    if (typeof window !== "undefined") {
      const uStr = localStorage.getItem("nova_user");
      const pStr = localStorage.getItem("nova_profile") || "{}";
      if (uStr) {
        setUser(JSON.parse(uStr));
      }
      try {
        setProfile(JSON.parse(pStr));
      } catch (e) {
        // empty
      }
    }
  };

  useEffect(() => {
    refreshProfile();
    // Load theme setting
    if (typeof window !== "undefined") {
      const savedTheme = (localStorage.getItem("nova_theme") as "dark" | "light") || "dark";
      setTheme(savedTheme);
      if (savedTheme === "light") {
        document.documentElement.classList.add("light");
      } else {
        document.documentElement.classList.remove("light");
      }
    }
    // Set up timer to refresh stats
    const interval = setInterval(refreshProfile, 2000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    if (typeof window !== "undefined") {
      localStorage.setItem("nova_theme", newTheme);
      if (newTheme === "light") {
        document.documentElement.classList.add("light");
      } else {
        document.documentElement.classList.remove("light");
      }
    }
  };

  const handleLogout = () => {
    api.logout();
    router.push("/");
  };

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "AI Classroom", href: "/classroom", icon: MessageSquareCode },
    { name: "Coding Labs", href: "/ide", icon: Code2 },
    { name: "Exams Portal", href: "/exams", icon: ShieldAlert },
    { name: "Research Lab", href: "/research", icon: BookOpen },
    { name: "Leaderboard", href: "/leaderboard", icon: BarChart2 },
    { name: "My Profile", href: "/profile", icon: User },
    { name: "Admin Terminal", href: "/admin", icon: Cpu },
  ];

  if (!user) return null;

  const xpProgress = profile?.xp ? (profile.xp % 100) : 0;
  const level = profile?.level || 1;
  const coins = profile?.coins || 0;
  const streak = profile?.streak || 0;

  return (
    <aside className="w-64 border-r border-theme-border bg-theme-card flex flex-col h-screen sticky top-0 text-theme-fg/80 transition-colors duration-300">
      {/* Brand Header */}
      <div className="p-4 border-b border-theme-border flex items-center justify-between">
        <div className="flex items-center bg-white rounded-xl px-2 py-1 shadow-md shadow-purple-900/20">
          <Image
            src="/logo.png"
            alt="NOVA AI University"
            width={110}
            height={44}
            className="h-11 w-auto object-contain"
            priority
          />
        </div>
        <div className="flex items-center gap-1.5">
          <NotificationBell />
          <button 
            onClick={toggleTheme}
            className="p-2 bg-white/5 border border-theme-border hover:bg-white/10 rounded-lg text-theme-fg/70 hover:text-theme-fg cursor-pointer transition-all"
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          </button>
        </div>
      </div>

      {/* Student Level Panel */}
      <div className="p-5 mx-4 my-4 bg-purple-950/10 border border-purple-500/20 rounded-xl">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center space-x-2">
            <Trophy className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-semibold text-theme-fg">Level {level}</span>
          </div>
          <span className="text-xs text-purple-400 font-mono">{profile?.xp || 0} XP</span>
        </div>
        <div className="w-full bg-purple-950/40 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-purple-500 h-full rounded-full transition-all duration-500" 
            style={{ width: `${xpProgress}%` }}
          />
        </div>
        <div className="flex justify-between items-center mt-3 text-xs font-mono text-theme-fg/60">
          <span className="flex items-center gap-1">
            <Coins className="h-3.5 w-3.5 text-cyan-400" /> {coins} Coins
          </span>
          <span className="flex items-center gap-1">
            🔥 {streak} Day Streak
          </span>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link 
              key={item.href}
              href={item.href}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                isActive 
                  ? "bg-purple-600/20 border border-purple-500/30 text-theme-fg shadow-[0_0_10px_rgba(139,92,246,0.1)] font-semibold" 
                  : "hover:bg-white/5 border border-transparent hover:text-theme-fg"
              }`}
            >
              <Icon className={`mr-3 h-5 w-5 ${isActive ? "text-purple-500" : "text-theme-fg/50"}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* AI Professor Active Node */}
      <div className="p-4 mx-4 mb-4 glass-panel rounded-xl border border-cyan-500/20 text-center">
        <p className="text-xs text-cyan-400 font-mono font-semibold flex items-center justify-center gap-1.5 mb-1">
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
          AI PROFESSOR ACTIVE
        </p>
        <span className="text-xs text-theme-fg/55">Professor Albert is listening</span>
      </div>

      {/* Footer / User Profile */}
      <div className="p-4 border-t border-theme-border flex justify-between items-center">
        <Link href="/profile" className="flex items-center space-x-3 overflow-hidden hover:opacity-80 transition-opacity">
          <div className="h-9 w-9 rounded-full bg-purple-600 flex items-center justify-center font-bold text-white border border-purple-400/30 shrink-0">
            {user.full_name?.charAt(0).toUpperCase()}
          </div>
          <div className="truncate">
            <p className="text-sm font-semibold text-theme-fg truncate">{user.full_name}</p>
            <p className="text-xs text-theme-fg/50 truncate">{user.email}</p>
          </div>
        </Link>
        <button 
          onClick={handleLogout}
          className="p-2 text-theme-fg/50 hover:text-red-400 transition-colors cursor-pointer shrink-0"
          title="Sign Out"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </aside>
  );
}

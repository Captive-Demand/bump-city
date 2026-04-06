import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

export type ActivityType = "gift-claimed" | "rsvp" | "prediction" | "registry-added" | "guest-invited" | "invite-sent";

export interface Activity {
  id: string;
  type: ActivityType;
  text: string;
  timestamp: number; // Date.now()
}

interface ActivityFeedContextType {
  activities: Activity[];
  addActivity: (type: ActivityType, text: string) => void;
}

const ActivityFeedContext = createContext<ActivityFeedContextType | null>(null);

const STORAGE_KEY = "bumpcity-activity-feed";

export const ActivityFeedProvider = ({ children }: { children: React.ReactNode }) => {
  const [activities, setActivities] = useState<Activity[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
  }, [activities]);

  const addActivity = useCallback((type: ActivityType, text: string) => {
    setActivities((prev) => [
      { id: crypto.randomUUID(), type, text, timestamp: Date.now() },
      ...prev.slice(0, 49), // keep max 50
    ]);
  }, []);

  return (
    <ActivityFeedContext.Provider value={{ activities, addActivity }}>
      {children}
    </ActivityFeedContext.Provider>
  );
};

export const useActivityFeed = () => {
  const ctx = useContext(ActivityFeedContext);
  if (!ctx) throw new Error("useActivityFeed must be used within ActivityFeedProvider");
  return ctx;
};

export const formatRelativeTime = (timestamp: number): string => {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

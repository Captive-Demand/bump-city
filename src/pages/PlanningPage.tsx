import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { PageLoader } from "@/components/PageLoader";
import { useAuth } from "@/contexts/AuthContext";
import { useEvent } from "@/hooks/useEvent";
import { supabase } from "@/integrations/supabase/client";
import {
  ClipboardList,
  Plus,
  AlertCircle,
  ChevronLeft,
  DollarSign,
  Utensils,
  Store,
  Trash2,
  CalendarIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { format, isPast } from "date-fns";
import { useNavigate } from "react-router-dom";

// ---------- Types ----------
interface PlanningTask {
  id: string;
  title: string;
  assignee: string | null;
  due_date: string | null;
  completed: boolean;
}
interface BudgetItem {
  id: string;
  category: string;
  label: string;
  estimated_cost: number;
  actual_cost: number;
  paid: boolean;
}
interface PotluckItem {
  id: string;
  category: string;
  label: string;
  quantity_needed: number;
  claimed_by: string | null;
  notes: string | null;
}
interface EventVendor {
  id: string;
  name: string;
  category: string | null;
  status: string;
  cost: number | null;
  notes: string | null;
}
interface MemberOption {
  user_id: string;
  display_name: string;
  role: string;
}

const TASK_FILTERS = ["All Tasks", "My Assignments", "Overdue"] as const;
type TaskFilter = (typeof TASK_FILTERS)[number];

const BUDGET_CATEGORIES = ["Venue", "Food", "Decor", "Cake", "Photography", "Favors", "Other"];
const POTLUCK_CATEGORIES = ["Main", "Side", "Dessert", "Drink", "Supplies", "Other"];
const VENDOR_STATUSES = ["contacted", "booked", "paid"];

const PlanningPage = () => {
  const { user } = useAuth();
  const { event } = useEvent();
  const navigate = useNavigate();

  const [tab, setTab] = useState("checklist");
  const [loading, setLoading] = useState(true);

  // Tasks
  const [tasks, setTasks] = useState<PlanningTask[]>([]);
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("All Tasks");
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAssignee, setNewAssignee] = useState<string>("");
  const [newAssigneeFreeText, setNewAssigneeFreeText] = useState("");
  const [newDueDate, setNewDueDate] = useState<Date>();

  // Budget
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [totalBudget, setTotalBudget] = useState(0);
  const [budgetEditOpen, setBudgetEditOpen] = useState(false);
  const [totalBudgetDraft, setTotalBudgetDraft] = useState("");
  const [addBudgetOpen, setAddBudgetOpen] = useState(false);
  const [bLabel, setBLabel] = useState("");
  const [bCategory, setBCategory] = useState("Other");
  const [bEst, setBEst] = useState("");
  const [bActual, setBActual] = useState("");

  // Potluck
  const [potluckItems, setPotluckItems] = useState<PotluckItem[]>([]);
  const [addPotOpen, setAddPotOpen] = useState(false);
  const [pLabel, setPLabel] = useState("");
  const [pCategory, setPCategory] = useState("Food");
  const [pQty, setPQty] = useState("1");

  // Vendors
  const [vendors, setVendors] = useState<EventVendor[]>([]);
  const [addVendorOpen, setAddVendorOpen] = useState(false);
  const [vName, setVName] = useState("");
  const [vCategory, setVCategory] = useState("");
  const [vStatus, setVStatus] = useState("contacted");
  const [vCost, setVCost] = useState("");

  // Members
  const [members, setMembers] = useState<MemberOption[]>([]);

  // ---------- Loaders ----------
  const fetchAll = async () => {
    if (!event) return;
    const [
      { data: t },
      { data: b },
      { data: p },
      { data: v },
      { data: ev },
      { data: m },
    ] = await Promise.all([
      supabase.from("planning_tasks").select("*").eq("event_id", event.id).order("completed").order("due_date", { nullsFirst: false }),
      supabase.from("budget_items").select("*").eq("event_id", event.id).order("created_at"),
      supabase.from("potluck_items").select("*").eq("event_id", event.id).order("created_at"),
      supabase.from("event_vendors").select("*").eq("event_id", event.id).order("created_at"),
      supabase.from("events").select("total_budget").eq("id", event.id).maybeSingle(),
      supabase.from("event_members").select("user_id, role").eq("event_id", event.id),
    ]);
    setTasks((t as PlanningTask[]) || []);
    setBudgetItems((b as BudgetItem[]) || []);
    setPotluckItems((p as PotluckItem[]) || []);
    setVendors((v as EventVendor[]) || []);
    setTotalBudget(Number((ev as any)?.total_budget) || 0);

    // Fetch member display names
    const memberRows = (m as { user_id: string; role: string }[]) || [];
    if (memberRows.length > 0) {
      const ids = memberRows.map((r) => r.user_id);
      const { data: profiles } = await supabase.from("profiles").select("id, display_name").in("id", ids);
      const nameMap = new Map((profiles || []).map((p: any) => [p.id, p.display_name]));
      setMembers(
        memberRows.map((r) => ({
          user_id: r.user_id,
          display_name: nameMap.get(r.user_id) || "Member",
          role: r.role,
        }))
      );
    } else {
      setMembers([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (event) fetchAll();
    else setLoading(false);
  }, [event]);

  // ---------- Computed ----------
  const completedCount = tasks.filter((t) => t.completed).length;
  const overdueCount = tasks.filter((t) => !t.completed && t.due_date && isPast(new Date(t.due_date))).length;

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (taskFilter === "Overdue") return !t.completed && t.due_date && isPast(new Date(t.due_date));
      if (taskFilter === "My Assignments") {
        const me = user?.email || user?.id;
        return t.assignee && (t.assignee === me || members.find((m) => m.user_id === user?.id && m.display_name === t.assignee));
      }
      return true;
    });
  }, [tasks, taskFilter, user, members]);

  const totalSpent = budgetItems.reduce((s, b) => s + (Number(b.actual_cost) || Number(b.estimated_cost) || 0), 0);
  const budgetRemaining = Math.max(0, totalBudget - totalSpent);
  const budgetPct = totalBudget > 0 ? Math.min(100, (totalSpent / totalBudget) * 100) : 0;

  // ---------- Mutations ----------
  const addTask = async () => {
    if (!event || !user || !newTitle.trim()) return;
    const assigneeName = newAssignee
      ? members.find((m) => m.user_id === newAssignee)?.display_name || null
      : newAssigneeFreeText.trim() || null;
    const { error } = await supabase.from("planning_tasks").insert({
      event_id: event.id,
      user_id: user.id,
      title: newTitle.trim(),
      assignee: assigneeName,
      due_date: newDueDate ? format(newDueDate, "yyyy-MM-dd") : null,
    });
    if (error) return toast.error("Failed to add task");
    setNewTitle(""); setNewAssignee(""); setNewAssigneeFreeText(""); setNewDueDate(undefined); setAddTaskOpen(false);
    fetchAll();
  };

  const toggleTask = async (id: string, current: boolean) => {
    await supabase.from("planning_tasks").update({ completed: !current }).eq("id", id);
    fetchAll();
  };

  const deleteTask = async (id: string) => {
    await supabase.from("planning_tasks").delete().eq("id", id);
    fetchAll();
  };

  const saveTotalBudget = async () => {
    if (!event) return;
    const v = Number(totalBudgetDraft) || 0;
    await supabase.from("events").update({ total_budget: v }).eq("id", event.id);
    setBudgetEditOpen(false);
    fetchAll();
  };

  const addBudgetItem = async () => {
    if (!event || !user || !bLabel.trim()) return;
    const { error } = await supabase.from("budget_items").insert({
      event_id: event.id,
      user_id: user.id,
      label: bLabel.trim(),
      category: bCategory,
      estimated_cost: Number(bEst) || 0,
      actual_cost: Number(bActual) || 0,
    });
    if (error) return toast.error("Failed to add line item");
    setBLabel(""); setBEst(""); setBActual(""); setBCategory("Other"); setAddBudgetOpen(false);
    fetchAll();
  };

  const togglePaid = async (id: string, current: boolean) => {
    await supabase.from("budget_items").update({ paid: !current }).eq("id", id);
    fetchAll();
  };

  const deleteBudget = async (id: string) => {
    await supabase.from("budget_items").delete().eq("id", id);
    fetchAll();
  };

  const addPotluck = async () => {
    if (!event || !user || !pLabel.trim()) return;
    const { error } = await supabase.from("potluck_items").insert({
      event_id: event.id,
      user_id: user.id,
      label: pLabel.trim(),
      category: pCategory,
      quantity_needed: Number(pQty) || 1,
    });
    if (error) return toast.error("Failed to add potluck item");
    setPLabel(""); setPCategory("Food"); setPQty("1"); setAddPotOpen(false);
    fetchAll();
  };

  const claimPotluck = async (id: string, claimer: string) => {
    await supabase.from("potluck_items").update({ claimed_by: claimer || null }).eq("id", id);
    fetchAll();
  };

  const deletePotluck = async (id: string) => {
    await supabase.from("potluck_items").delete().eq("id", id);
    fetchAll();
  };

  const addVendor = async () => {
    if (!event || !user || !vName.trim()) return;
    const { error } = await supabase.from("event_vendors").insert({
      event_id: event.id,
      user_id: user.id,
      name: vName.trim(),
      category: vCategory.trim() || null,
      status: vStatus,
      cost: Number(vCost) || 0,
    });
    if (error) return toast.error("Failed to add vendor");
    setVName(""); setVCategory(""); setVStatus("contacted"); setVCost(""); setAddVendorOpen(false);
    fetchAll();
  };

  const updateVendorStatus = async (id: string, status: string) => {
    await supabase.from("event_vendors").update({ status }).eq("id", id);
    fetchAll();
  };

  const deleteVendor = async (id: string) => {
    await supabase.from("event_vendors").delete().eq("id", id);
    fetchAll();
  };

  // ---------- UI helpers ----------
  const initials = (name: string) =>
    name
      .split(" ")
      .map((s) => s[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();

  const openFab = () => {
    if (tab === "checklist") setAddTaskOpen(true);
    else if (tab === "budget") setAddBudgetOpen(true);
    else if (tab === "potluck") setAddPotOpen(true);
    else setAddVendorOpen(true);
  };

  if (loading)
    return (
      <MobileLayout>
        <PageLoader />
      </MobileLayout>
    );

  return (
    <MobileLayout>
      {/* Header */}
      <div className="px-6 pt-8 pb-3">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1 text-sm text-muted-foreground mb-3 hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Home
        </button>
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Event Planning</h1>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="w-full justify-center gap-5 px-6 py-2 bg-transparent border-b border-border rounded-none h-auto">
          {[
            { id: "checklist", label: "Checklist" },
            { id: "budget", label: "Budget" },
            { id: "potluck", label: "Potluck" },
            { id: "vendors", label: "Vendors" },
          ].map((t) => (
            <TabsTrigger
              key={t.id}
              value={t.id}
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 py-3 text-sm font-semibold text-muted-foreground"
            >
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* CHECKLIST */}
        <TabsContent value="checklist" className="mt-4 px-6 pb-24 space-y-4">
          {/* Budget Overview card */}
          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-primary" />
                  </div>
                  <p className="font-bold text-sm">Budget Overview</p>
                </div>
                <p className="text-xs text-muted-foreground">Total: ${totalBudget.toLocaleString()}</p>
              </div>
              <div className="flex items-end justify-between mb-2">
                <p className="text-3xl font-extrabold">${totalSpent.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground font-medium">
                  {totalBudget > 0 ? `${Math.round(budgetPct)}% Spent` : "Set a budget"}
                </p>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${budgetPct}%` }} />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">${budgetRemaining.toLocaleString()} Remaining</p>
                <button
                  onClick={() => {
                    setTotalBudgetDraft(String(totalBudget || ""));
                    setBudgetEditOpen(true);
                  }}
                  className="text-xs text-primary font-semibold"
                >
                  Edit
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Filter pills — wrap to a new row on narrow screens instead of
              scrolling horizontally (eliminates the mobile scrollbar). */}
          <div className="flex flex-wrap gap-2">
            {TASK_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setTaskFilter(f)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap border transition-all",
                  taskFilter === f
                    ? "bg-foreground text-background border-foreground"
                    : "bg-card text-foreground border-border"
                )}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Task list */}
          <div className="space-y-2">
            {filteredTasks.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No tasks here yet.</p>
            )}
            {filteredTasks.map((task) => {
              const isOverdue = !task.completed && task.due_date && isPast(new Date(task.due_date));
              return (
                <Card key={task.id} className={cn("border-none shadow-sm overflow-hidden", task.completed && "opacity-60")}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={() => toggleTask(task.id, task.completed)}
                      className="h-5 w-5 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={cn("font-bold text-base", task.completed && "line-through")}>{task.title}</p>
                      {task.due_date && (
                        <p
                          className={cn(
                            "text-xs font-semibold mt-0.5 flex items-center gap-1",
                            isOverdue ? "text-destructive" : "text-muted-foreground"
                          )}
                        >
                          {isOverdue && <AlertCircle className="h-3 w-3" />}
                          Due {format(new Date(task.due_date), "MMM d")}
                        </p>
                      )}
                    </div>
                    {task.assignee && (
                      <div className="h-9 w-9 shrink-0 rounded-full bg-peach flex items-center justify-center text-xs font-bold text-foreground">
                        {initials(task.assignee)}
                      </div>
                    )}
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="shrink-0 text-muted-foreground/50 hover:text-destructive p-1"
                      aria-label="Delete task"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground text-center pt-2">
            {completedCount}/{tasks.length} complete{overdueCount > 0 && ` · ${overdueCount} overdue`}
          </p>
        </TabsContent>

        {/* BUDGET */}
        <TabsContent value="budget" className="mt-4 px-6 pb-24 space-y-3">
          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Total Budget</p>
                <button
                  onClick={() => {
                    setTotalBudgetDraft(String(totalBudget || ""));
                    setBudgetEditOpen(true);
                  }}
                  className="text-xs text-primary font-semibold"
                >
                  Edit
                </button>
              </div>
              <p className="text-3xl font-extrabold mb-1">${totalBudget.toLocaleString()}</p>
              <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
                <div className="h-full bg-primary rounded-full" style={{ width: `${budgetPct}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">
                ${totalSpent.toLocaleString()} spent · ${budgetRemaining.toLocaleString()} remaining
              </p>
            </CardContent>
          </Card>

          {budgetItems.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No line items yet — tap + to add one.</p>
          )}
          {budgetItems.map((b) => (
            <Card key={b.id} className="border-none shadow-sm overflow-hidden">
              <CardContent className="p-3 flex items-center gap-3">
                <Checkbox checked={b.paid} onCheckedChange={() => togglePaid(b.id, b.paid)} className="h-5 w-5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className={cn("font-semibold text-sm", b.paid && "line-through opacity-60")}>{b.label}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{b.category}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-sm">${(Number(b.actual_cost) || Number(b.estimated_cost)).toLocaleString()}</p>
                  {b.paid && <p className="text-[10px] text-primary font-semibold">PAID</p>}
                </div>
                <button onClick={() => deleteBudget(b.id)} className="shrink-0 text-muted-foreground/50 hover:text-destructive p-1">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* POTLUCK */}
        <TabsContent value="potluck" className="mt-4 px-6 pb-24 space-y-3">
          {potluckItems.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No potluck items yet — tap + to add one.</p>
          )}
          {potluckItems.map((p) => (
            <Card key={p.id} className="border-none shadow-sm overflow-hidden">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="h-9 w-9 shrink-0 rounded-full bg-mint/40 flex items-center justify-center">
                  <Utensils className="h-4 w-4 text-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{p.label}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    {p.category} · qty {p.quantity_needed}
                  </p>
                </div>
                {p.claimed_by ? (
                  <button
                    onClick={() => claimPotluck(p.id, "")}
                    className="shrink-0 text-xs font-semibold text-primary"
                  >
                    {p.claimed_by} ✓
                  </button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 rounded-full text-xs h-8"
                    onClick={() => {
                      const name = prompt("Who's bringing this?");
                      if (name?.trim()) claimPotluck(p.id, name.trim());
                    }}
                  >
                    Claim
                  </Button>
                )}
                <button onClick={() => deletePotluck(p.id)} className="shrink-0 text-muted-foreground/50 hover:text-destructive p-1">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* VENDORS */}
        <TabsContent value="vendors" className="mt-4 px-6 pb-24 space-y-3">
          {vendors.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No vendors added yet — tap + to add one.</p>
          )}
          {vendors.map((v) => (
            <Card key={v.id} className="border-none shadow-sm overflow-hidden">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="h-9 w-9 shrink-0 rounded-full bg-lavender/50 flex items-center justify-center">
                  <Store className="h-4 w-4 text-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{v.name}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    {v.category || "Vendor"}
                    {v.cost ? ` · $${Number(v.cost).toLocaleString()}` : ""}
                  </p>
                </div>
                <Select value={v.status} onValueChange={(s) => updateVendorStatus(v.id, s)}>
                  <SelectTrigger className="shrink-0 h-8 w-28 text-xs rounded-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VENDOR_STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="text-xs capitalize">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <button onClick={() => deleteVendor(v.id)} className="shrink-0 text-muted-foreground/50 hover:text-destructive p-1">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Floating Action Button.
          Lives inside a fixed full-width sliver so its inner max-w-4xl
          wrapper anchors the button to the right edge of the page's
          centered content area on every breakpoint — no hand-rolled calc.
          On mobile (<md) the wrapper still works because max-w-4xl is
          wider than the phone frame so it fills the viewport. */}
      <div
        className="fixed inset-x-0 bottom-24 md:bottom-6 z-30 px-6 pointer-events-none"
        aria-hidden="true"
      >
        <div className="max-w-4xl mx-auto flex justify-end">
          <button
            onClick={openFab}
            className="pointer-events-auto h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
            aria-label="Add"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Add Task Dialog */}
      <Dialog open={addTaskOpen} onOpenChange={setAddTaskOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Task</Label>
              <Input placeholder="e.g. Order cake" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Assign to (optional)</Label>
              {members.length > 0 ? (
                <Select value={newAssignee} onValueChange={setNewAssignee}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pick a member" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((m) => (
                      <SelectItem key={m.user_id} value={m.user_id}>
                        {m.display_name} <span className="text-muted-foreground text-xs">· {m.role}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
              <Input
                placeholder={members.length > 0 ? "or type a name" : "e.g. Mom"}
                value={newAssigneeFreeText}
                onChange={(e) => {
                  setNewAssigneeFreeText(e.target.value);
                  if (e.target.value) setNewAssignee("");
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Due date (optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !newDueDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newDueDate ? format(newDueDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={newDueDate} onSelect={setNewDueDate} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <Button className="w-full" onClick={addTask} disabled={!newTitle.trim()}>
              Add Task
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Total Budget Dialog */}
      <Dialog open={budgetEditOpen} onOpenChange={setBudgetEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Total Budget</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Total budget ($)</Label>
              <Input
                type="number"
                inputMode="decimal"
                placeholder="2000"
                value={totalBudgetDraft}
                onChange={(e) => setTotalBudgetDraft(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={saveTotalBudget}>
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Budget Item Dialog */}
      <Dialog open={addBudgetOpen} onOpenChange={setAddBudgetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Budget Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Item</Label>
              <Input placeholder="e.g. Catering deposit" value={bLabel} onChange={(e) => setBLabel(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={bCategory} onValueChange={setBCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BUDGET_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Estimated ($)</Label>
                <Input type="number" inputMode="decimal" placeholder="0" value={bEst} onChange={(e) => setBEst(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Actual ($)</Label>
                <Input type="number" inputMode="decimal" placeholder="0" value={bActual} onChange={(e) => setBActual(e.target.value)} />
              </div>
            </div>
            <Button className="w-full" onClick={addBudgetItem} disabled={!bLabel.trim()}>
              Add Item
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Potluck Dialog */}
      <Dialog open={addPotOpen} onOpenChange={setAddPotOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Potluck Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Item</Label>
              <Input placeholder="e.g. Veggie tray" value={pLabel} onChange={(e) => setPLabel(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={pCategory} onValueChange={setPCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POTLUCK_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Quantity needed</Label>
              <Input type="number" inputMode="numeric" placeholder="1" value={pQty} onChange={(e) => setPQty(e.target.value)} />
            </div>
            <Button className="w-full" onClick={addPotluck} disabled={!pLabel.trim()}>
              Add Item
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Vendor Dialog */}
      <Dialog open={addVendorOpen} onOpenChange={setAddVendorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Vendor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input placeholder="e.g. Sweet Tooth Bakery" value={vName} onChange={(e) => setVName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Input placeholder="e.g. Cake" value={vCategory} onChange={(e) => setVCategory(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={vStatus} onValueChange={setVStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VENDOR_STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Cost ($)</Label>
                <Input type="number" inputMode="decimal" placeholder="0" value={vCost} onChange={(e) => setVCost(e.target.value)} />
              </div>
            </div>
            <Button className="w-full" onClick={addVendor} disabled={!vName.trim()}>
              Add Vendor
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
};

export default PlanningPage;

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useEvent } from "@/hooks/useEvent";
import { supabase } from "@/integrations/supabase/client";
import { ClipboardList, Plus, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, isPast } from "date-fns";
import { CalendarIcon } from "lucide-react";

interface PlanningTask {
  id: string;
  title: string;
  assignee: string | null;
  due_date: string | null;
  completed: boolean;
}

const PlanningPage = () => {
  const { user } = useAuth();
  const { event } = useEvent();
  const [tasks, setTasks] = useState<PlanningTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAssignee, setNewAssignee] = useState("");
  const [newDueDate, setNewDueDate] = useState<Date>();

  const fetchTasks = async () => {
    if (!event) return;
    const { data } = await supabase.from("planning_tasks").select("*").eq("event_id", event.id).order("completed", { ascending: true }).order("due_date", { ascending: true, nullsFirst: false });
    setTasks((data as PlanningTask[]) || []);
    setLoading(false);
  };

  useEffect(() => { if (event) fetchTasks(); else setLoading(false); }, [event]);

  const handleAdd = async () => {
    if (!event || !user || !newTitle.trim()) return;
    const { error } = await supabase.from("planning_tasks").insert({
      event_id: event.id, user_id: user.id, title: newTitle.trim(),
      assignee: newAssignee.trim() || null,
      due_date: newDueDate ? format(newDueDate, "yyyy-MM-dd") : null,
    });
    if (error) { toast.error("Failed to add task"); return; }
    setNewTitle(""); setNewAssignee(""); setNewDueDate(undefined); setAddOpen(false);
    fetchTasks();
  };

  const toggleComplete = async (id: string, current: boolean) => {
    await supabase.from("planning_tasks").update({ completed: !current }).eq("id", id);
    fetchTasks();
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const overdueCount = tasks.filter((t) => !t.completed && t.due_date && isPast(new Date(t.due_date))).length;

  if (loading) return <MobileLayout><div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div></MobileLayout>;

  return (
    <MobileLayout>
      <div className="px-6 pt-12 pb-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" /><h1 className="text-2xl font-bold">Planning</h1></div>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild><Button size="sm" className="rounded-full h-8 gap-1"><Plus className="h-3.5 w-3.5" /> Add</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Task</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5"><Label>Task</Label><Input placeholder="e.g. Book venue" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Assignee (optional)</Label><Input placeholder="e.g. Mom" value={newAssignee} onChange={(e) => setNewAssignee(e.target.value)} /></div>
                <div className="space-y-1.5">
                  <Label>Due date (optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !newDueDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />{newDueDate ? format(newDueDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={newDueDate} onSelect={setNewDueDate} initialFocus className="p-3 pointer-events-auto" /></PopoverContent>
                  </Popover>
                </div>
                <Button className="w-full" onClick={handleAdd} disabled={!newTitle.trim()}>Add Task</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-sm text-muted-foreground">{completedCount}/{tasks.length} complete{overdueCount > 0 && ` · ${overdueCount} overdue`}</p>
      </div>

      {tasks.length > 0 && (
        <div className="px-6 mb-4">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${tasks.length ? (completedCount / tasks.length) * 100 : 0}%` }} />
          </div>
        </div>
      )}

      <div className="px-6 pb-6 space-y-2">
        {tasks.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No tasks yet — add your first planning task!</p>}
        {tasks.map((task) => {
          const isOverdue = !task.completed && task.due_date && isPast(new Date(task.due_date));
          return (
            <Card key={task.id} className={cn("border-none", task.completed && "opacity-60")}>
              <CardContent className="p-3 flex items-center gap-3">
                <Checkbox checked={task.completed} onCheckedChange={() => toggleComplete(task.id, task.completed)} />
                <div className="flex-1 min-w-0">
                  <p className={cn("font-semibold text-sm", task.completed && "line-through")}>{task.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {task.assignee && <span className="text-[10px] text-muted-foreground">👤 {task.assignee}</span>}
                    {task.due_date && (
                      <span className={cn("text-[10px]", isOverdue ? "text-destructive font-medium" : "text-muted-foreground")}>
                        {isOverdue && <AlertCircle className="h-3 w-3 inline mr-0.5" />}
                        📅 {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </MobileLayout>
  );
};

export default PlanningPage;

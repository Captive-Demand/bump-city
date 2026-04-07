import { useState, useEffect } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Shield, Plus, Pencil, Trash2, Users, Calendar, ShoppingBag, Settings, BarChart3, UserPlus, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEventRole } from "@/hooks/useEventRole";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

const AdminPage = () => {
  const { user } = useAuth();
  const { isAdmin, isSuperAdmin, loading: roleLoading } = useEventRole();

  // Stats
  const [stats, setStats] = useState({ profiles: 0, events: 0, registryItems: 0, vendors: 0, communityEvents: 0 });

  // Vendors
  const [vendors, setVendors] = useState<any[]>([]);
  const [vendorOpen, setVendorOpen] = useState(false);
  const [editVendor, setEditVendor] = useState<any>(null);
  const [vName, setVName] = useState(""); const [vCategory, setVCategory] = useState(""); const [vDesc, setVDesc] = useState(""); const [vCity, setVCity] = useState("Nashville"); const [vPhone, setVPhone] = useState(""); const [vWebsite, setVWebsite] = useState("");

  // Community Events
  const [communityEvents, setCommunityEvents] = useState<any[]>([]);
  const [ceOpen, setCeOpen] = useState(false);
  const [editCe, setEditCe] = useState<any>(null);
  const [ceTitle, setCeTitle] = useState(""); const [ceDesc, setCeDesc] = useState(""); const [ceLocation, setCeLocation] = useState(""); const [ceCity, setCeCity] = useState("Nashville"); const [ceDate, setCeDate] = useState("");

  // App Settings
  const [settings, setSettings] = useState<any[]>([]);
  const [settingsEdits, setSettingsEdits] = useState<Record<string, string>>({});

  // Admin management (super_admin only)
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [addingAdmin, setAddingAdmin] = useState(false);

  useEffect(() => {
    if (!roleLoading && isAdmin) fetchAll();
  }, [roleLoading, isAdmin]);

  const fetchAll = async () => {
    const [p, e, r, v, ce, s] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("events").select("id", { count: "exact", head: true }),
      supabase.from("registry_items").select("id", { count: "exact", head: true }),
      supabase.from("vendors").select("*").order("created_at", { ascending: false }),
      supabase.from("community_events").select("*").order("created_at", { ascending: false }),
      supabase.from("app_settings").select("*").order("key"),
    ]);
    setStats({ profiles: p.count || 0, events: e.count || 0, registryItems: r.count || 0, vendors: v.data?.length || 0, communityEvents: ce.data?.length || 0 });
    setVendors(v.data || []);
    setCommunityEvents(ce.data || []);
    setSettings(s.data || []);
    const edits: Record<string, string> = {};
    (s.data || []).forEach((row: any) => { edits[row.key] = row.value; });
    setSettingsEdits(edits);

    if (isSuperAdmin) {
      const { data: roles } = await supabase.from("user_roles").select("*");
      if (roles) {
        // Get profile display names for admin users
        const userIds = roles.map((r: any) => r.user_id);
        const { data: profiles } = await supabase.from("profiles").select("id, display_name").in("id", userIds);
        const profileMap = Object.fromEntries((profiles || []).map((p: any) => [p.id, p.display_name]));
        setAdminUsers(roles.map((r: any) => ({ ...r, display_name: profileMap[r.user_id] || "Unknown" })));
      }
    }
  };

  // Vendor CRUD
  const openVendorForm = (v?: any) => {
    if (v) { setEditVendor(v); setVName(v.name); setVCategory(v.category); setVDesc(v.description || ""); setVCity(v.city || "Nashville"); setVPhone(v.phone || ""); setVWebsite(v.website || ""); }
    else { setEditVendor(null); setVName(""); setVCategory(""); setVDesc(""); setVCity("Nashville"); setVPhone(""); setVWebsite(""); }
    setVendorOpen(true);
  };
  const saveVendor = async () => {
    const payload = { name: vName.trim(), category: vCategory.trim(), description: vDesc.trim() || null, city: vCity.trim() || null, phone: vPhone.trim() || null, website: vWebsite.trim() || null };
    if (!payload.name || !payload.category) { toast.error("Name and category required"); return; }
    if (editVendor) {
      const { error } = await supabase.from("vendors").update(payload).eq("id", editVendor.id);
      if (error) { toast.error("Failed to update"); return; }
    } else {
      const { error } = await supabase.from("vendors").insert(payload);
      if (error) { toast.error("Failed to add"); return; }
    }
    setVendorOpen(false); fetchAll(); toast.success("Vendor saved!");
  };
  const deleteVendor = async (id: string) => {
    const { error } = await supabase.from("vendors").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    fetchAll(); toast.success("Vendor deleted");
  };

  // Community Events CRUD
  const openCeForm = (ce?: any) => {
    if (ce) { setEditCe(ce); setCeTitle(ce.title); setCeDesc(ce.description || ""); setCeLocation(ce.location || ""); setCeCity(ce.city || "Nashville"); setCeDate(ce.event_date ? new Date(ce.event_date).toISOString().slice(0, 16) : ""); }
    else { setEditCe(null); setCeTitle(""); setCeDesc(""); setCeLocation(""); setCeCity("Nashville"); setCeDate(""); }
    setCeOpen(true);
  };
  const saveCe = async () => {
    const payload = { title: ceTitle.trim(), description: ceDesc.trim() || null, location: ceLocation.trim() || null, city: ceCity.trim() || null, event_date: ceDate || null };
    if (!payload.title) { toast.error("Title required"); return; }
    if (editCe) {
      const { error } = await supabase.from("community_events").update(payload).eq("id", editCe.id);
      if (error) { toast.error("Failed to update"); return; }
    } else {
      const { error } = await supabase.from("community_events").insert(payload);
      if (error) { toast.error("Failed to add"); return; }
    }
    setCeOpen(false); fetchAll(); toast.success("Event saved!");
  };
  const deleteCe = async (id: string) => {
    const { error } = await supabase.from("community_events").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    fetchAll(); toast.success("Event deleted");
  };

  // Settings save
  const saveSettings = async () => {
    for (const s of settings) {
      if (settingsEdits[s.key] !== s.value) {
        await supabase.from("app_settings").update({ value: settingsEdits[s.key], updated_at: new Date().toISOString() }).eq("id", s.id);
      }
    }
    fetchAll(); toast.success("Settings saved!");
  };

  // Admin management
  const addAdmin = async () => {
    if (!newAdminEmail.trim()) return;
    setAddingAdmin(true);
    // Find user by email in profiles (display_name might be email)
    const { data: profiles } = await supabase.from("profiles").select("id, display_name").ilike("display_name", newAdminEmail.trim());
    if (!profiles || profiles.length === 0) {
      toast.error("No user found with that email/name");
      setAddingAdmin(false);
      return;
    }
    const targetId = profiles[0].id;
    const { error } = await supabase.from("user_roles").insert({ user_id: targetId, role: "admin" as any });
    if (error) {
      toast.error(error.message.includes("duplicate") ? "User already has this role" : "Failed to add admin");
    } else {
      toast.success("Admin added!");
      setNewAdminEmail("");
      fetchAll();
    }
    setAddingAdmin(false);
  };

  const removeAdmin = async (roleId: string) => {
    const { error } = await supabase.from("user_roles").delete().eq("id", roleId);
    if (error) { toast.error("Failed to remove"); return; }
    fetchAll(); toast.success("Role removed");
  };

  if (roleLoading) return <MobileLayout><div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div></MobileLayout>;

  if (!isAdmin) return (
    <MobileLayout>
      <div className="px-6 pt-16 text-center">
        <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground">You need admin privileges to access this page.</p>
      </div>
    </MobileLayout>
  );

  return (
    <MobileLayout>
      <div className="px-6 pt-12 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          {isSuperAdmin && <Badge className="bg-amber-500/20 text-amber-700 text-[10px]"><Crown className="h-3 w-3 mr-0.5" /> Super Admin</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">Manage store items, vendors, and settings</p>
      </div>

      <div className="px-6 pb-6">
        <Tabs defaultValue="dashboard">
          <TabsList className="w-full mb-4 flex-wrap h-auto gap-1">
            <TabsTrigger value="dashboard" className="flex-1 gap-1 text-xs"><BarChart3 className="h-3 w-3" /> Stats</TabsTrigger>
            <TabsTrigger value="vendors" className="flex-1 gap-1 text-xs"><ShoppingBag className="h-3 w-3" /> Vendors</TabsTrigger>
            <TabsTrigger value="events" className="flex-1 gap-1 text-xs"><Calendar className="h-3 w-3" /> Events</TabsTrigger>
            <TabsTrigger value="settings" className="flex-1 gap-1 text-xs"><Settings className="h-3 w-3" /> Settings</TabsTrigger>
            {isSuperAdmin && <TabsTrigger value="admins" className="flex-1 gap-1 text-xs"><Users className="h-3 w-3" /> Admins</TabsTrigger>}
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="dashboard">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: "Users", value: stats.profiles, icon: Users },
                { label: "Events", value: stats.events, icon: Calendar },
                { label: "Registry Items", value: stats.registryItems, icon: ShoppingBag },
                { label: "Vendors", value: stats.vendors, icon: ShoppingBag },
                { label: "Community Events", value: stats.communityEvents, icon: Calendar },
              ].map((s) => (
                <Card key={s.label} className="border-none">
                  <CardContent className="p-4 text-center">
                    <s.icon className="h-5 w-5 text-primary mx-auto mb-1" />
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Vendors */}
          <TabsContent value="vendors">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm">{vendors.length} vendors</h3>
              <Button size="sm" className="rounded-full h-8 gap-1" onClick={() => openVendorForm()}><Plus className="h-3.5 w-3.5" /> Add</Button>
            </div>
            <div className="space-y-2">
              {vendors.map((v) => (
                <Card key={v.id} className="border-none">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{v.name}</p>
                      <div className="flex gap-1 mt-0.5"><Badge variant="secondary" className="text-[10px]">{v.category}</Badge><Badge variant="outline" className="text-[10px]">{v.city}</Badge></div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openVendorForm(v)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteVendor(v.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Dialog open={vendorOpen} onOpenChange={setVendorOpen}>
              <DialogContent>
                <DialogHeader><DialogTitle>{editVendor ? "Edit Vendor" : "Add Vendor"}</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1"><Label>Name *</Label><Input value={vName} onChange={(e) => setVName(e.target.value)} /></div>
                  <div className="space-y-1"><Label>Category *</Label><Input placeholder="e.g. Photography, Venue" value={vCategory} onChange={(e) => setVCategory(e.target.value)} /></div>
                  <div className="space-y-1"><Label>Description</Label><Textarea value={vDesc} onChange={(e) => setVDesc(e.target.value)} rows={2} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label>City</Label><Input value={vCity} onChange={(e) => setVCity(e.target.value)} /></div>
                    <div className="space-y-1"><Label>Phone</Label><Input value={vPhone} onChange={(e) => setVPhone(e.target.value)} /></div>
                  </div>
                  <div className="space-y-1"><Label>Website</Label><Input value={vWebsite} onChange={(e) => setVWebsite(e.target.value)} /></div>
                  <Button className="w-full" onClick={saveVendor}>Save</Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Community Events */}
          <TabsContent value="events">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm">{communityEvents.length} events</h3>
              <Button size="sm" className="rounded-full h-8 gap-1" onClick={() => openCeForm()}><Plus className="h-3.5 w-3.5" /> Add</Button>
            </div>
            <div className="space-y-2">
              {communityEvents.map((ce) => (
                <Card key={ce.id} className="border-none">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{ce.title}</p>
                      <p className="text-xs text-muted-foreground">{ce.event_date ? new Date(ce.event_date).toLocaleDateString() : "No date"} · {ce.city || "Nashville"}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openCeForm(ce)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteCe(ce.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Dialog open={ceOpen} onOpenChange={setCeOpen}>
              <DialogContent>
                <DialogHeader><DialogTitle>{editCe ? "Edit Event" : "Add Event"}</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1"><Label>Title *</Label><Input value={ceTitle} onChange={(e) => setCeTitle(e.target.value)} /></div>
                  <div className="space-y-1"><Label>Description</Label><Textarea value={ceDesc} onChange={(e) => setCeDesc(e.target.value)} rows={2} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label>Location</Label><Input value={ceLocation} onChange={(e) => setCeLocation(e.target.value)} /></div>
                    <div className="space-y-1"><Label>City</Label><Input value={ceCity} onChange={(e) => setCeCity(e.target.value)} /></div>
                  </div>
                  <div className="space-y-1"><Label>Date & Time</Label><Input type="datetime-local" value={ceDate} onChange={(e) => setCeDate(e.target.value)} /></div>
                  <Button className="w-full" onClick={saveCe}>Save</Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings">
            <Card className="border-none">
              <CardContent className="p-4 space-y-4">
                <h3 className="font-bold text-sm">App Settings</h3>
                {settings.map((s) => (
                  <div key={s.id} className="space-y-1">
                    <Label>{s.label || s.key}</Label>
                    <Input value={settingsEdits[s.key] || ""} onChange={(e) => setSettingsEdits((prev) => ({ ...prev, [s.key]: e.target.value }))} />
                  </div>
                ))}
                <Button className="w-full" onClick={saveSettings}>Save Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admin Management (super_admin only) */}
          {isSuperAdmin && (
            <TabsContent value="admins">
              <Card className="border-none mb-4">
                <CardContent className="p-4">
                  <h3 className="font-bold text-sm mb-3">Add Admin</h3>
                  <div className="flex gap-2">
                    <Input
                      placeholder="User email or display name"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      className="flex-1"
                    />
                    <Button size="sm" onClick={addAdmin} disabled={addingAdmin} className="gap-1">
                      <UserPlus className="h-3.5 w-3.5" /> {addingAdmin ? "..." : "Add"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <div className="space-y-2">
                {adminUsers.map((au) => (
                  <Card key={au.id} className="border-none">
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{au.display_name}</p>
                        <Badge variant={au.role === "super_admin" ? "default" : "secondary"} className="text-[10px]">
                          {au.role === "super_admin" ? "Super Admin" : au.role}
                        </Badge>
                      </div>
                      {au.role !== "super_admin" && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeAdmin(au.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </MobileLayout>
  );
};

export default AdminPage;

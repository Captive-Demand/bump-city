import { useState, useEffect } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Shield, Plus, Pencil, Trash2, Users, Calendar, ShoppingBag, Settings, BarChart3, Crown, Store, CheckCircle2, XCircle, ExternalLink, MessageSquare, ChevronDown, ChevronUp, KeyRound, Mail } from "lucide-react";
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
  const [vName, setVName] = useState(""); const [vCategory, setVCategory] = useState(""); const [vDesc, setVDesc] = useState(""); const [vCity, setVCity] = useState("Nashville"); const [vPhone, setVPhone] = useState(""); const [vWebsite, setVWebsite] = useState(""); const [vReferral, setVReferral] = useState(""); const [vDiscount, setVDiscount] = useState("");

  // Community Events
  const [communityEvents, setCommunityEvents] = useState<any[]>([]);
  const [ceOpen, setCeOpen] = useState(false);
  const [editCe, setEditCe] = useState<any>(null);
  const [ceTitle, setCeTitle] = useState(""); const [ceDesc, setCeDesc] = useState(""); const [ceLocation, setCeLocation] = useState(""); const [ceCity, setCeCity] = useState("Nashville"); const [ceDate, setCeDate] = useState(""); const [ceImageFile, setCeImageFile] = useState<File | null>(null); const [ceImagePreview, setCeImagePreview] = useState<string | null>(null);

  // App Settings
  const [settings, setSettings] = useState<any[]>([]);
  const [settingsEdits, setSettingsEdits] = useState<Record<string, string>>({});

  // User management
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [userRolesMap, setUserRolesMap] = useState<Record<string, { id: string; role: string }[]>>({});
  const [userPage, setUserPage] = useState(0);
  const [userTotal, setUserTotal] = useState(0);
  const [userSearch, setUserSearch] = useState("");
  const [addingRole, setAddingRole] = useState<string | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [userEmails, setUserEmails] = useState<Record<string, string>>({});
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);
  const [sendingReset, setSendingReset] = useState<string | null>(null);
  const [testSmsOpen, setTestSmsOpen] = useState(false);
  const [testSmsTo, setTestSmsTo] = useState("");
  const [testSmsSending, setTestSmsSending] = useState(false);
  const PAGE_SIZE = 20;

  useEffect(() => {
    if (!roleLoading && isAdmin) fetchAll();
  }, [roleLoading, isAdmin]);

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin, userPage, userSearch]);

  const fetchUsers = async () => {
    const from = userPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    let query = supabase.from("profiles").select("id, display_name, avatar_url, created_at, city", { count: "exact" });
    if (userSearch.trim()) {
      query = query.ilike("display_name", `%${userSearch.trim()}%`);
    }
    const { data, count } = await query.order("created_at", { ascending: false }).range(from, to);
    setAllUsers(data || []);
    setUserTotal(count || 0);

    // Fetch all roles
    const { data: roles } = await supabase.from("user_roles").select("*");
    const map: Record<string, { id: string; role: string }[]> = {};
    (roles || []).forEach((r: any) => {
      if (!map[r.user_id]) map[r.user_id] = [];
      map[r.user_id].push({ id: r.id, role: r.role });
    });
    setUserRolesMap(map);
  };

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
  };

  // Vendor CRUD
  const openVendorForm = (v?: any) => {
    if (v) { setEditVendor(v); setVName(v.name); setVCategory(v.category); setVDesc(v.description || ""); setVCity(v.city || "Nashville"); setVPhone(v.phone || ""); setVWebsite(v.website || ""); setVReferral(v.referral_code || ""); setVDiscount(v.discount_code || ""); }
    else { setEditVendor(null); setVName(""); setVCategory(""); setVDesc(""); setVCity("Nashville"); setVPhone(""); setVWebsite(""); setVReferral(""); setVDiscount(""); }
    setVendorOpen(true);
  };
  const saveVendor = async () => {
    const payload = { name: vName.trim(), category: vCategory.trim(), description: vDesc.trim() || null, city: vCity.trim() || null, phone: vPhone.trim() || null, website: vWebsite.trim() || null, referral_code: vReferral.trim() || null, discount_code: vDiscount.trim() || null };
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
    if (ce) { setEditCe(ce); setCeTitle(ce.title); setCeDesc(ce.description || ""); setCeLocation(ce.location || ""); setCeCity(ce.city || "Nashville"); setCeDate(ce.event_date ? new Date(ce.event_date).toISOString().slice(0, 16) : ""); setCeImagePreview(ce.image_url || null); }
    else { setEditCe(null); setCeTitle(""); setCeDesc(""); setCeLocation(""); setCeCity("Nashville"); setCeDate(""); setCeImagePreview(null); }
    setCeImageFile(null);
    setCeOpen(true);
  };
  const saveCe = async () => {
    const payload: any = { title: ceTitle.trim(), description: ceDesc.trim() || null, location: ceLocation.trim() || null, city: ceCity.trim() || null, event_date: ceDate || null };
    if (!payload.title) { toast.error("Title required"); return; }

    // Upload image if selected
    if (ceImageFile) {
      const fileExt = ceImageFile.name.split(".").pop();
      const filePath = `community-events/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("uploads").upload(filePath, ceImageFile);
      if (uploadError) { toast.error("Image upload failed"); return; }
      const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(filePath);
      payload.image_url = urlData.publicUrl;
    }

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

  const addRoleToUser = async (userId: string, role: string) => {
    setAddingRole(userId);
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: role as any });
    if (error) {
      toast.error(error.message.includes("duplicate") ? "User already has this role" : "Failed to add role");
    } else {
      toast.success("Role added!");
      fetchUsers();
    }
    setAddingRole(null);
  };

  const removeRole = async (roleId: string) => {
    const { error } = await supabase.from("user_roles").delete().eq("id", roleId);
    if (error) { toast.error("Failed to remove"); return; }
    fetchUsers(); toast.success("Role removed");
  };

  const toggleExpandUser = async (userId: string) => {
    if (expandedUser === userId) { setExpandedUser(null); return; }
    setExpandedUser(userId);
    if (!userEmails[userId]) {
      setLoadingEmail(userId);
      try {
        const res = await supabase.functions.invoke("admin-user-actions", {
          body: { action: "get_email", userId },
        });
        if (res.data?.email) setUserEmails((prev) => ({ ...prev, [userId]: res.data.email }));
      } catch { /* ignore */ }
      setLoadingEmail(null);
    }
  };

  const sendPasswordReset = async (userId: string) => {
    setSendingReset(userId);
    try {
      const res = await supabase.functions.invoke("admin-user-actions", {
        body: { action: "reset_password", userId },
      });
      if (res.data?.success) toast.success(`Password reset sent to ${res.data.email}`);
      else toast.error(res.data?.error || "Failed to send reset");
    } catch { toast.error("Failed to send reset"); }
    setSendingReset(null);
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
            <TabsTrigger value="users" className="flex-1 gap-1 text-xs"><Users className="h-3 w-3" /> Users</TabsTrigger>
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
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label>Discount code (public)</Label><Input placeholder="BUMP10" value={vDiscount} onChange={(e) => setVDiscount(e.target.value)} /></div>
                    <div className="space-y-1"><Label>Referral code (private)</Label><Input placeholder="BUMPCITY" value={vReferral} onChange={(e) => setVReferral(e.target.value)} /></div>
                  </div>
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
                  <div className="space-y-1">
                    <Label>Event Image</Label>
                    <div className="flex items-center gap-3">
                      {(ceImagePreview || (ceImageFile && URL.createObjectURL(ceImageFile))) && (
                        <img src={ceImageFile ? URL.createObjectURL(ceImageFile) : ceImagePreview!} alt="Preview" className="h-16 w-16 rounded-lg object-cover" />
                      )}
                      <Input type="file" accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) { setCeImageFile(file); setCeImagePreview(null); }
                      }} />
                    </div>
                  </div>
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
          <TabsContent value="settings" className="space-y-4">
            {/* Shopify Integration — managed by Lovable native integration */}
            <Card className="border-none">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-primary" />
                  <h3 className="font-bold text-sm">Shopify Integration</h3>
                  <Badge className="bg-green-500/20 text-green-700 text-[10px] ml-auto">
                    <CheckCircle2 className="h-3 w-3 mr-0.5" /> Connected
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Bump City Boutique is connected via Lovable's native Shopify integration. Products sync automatically — no manual tokens required.
                </p>
                <p className="text-xs text-muted-foreground">
                  To manage products, change stores, or disconnect, ask the Lovable assistant.
                </p>
              </CardContent>
            </Card>

            {/* Twilio SMS Integration */}
            <Card className="border-none">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <h3 className="font-bold text-sm">SMS / Twilio Integration</h3>
                  {settingsEdits["twilio_account_sid"] && settingsEdits["twilio_auth_token"] && settingsEdits["twilio_phone_number"] ? (
                    <Badge className="bg-green-500/20 text-green-700 text-[10px] ml-auto"><CheckCircle2 className="h-3 w-3 mr-0.5" /> Connected</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] ml-auto"><XCircle className="h-3 w-3 mr-0.5" /> Not Connected</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Connect your Twilio account to send SMS invites, RSVP confirmations, and event reminders.</p>
                <div className="space-y-1">
                  <Label>Account SID</Label>
                  <Input
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    value={settingsEdits["twilio_account_sid"] || ""}
                    onChange={(e) => setSettingsEdits((prev) => ({ ...prev, twilio_account_sid: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Auth Token</Label>
                  <Input
                    type="password"
                    placeholder="Your Twilio Auth Token"
                    value={settingsEdits["twilio_auth_token"] || ""}
                    onChange={(e) => setSettingsEdits((prev) => ({ ...prev, twilio_auth_token: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Phone Number</Label>
                  <Input
                    placeholder="+15017122661"
                    value={settingsEdits["twilio_phone_number"] || ""}
                    onChange={(e) => setSettingsEdits((prev) => ({ ...prev, twilio_phone_number: e.target.value }))}
                  />
                </div>
                <div className="rounded-lg bg-muted p-3 space-y-1">
                  <p className="text-xs font-medium">How to get your Twilio credentials:</p>
                  <ol className="text-xs text-muted-foreground list-decimal list-inside space-y-0.5">
                    <li>Sign up at <a href="https://www.twilio.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">twilio.com</a></li>
                    <li>Go to Console Dashboard — your Account SID and Auth Token are displayed</li>
                    <li>Buy or use a Twilio phone number for sending SMS</li>
                  </ol>
                  <a href="https://www.twilio.com/docs/sms" target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1 mt-1">
                    <ExternalLink className="h-3 w-3" /> Twilio SMS Docs
                  </a>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={saveSettings}>
                    {settingsEdits["twilio_account_sid"] && settingsEdits["twilio_auth_token"] && settingsEdits["twilio_phone_number"] ? "Update Connection" : "Connect Twilio"}
                  </Button>
                  <Button variant="outline" onClick={() => setTestSmsOpen(true)} disabled={!settingsEdits["twilio_account_sid"]}>
                    Test SMS
                  </Button>
                  {settingsEdits["twilio_account_sid"] && (
                    <Button variant="outline" className="text-destructive" onClick={() => {
                      setSettingsEdits((prev) => ({ ...prev, twilio_account_sid: "", twilio_auth_token: "", twilio_phone_number: "" }));
                      toast.info("Click Save to disconnect");
                    }}>
                      Disconnect
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* General App Settings */}
            <Card className="border-none">
              <CardContent className="p-4 space-y-4">
                <h3 className="font-bold text-sm">General Settings</h3>
                {settings.filter((s) => !s.key.startsWith("shopify_") && !s.key.startsWith("twilio_")).map((s) => (
                  <div key={s.id} className="space-y-1">
                    <Label>{s.label || s.key}</Label>
                    <Input value={settingsEdits[s.key] || ""} onChange={(e) => setSettingsEdits((prev) => ({ ...prev, [s.key]: e.target.value }))} />
                  </div>
                ))}
                <Button className="w-full" onClick={saveSettings}>Save Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Management */}
          <TabsContent value="users">
            <div className="mb-3">
              <Input
                placeholder="Search by name..."
                value={userSearch}
                onChange={(e) => { setUserSearch(e.target.value); setUserPage(0); }}
              />
            </div>
            <p className="text-xs text-muted-foreground mb-3">{userTotal} users total · Page {userPage + 1} of {Math.max(1, Math.ceil(userTotal / PAGE_SIZE))}</p>
            <div className="space-y-2">
              {allUsers.map((u) => {
                const roles = userRolesMap[u.id] || [];
                const isExpanded = expandedUser === u.id;
                return (
                  <Card key={u.id} className="border-none">
                    <CardContent className="p-3">
                      <button className="flex items-center gap-3 w-full text-left" onClick={() => toggleExpandUser(u.id)}>
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                          {u.avatar_url ? <img src={u.avatar_url} className="h-8 w-8 rounded-full object-cover" /> : (u.display_name?.[0] || "?")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{u.display_name || "Unknown"}</p>
                          <p className="text-[10px] text-muted-foreground">{u.city || "No city"} · Joined {new Date(u.created_at).toLocaleDateString()}</p>
                        </div>
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                      </button>
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-border space-y-3">
                          <div className="flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            {loadingEmail === u.id ? (
                              <span className="text-xs text-muted-foreground">Loading...</span>
                            ) : userEmails[u.id] ? (
                              <span className="text-xs">{userEmails[u.id]}</span>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">Could not load email</span>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-xs"
                            disabled={sendingReset === u.id || !userEmails[u.id]}
                            onClick={() => sendPasswordReset(u.id)}
                          >
                            <KeyRound className="h-3.5 w-3.5" />
                            {sendingReset === u.id ? "Sending..." : "Send Password Reset"}
                          </Button>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {roles.length === 0 && <span className="text-[10px] text-muted-foreground italic">No roles</span>}
                        {roles.map((r) => (
                          <Badge key={r.id} variant={r.role === "super_admin" ? "default" : "secondary"} className="text-[10px] gap-0.5">
                            {r.role === "super_admin" ? "Super Admin" : r.role}
                            {isSuperAdmin && r.role !== "super_admin" && (
                              <button onClick={() => removeRole(r.id)} className="ml-0.5 hover:text-destructive">×</button>
                            )}
                          </Badge>
                        ))}
                        {isSuperAdmin && (
                          <select
                            className="text-[10px] border rounded px-1 py-0.5 bg-background"
                            value=""
                            disabled={addingRole === u.id}
                            onChange={(e) => { if (e.target.value) addRoleToUser(u.id, e.target.value); }}
                          >
                            <option value="">+ Add role</option>
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                            <option value="moderator">moderator</option>
                          </select>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            {userTotal > PAGE_SIZE && (
              <div className="flex justify-between items-center mt-4">
                <Button variant="outline" size="sm" disabled={userPage === 0} onClick={() => setUserPage((p) => p - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={(userPage + 1) * PAGE_SIZE >= userTotal} onClick={() => setUserPage((p) => p + 1)}>Next</Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Test SMS Dialog */}
      <Dialog open={testSmsOpen} onOpenChange={setTestSmsOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Send Test SMS</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Phone number (E.164)</Label>
              <Input placeholder="+15558675310" value={testSmsTo} onChange={(e) => setTestSmsTo(e.target.value)} />
            </div>
            <Button
              className="w-full"
              disabled={!testSmsTo.trim() || testSmsSending}
              onClick={async () => {
                setTestSmsSending(true);
                try {
                  const { error } = await supabase.functions.invoke("send-sms", {
                    body: { to: testSmsTo.trim(), message: "This is a test from Bump City." },
                  });
                  if (error) throw error;
                  toast.success("Test SMS sent!");
                  setTestSmsOpen(false);
                  setTestSmsTo("");
                } catch (err: any) {
                  toast.error(err?.message || "Failed to send test SMS");
                } finally {
                  setTestSmsSending(false);
                }
              }}
            >
              {testSmsSending ? "Sending..." : "Send Test"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
};

export default AdminPage;

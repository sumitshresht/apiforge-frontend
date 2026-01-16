"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Lock, Save, Loader2 } from "lucide-react";

export default function ProfilePage() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState({ fullName: "", email: "", initials: "" });
  
  // Form States
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    // Load initial data from localStorage (fastest way)
    const stored = localStorage.getItem("user");
    if (stored) {
        const u = JSON.parse(stored);
        // Backend sends firstName/lastName, we combine or use fullName depending on your JwtResponse
        const name = u.fullName || (u.firstName + " " + u.lastName) || "User";
        
        setUser({
            fullName: name,
            email: u.email,
            initials: name.substring(0, 2).toUpperCase()
        });
        setFullName(name);
    }
  }, []);

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
        await api.put("/user/profile", { fullName });
        
        // Update local storage to reflect changes immediately
        const stored = localStorage.getItem("user");
        if (stored) {
            const u = JSON.parse(stored);
            u.fullName = fullName;
            u.firstName = fullName.split(" ")[0]; // basic split
            localStorage.setItem("user", JSON.stringify(u));
        }
        
        // Reload page to refresh TopBar
        window.location.reload(); 
        alert("Profile updated!");
    } catch (e) {
        alert("Failed to update profile");
    } finally {
        setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (password !== confirmPassword) {
        alert("Passwords do not match");
        return;
    }
    if (password.length < 6) {
        alert("Password must be at least 6 characters");
        return;
    }
    
    setLoading(true);
    try {
        await api.put("/user/profile", { password });
        alert("Password changed successfully");
        setPassword("");
        setConfirmPassword("");
    } catch (e) {
        alert("Failed to change password");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="container max-w-4xl py-10">
      <h1 className="text-3xl font-bold mb-8">Account Settings</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8">
        
        {/* Left: User Card */}
        <Card>
            <CardContent className="pt-6 flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4 border-2 border-primary/10">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-2xl bg-primary/5 text-primary font-bold">
                        {user.initials}
                    </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-bold">{user.fullName}</h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <div className="mt-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active Member
                </div>
            </CardContent>
        </Card>

        {/* Right: Settings Tabs */}
        <div className="flex-1">
            <Tabs defaultValue="general" className="w-full">
                <TabsList className="mb-4 w-full justify-start">
                    <TabsTrigger value="general" className="gap-2"><User className="h-4 w-4"/> General</TabsTrigger>
                    <TabsTrigger value="security" className="gap-2"><Lock className="h-4 w-4"/> Security</TabsTrigger>
                </TabsList>

                {/* GENERAL TAB */}
                <TabsContent value="general">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Information</CardTitle>
                            <CardDescription>Update your personal details here.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Full Name</Label>
                                <Input value={fullName} onChange={e => setFullName(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Email Address</Label>
                                <Input value={user.email} disabled className="bg-muted text-muted-foreground" />
                                <p className="text-[10px] text-muted-foreground">Email cannot be changed.</p>
                            </div>
                            <div className="flex justify-end pt-4">
                                <Button onClick={handleUpdateProfile} disabled={loading} className="gap-2">
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    Save Changes
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* SECURITY TAB */}
                <TabsContent value="security">
                    <Card>
                        <CardHeader>
                            <CardTitle>Security</CardTitle>
                            <CardDescription>Update your password to keep your account safe.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>New Password</Label>
                                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Confirm New Password</Label>
                                <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                            </div>
                            <div className="flex justify-end pt-4">
                                <Button onClick={handleChangePassword} disabled={loading} variant="outline" className="gap-2">
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                                    Update Password
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
      </div>
    </div>
  );
}
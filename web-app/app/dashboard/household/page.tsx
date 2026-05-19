"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Users, Plus, Crown, User, Copy, Check } from "lucide-react";
import { getInitials } from "@/lib/utils";

interface Member {
  id: string;
  role: string;
  joined_at: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    profile_picture_url: string | null;
  };
}

interface Household {
  id: string;
  name: string;
  created_at: string;
  members: Member[];
}

export default function HouseholdPage() {
  const { data: session } = useSession();
  const [household, setHousehold] = useState<Household | null>(null);
  const [role, setRole] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [householdName, setHouseholdName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchHousehold();
  }, []);

  const fetchHousehold = async () => {
    try {
      const res = await fetch("/api/households");
      const data = await res.json();
      setHousehold(data.household);
      setRole(data.role || "");
    } catch (error) {
      console.error("Error fetching household:", error);
    } finally {
      setLoading(false);
    }
  };

  const createHousehold = async () => {
    if (!householdName.trim()) return;
    
    setCreating(true);
    try {
      const res = await fetch("/api/households", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: householdName }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setHousehold(data.household);
        setRole("owner");
        setCreateDialogOpen(false);
        setHouseholdName("");
      }
    } catch (error) {
      console.error("Error creating household:", error);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!household) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Household</h1>
        
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <CardTitle>No Household Yet</CardTitle>
            <CardDescription>
              Create a new household or join an existing one to get started.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Household
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Household</DialogTitle>
                  <DialogDescription>
                    Give your household a name to get started.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Household Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., 123 Main Street"
                      value={householdName}
                      onChange={(e) => setHouseholdName(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={createHousehold}
                    disabled={creating || !householdName.trim()}
                  >
                    {creating ? "Creating..." : "Create"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{household.name}</h1>
          <p className="text-muted-foreground">
            Manage your household members
          </p>
        </div>
        {role === "owner" && (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Invite Member
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>
            {household.members.length} member{household.members.length !== 1 ? "s" : ""} in your household
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {household.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-4 p-4 rounded-lg border"
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={member.user.profile_picture_url || ""} />
                  <AvatarFallback>
                    {getInitials(member.user.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{member.user.full_name}</p>
                    {member.role === "owner" ? (
                      <Badge variant="default" className="gap-1">
                        <Crown className="h-3 w-3" />
                        Owner
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <User className="h-3 w-3" />
                        Member
                      </Badge>
                    )}
                    {member.user.id === session?.user?.id && (
                      <Badge variant="outline">You</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {member.user.email}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

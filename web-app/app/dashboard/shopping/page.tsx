"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, ShoppingCart, Archive, Check, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ShoppingList {
  id: string;
  name: string;
  description: string | null;
  status: "active" | "archived";
  created_at: string;
  creator: {
    id: string;
    full_name: string;
    email: string;
  };
  _count: {
    items: number;
  };
}

export default function ShoppingPage() {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchHouseholdAndLists();
  }, []);

  const fetchHouseholdAndLists = async () => {
    try {
      const householdRes = await fetch("/api/households");
      const householdData = await householdRes.json();

      if (householdData.household) {
        setHouseholdId(householdData.household.id);

        const listsRes = await fetch(
          `/api/shopping-lists?household_id=${householdData.household.id}`
        );
        const listsData = await listsRes.json();
        setLists(listsData.lists || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const createList = async () => {
    if (!name.trim() || !householdId) return;

    setCreating(true);
    try {
      const res = await fetch("/api/shopping-lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          household_id: householdId,
          name,
          description: description || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setLists([{ ...data.list, _count: { items: 0 } }, ...lists]);
        setDialogOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error("Error creating list:", error);
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
  };

  const activeLists = lists.filter((l) => l.status === "active");
  const archivedLists = lists.filter((l) => l.status === "archived");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!householdId) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardContent className="pt-6 text-center">
          <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Household</h2>
          <p className="text-muted-foreground">
            Join or create a household to manage shopping lists.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Shopping Lists</h1>
          <p className="text-muted-foreground">
            Collaborative shopping for your household
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New List
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Shopping List</DialogTitle>
              <DialogDescription>
                Start a new shopping list for your household.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">List Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Weekly Groceries"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Add notes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={createList} disabled={creating || !name.trim()}>
                {creating ? "Creating..." : "Create List"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Lists */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Active Lists</h2>
        {activeLists.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No active shopping lists</p>
              <Button
                variant="link"
                onClick={() => setDialogOpen(true)}
                className="mt-2"
              >
                Create your first list
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeLists.map((list) => (
              <Link key={list.id} href={`/dashboard/shopping/${list.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{list.name}</CardTitle>
                      <Badge variant="default">Active</Badge>
                    </div>
                    {list.description && (
                      <CardDescription className="line-clamp-2">
                        {list.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <ShoppingCart className="h-4 w-4" />
                        {list._count.items} item{list._count.items !== 1 ? "s" : ""}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDate(list.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      by {list.creator.full_name}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Archived Lists */}
      {archivedLists.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Archived Lists
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {archivedLists.map((list) => (
              <Link key={list.id} href={`/dashboard/shopping/${list.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer opacity-75">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{list.name}</CardTitle>
                      <Badge variant="secondary">Archived</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{list._count.items} items</span>
                      <span>{formatDate(list.created_at)}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

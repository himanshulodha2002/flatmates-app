"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  ShoppingCart,
  ArrowLeft,
  Check,
  Trash2,
  Package,
} from "lucide-react";
import { getInitials, formatCurrency } from "@/lib/utils";

interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: string | null;
  category: string | null;
  is_purchased: boolean;
  price: string | null;
  notes: string | null;
  assigned_to: {
    id: string;
    full_name: string;
    email: string;
  } | null;
  creator: {
    id: string;
    full_name: string;
  };
}

interface ShoppingList {
  id: string;
  name: string;
  description: string | null;
  status: "active" | "archived";
  household_id: string;
  creator: {
    id: string;
    full_name: string;
    email: string;
  };
  items: ShoppingItem[];
}

interface Member {
  id: string;
  user_id: string;
  user: {
    id: string;
    full_name: string;
    email: string;
  };
}

const CATEGORIES = [
  "Produce",
  "Dairy",
  "Meat",
  "Bakery",
  "Frozen",
  "Beverages",
  "Snacks",
  "Household",
  "Personal Care",
  "Other",
];

export default function ShoppingListDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listId = params.id as string;

  const [list, setList] = useState<ShoppingList | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("");
  const [category, setCategory] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [notes, setNotes] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchData();
  }, [listId]);

  const fetchData = async () => {
    try {
      // Fetch list with items
      const listRes = await fetch(`/api/shopping-lists/${listId}`);
      if (!listRes.ok) {
        router.push("/dashboard/shopping");
        return;
      }
      const listData = await listRes.json();
      setList(listData.list);

      // Fetch household members
      const householdRes = await fetch("/api/households");
      const householdData = await householdRes.json();
      if (householdData.household) {
        setMembers(householdData.household.members || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const addItem = async () => {
    if (!itemName.trim()) return;

    setAdding(true);
    try {
      const res = await fetch(`/api/shopping-lists/${listId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: itemName,
          quantity: parseFloat(quantity) || 1,
          unit: unit || null,
          category: category || null,
          assigned_to_id: assignedToId || null,
          notes: notes || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setList((prev) =>
          prev ? { ...prev, items: [...prev.items, data.item] } : prev
        );
        setDialogOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error("Error adding item:", error);
    } finally {
      setAdding(false);
    }
  };

  const toggleItemPurchased = async (item: ShoppingItem) => {
    try {
      const res = await fetch(
        `/api/shopping-lists/${listId}/items/${item.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_purchased: !item.is_purchased }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        setList((prev) =>
          prev
            ? {
                ...prev,
                items: prev.items.map((i) =>
                  i.id === item.id ? data.item : i
                ),
              }
            : prev
        );
      }
    } catch (error) {
      console.error("Error updating item:", error);
    }
  };

  const deleteItem = async (itemId: string) => {
    try {
      const res = await fetch(
        `/api/shopping-lists/${listId}/items/${itemId}`,
        {
          method: "DELETE",
        }
      );

      if (res.ok) {
        setList((prev) =>
          prev
            ? { ...prev, items: prev.items.filter((i) => i.id !== itemId) }
            : prev
        );
      }
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const resetForm = () => {
    setItemName("");
    setQuantity("1");
    setUnit("");
    setCategory("");
    setAssignedToId("");
    setNotes("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!list) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">List not found</p>
        <Link href="/dashboard/shopping">
          <Button variant="link">Go back to lists</Button>
        </Link>
      </div>
    );
  }

  const purchasedCount = list.items.filter((i) => i.is_purchased).length;
  const progress =
    list.items.length > 0
      ? Math.round((purchasedCount / list.items.length) * 100)
      : 0;

  const pendingItems = list.items.filter((i) => !i.is_purchased);
  const purchasedItems = list.items.filter((i) => i.is_purchased);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/dashboard/shopping"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to lists
          </Link>
          <h1 className="text-3xl font-bold">{list.name}</h1>
          {list.description && (
            <p className="text-muted-foreground mt-1">{list.description}</p>
          )}
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Item</DialogTitle>
              <DialogDescription>
                Add a new item to your shopping list.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="itemName">Item Name</Label>
                <Input
                  id="itemName"
                  placeholder="e.g., Milk"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit (optional)</Label>
                  <Input
                    id="unit"
                    placeholder="e.g., lbs, oz, pcs"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Assign To</Label>
                <Select value={assignedToId} onValueChange={setAssignedToId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {members.map((member) => (
                      <SelectItem key={member.user.id} value={member.user.id}>
                        {member.user.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Input
                  id="notes"
                  placeholder="e.g., Get the organic one"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={addItem} disabled={adding || !itemName.trim()}>
                {adding ? "Adding..." : "Add Item"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Shopping Progress</span>
            <span className="text-sm text-muted-foreground">
              {purchasedCount} of {list.items.length} items
            </span>
          </div>
          <Progress value={progress} className="h-3" />
        </CardContent>
      </Card>

      {/* Items */}
      <div className="space-y-6">
        {/* Pending Items */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Package className="h-5 w-5" />
            To Buy ({pendingItems.length})
          </h2>
          {pendingItems.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  All items purchased! 🎉
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {pendingItems.map((item) => (
                <Card key={item.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Checkbox
                        checked={item.is_purchased}
                        onCheckedChange={() => toggleItemPurchased(item)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.name}</span>
                          <span className="text-muted-foreground">
                            × {item.quantity}
                            {item.unit && ` ${item.unit}`}
                          </span>
                          {item.category && (
                            <Badge variant="outline">{item.category}</Badge>
                          )}
                        </div>
                        {item.notes && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.notes}
                          </p>
                        )}
                        {item.assigned_to && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <Avatar className="h-4 w-4">
                              <AvatarFallback className="text-[8px]">
                                {getInitials(item.assigned_to.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            {item.assigned_to.full_name}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteItem(item.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Purchased Items */}
        {purchasedItems.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-green-600">
              <Check className="h-5 w-5" />
              Purchased ({purchasedItems.length})
            </h2>
            <div className="space-y-2 opacity-75">
              {purchasedItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Checkbox
                        checked={item.is_purchased}
                        onCheckedChange={() => toggleItemPurchased(item)}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="font-medium line-through text-muted-foreground">
                          {item.name}
                        </span>
                        <span className="text-muted-foreground ml-2">
                          × {item.quantity}
                          {item.unit && ` ${item.unit}`}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteItem(item.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

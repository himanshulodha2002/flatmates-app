"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Receipt, DollarSign, Check, Clock, Users } from "lucide-react";
import { getInitials, formatCurrency, formatDate } from "@/lib/utils";

interface ExpenseSplit {
  id: string;
  user_id: string;
  amount_owed: string;
  is_settled: boolean;
  user: {
    id: string;
    full_name: string;
    email: string;
  };
}

interface Expense {
  id: string;
  amount: string;
  description: string;
  category: string;
  payment_method: string;
  date: string;
  split_type: string;
  is_personal: boolean;
  created_at: string;
  creator: {
    id: string;
    full_name: string;
    email: string;
    profile_picture_url: string | null;
  };
  splits: ExpenseSplit[];
}

const CATEGORIES = [
  "groceries",
  "utilities",
  "rent",
  "internet",
  "cleaning",
  "maintenance",
  "entertainment",
  "food",
  "transportation",
  "other",
];

const PAYMENT_METHODS = [
  "cash",
  "card",
  "bank_transfer",
  "digital_wallet",
  "other",
];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  // Form state
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("other");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [isPersonal, setIsPersonal] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchHouseholdAndExpenses();
  }, []);

  const fetchHouseholdAndExpenses = async () => {
    try {
      const householdRes = await fetch("/api/households");
      const householdData = await householdRes.json();

      if (householdData.household) {
        setHouseholdId(householdData.household.id);

        const expensesRes = await fetch(
          `/api/expenses?household_id=${householdData.household.id}`
        );
        const expensesData = await expensesRes.json();
        setExpenses(expensesData.expenses || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const createExpense = async () => {
    if (!amount || !description.trim() || !householdId) return;

    setCreating(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          household_id: householdId,
          amount: parseFloat(amount),
          description,
          category,
          payment_method: paymentMethod,
          split_type: "equal",
          is_personal: isPersonal,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setExpenses([data.expense, ...expenses]);
        setDialogOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error("Error creating expense:", error);
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setAmount("");
    setDescription("");
    setCategory("other");
    setPaymentMethod("cash");
    setIsPersonal(false);
  };

  const totalExpenses = expenses.reduce(
    (sum, e) => sum + parseFloat(e.amount),
    0
  );

  const getCategoryIcon = (cat: string) => {
    const icons: Record<string, string> = {
      groceries: "🛒",
      utilities: "💡",
      rent: "🏠",
      internet: "🌐",
      cleaning: "🧹",
      maintenance: "🔧",
      entertainment: "🎬",
      food: "🍕",
      transportation: "🚗",
      other: "📦",
    };
    return icons[cat] || "📦";
  };

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
          <Receipt className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Household</h2>
          <p className="text-muted-foreground">
            Join or create a household to track expenses.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Expenses</h1>
          <p className="text-muted-foreground">
            Track and split household expenses
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Expense</DialogTitle>
              <DialogDescription>
                Record a new expense to split with your flatmates.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-9"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="e.g., Weekly groceries"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {getCategoryIcon(cat)} {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((method) => (
                        <SelectItem key={method} value={method}>
                          {method.replace("_", " ").charAt(0).toUpperCase() +
                            method.replace("_", " ").slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="personal"
                  checked={isPersonal}
                  onChange={(e) => setIsPersonal(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="personal" className="text-sm">
                  Personal expense (don&apos;t split with others)
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={createExpense}
                disabled={creating || !amount || !description.trim()}
              >
                {creating ? "Adding..." : "Add Expense"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">
              {expenses.length} expense{expenses.length !== 1 ? "s" : ""} recorded
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Shared Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                expenses
                  .filter((e) => !e.is_personal)
                  .reduce((sum, e) => sum + parseFloat(e.amount), 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">Split among flatmates</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Personal Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                expenses
                  .filter((e) => e.is_personal)
                  .reduce((sum, e) => sum + parseFloat(e.amount), 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">Not split</p>
          </CardContent>
        </Card>
      </div>

      {/* Expense List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
          <CardDescription>All household expenses</CardDescription>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No expenses recorded yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-start gap-4 p-4 rounded-lg border hover:shadow-sm transition-shadow"
                >
                  <div className="text-3xl">{getCategoryIcon(expense.category)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{expense.description}</h3>
                      <Badge variant="outline">
                        {expense.category}
                      </Badge>
                      {expense.is_personal && (
                        <Badge variant="secondary">Personal</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(expense.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Avatar className="h-4 w-4">
                          <AvatarImage src={expense.creator.profile_picture_url || ""} />
                          <AvatarFallback className="text-[8px]">
                            {getInitials(expense.creator.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        {expense.creator.full_name}
                      </span>
                      {!expense.is_personal && expense.splits.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Split {expense.splits.length} ways
                        </span>
                      )}
                    </div>
                    {/* Show splits */}
                    {!expense.is_personal && expense.splits.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {expense.splits.map((split) => (
                          <div
                            key={split.id}
                            className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-full"
                          >
                            <span>{split.user.full_name}</span>
                            <span className="font-medium">
                              {formatCurrency(parseFloat(split.amount_owed))}
                            </span>
                            {split.is_settled ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Clock className="h-3 w-3 text-yellow-500" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      {formatCurrency(parseFloat(expense.amount))}
                    </div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {expense.payment_method.replace("_", " ")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

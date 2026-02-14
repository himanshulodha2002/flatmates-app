import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  ListChecks,
  Receipt,
  ShoppingCart,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  // Get user's household membership
  const membership = await prisma.householdMember.findFirst({
    where: { user_id: session.user.id },
    include: {
      household: true,
    },
  });

  let stats = {
    todosPending: 0,
    todosCompleted: 0,
    todosTotal: 0,
    expensesTotal: 0,
    expensesPending: 0,
    shoppingItemsPending: 0,
    memberCount: 0,
  };

  let recentTodos: any[] = [];
  let recentExpenses: any[] = [];

  if (membership) {
    const householdId = membership.household_id;

    // Get todo stats
    const todos = await prisma.todo.findMany({
      where: { household_id: householdId },
    });

    stats.todosTotal = todos.length;
    stats.todosPending = todos.filter((t) => t.status === "pending").length;
    stats.todosCompleted = todos.filter((t) => t.status === "completed").length;

    // Get expense stats
    const expenses = await prisma.expense.findMany({
      where: { household_id: householdId, is_personal: false },
    });

    stats.expensesTotal = expenses.reduce(
      (sum, e) => sum + Number(e.amount),
      0
    );

    const unsettledSplits = await prisma.expenseSplit.count({
      where: {
        expense: { household_id: householdId },
        is_settled: false,
        user_id: { not: session.user.id },
      },
    });
    stats.expensesPending = unsettledSplits;

    // Get shopping stats
    const shoppingItems = await prisma.shoppingListItem.count({
      where: {
        shopping_list: { household_id: householdId, status: "active" },
        is_purchased: false,
      },
    });
    stats.shoppingItemsPending = shoppingItems;

    // Get member count
    stats.memberCount = await prisma.householdMember.count({
      where: { household_id: householdId },
    });

    // Get recent todos
    recentTodos = await prisma.todo.findMany({
      where: { household_id: householdId, status: { not: "completed" } },
      orderBy: { created_at: "desc" },
      take: 5,
      include: { assigned_to: true },
    });

    // Get recent expenses
    recentExpenses = await prisma.expense.findMany({
      where: { household_id: householdId },
      orderBy: { created_at: "desc" },
      take: 5,
      include: { creator: true },
    });
  }

  const todoProgress =
    stats.todosTotal > 0
      ? Math.round((stats.todosCompleted / stats.todosTotal) * 100)
      : 0;

  // Get first name
  const firstName = session.user.name?.split(" ")[0] || "there";

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, <span className="gradient-text">{firstName}</span>! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            {membership ? (
              <>Here&apos;s what&apos;s happening in <span className="font-medium text-foreground">{membership.household.name}</span></>
            ) : (
              "Let's get your household set up"
            )}
          </p>
        </div>
        {membership && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-full">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</span>
          </div>
        )}
      </div>

      {!membership ? (
        <Card className="border-dashed border-2 bg-muted/20">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="h-20 w-20 rounded-2xl stat-purple flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/25">
              <Users className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Create Your Household</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Start managing your shared living space by creating a household and inviting your roommates.
            </p>
            <Link href="/dashboard/household">
              <Button size="lg" className="gap-2">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="relative overflow-hidden border-0 shadow-lg">
              <div className="absolute inset-0 stat-green opacity-90" />
              <CardContent className="relative pt-6 pb-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <ListChecks className="h-6 w-6" />
                  </div>
                  <Badge variant="secondary" className="bg-white/20 text-white border-0">
                    {todoProgress}%
                  </Badge>
                </div>
                <p className="text-sm font-medium text-white/80 mb-1">Tasks Pending</p>
                <p className="text-3xl font-bold">{stats.todosPending}</p>
                <Progress value={todoProgress} className="mt-3 h-1.5 bg-white/20" />
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-lg">
              <div className="absolute inset-0 stat-pink opacity-90" />
              <CardContent className="relative pt-6 pb-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <Receipt className="h-6 w-6" />
                  </div>
                  <TrendingUp className="h-5 w-5 text-white/60" />
                </div>
                <p className="text-sm font-medium text-white/80 mb-1">Total Expenses</p>
                <p className="text-3xl font-bold">{formatCurrency(stats.expensesTotal)}</p>
                <p className="text-sm text-white/70 mt-2">
                  {stats.expensesPending} unsettled
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-lg">
              <div className="absolute inset-0 stat-orange opacity-90" />
              <CardContent className="relative pt-6 pb-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <ShoppingCart className="h-6 w-6" />
                  </div>
                </div>
                <p className="text-sm font-medium text-white/80 mb-1">Shopping Items</p>
                <p className="text-3xl font-bold">{stats.shoppingItemsPending}</p>
                <p className="text-sm text-white/70 mt-2">
                  items to buy
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-lg">
              <div className="absolute inset-0 stat-purple opacity-90" />
              <CardContent className="relative pt-6 pb-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <Users className="h-6 w-6" />
                  </div>
                </div>
                <p className="text-sm font-medium text-white/80 mb-1">Household Members</p>
                <p className="text-3xl font-bold">{stats.memberCount}</p>
                <p className="text-sm text-white/70 mt-2">
                  active members
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recent Todos */}
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                    <ListChecks className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <CardTitle className="text-lg">Recent Tasks</CardTitle>
                </div>
                <Link href="/dashboard/todos">
                  <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                    View all
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {recentTodos.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">All caught up! No pending tasks.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentTodos.map((todo) => (
                      <div
                        key={todo.id}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                      >
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                          todo.priority === "high" 
                            ? "bg-red-100 dark:bg-red-900/50" 
                            : todo.priority === "medium"
                            ? "bg-amber-100 dark:bg-amber-900/50"
                            : "bg-slate-100 dark:bg-slate-800"
                        }`}>
                          {todo.priority === "high" ? (
                            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                          ) : (
                            <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{todo.title}</p>
                          {todo.assigned_to && (
                            <p className="text-xs text-muted-foreground">
                              Assigned to {todo.assigned_to.full_name}
                            </p>
                          )}
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            todo.priority === "high"
                              ? "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400"
                              : todo.priority === "medium"
                              ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400"
                              : ""
                          }
                        >
                          {todo.priority}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Expenses */}
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-pink-100 dark:bg-pink-900/50 flex items-center justify-center">
                    <Receipt className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                  </div>
                  <CardTitle className="text-lg">Recent Expenses</CardTitle>
                </div>
                <Link href="/dashboard/expenses">
                  <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                    View all
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {recentExpenses.length === 0 ? (
                  <div className="text-center py-8">
                    <Receipt className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">No expenses recorded yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentExpenses.map((expense) => (
                      <div
                        key={expense.id}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                      >
                        <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                          <Receipt className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{expense.description}</p>
                          <p className="text-xs text-muted-foreground">
                            by {expense.creator.full_name}
                          </p>
                        </div>
                        <span className="font-semibold text-foreground">
                          {formatCurrency(Number(expense.amount))}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

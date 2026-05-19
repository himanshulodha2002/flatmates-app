import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface Balance {
  user_id: string;
  user_name: string;
  total_paid: number;
  total_owed: number;
  net_balance: number;
}

// GET /api/expenses/balances - Get household expense balances
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user's household
    const membership = await prisma.householdMember.findFirst({
      where: { user_id: session.user.id },
      include: {
        household: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    full_name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!membership?.household) {
      return NextResponse.json(
        { error: "No household found" },
        { status: 404 }
      );
    }

    // Get all unsettled expenses for this household
    const expenses = await prisma.expense.findMany({
      where: {
        household_id: membership.household_id,
        is_settled: false,
        is_personal: false,
      },
      include: {
        creator: true,
        splits: {
          where: {
            is_settled: false,
          },
          include: {
            user: true,
          },
        },
      },
    });

    // Calculate balances for each member
    const balances: Map<string, Balance> = new Map();

    // Initialize balances for all members
    for (const member of membership.household.members) {
      balances.set(member.user.id, {
        user_id: member.user.id,
        user_name: member.user.full_name,
        total_paid: 0,
        total_owed: 0,
        net_balance: 0,
      });
    }

    // Process each expense (creator is the payer)
    for (const expense of expenses) {
      const payerId = expense.created_by;
      const amount = parseFloat(expense.amount.toString());

      // Add to payer's total paid
      const payerBalance = balances.get(payerId);
      if (payerBalance) {
        payerBalance.total_paid += amount;
      }

      // Add to each user's total owed from their splits
      for (const split of expense.splits) {
        const userBalance = balances.get(split.user_id);
        if (userBalance) {
          userBalance.total_owed += parseFloat(split.amount_owed.toString());
        }
      }
    }

    // Calculate net balances
    Array.from(balances.values()).forEach((balance) => {
      balance.net_balance = balance.total_paid - balance.total_owed;
    });

    // Calculate simplified debts (who owes whom)
    const debts: { from: string; from_name: string; to: string; to_name: string; amount: number }[] = [];
    
    const positiveBalances = Array.from(balances.values())
      .filter((b) => b.net_balance > 0)
      .sort((a, b) => b.net_balance - a.net_balance);
    
    const negativeBalances = Array.from(balances.values())
      .filter((b) => b.net_balance < 0)
      .sort((a, b) => a.net_balance - b.net_balance);

    // Simplified debt calculation (minimize transactions)
    let i = 0;
    let j = 0;
    while (i < negativeBalances.length && j < positiveBalances.length) {
      const debtor = negativeBalances[i];
      const creditor = positiveBalances[j];
      
      const amount = Math.min(Math.abs(debtor.net_balance), creditor.net_balance);
      
      if (amount > 0.01) {
        debts.push({
          from: debtor.user_id,
          from_name: debtor.user_name,
          to: creditor.user_id,
          to_name: creditor.user_name,
          amount: Math.round(amount * 100) / 100,
        });
      }
      
      debtor.net_balance += amount;
      creditor.net_balance -= amount;
      
      if (Math.abs(debtor.net_balance) < 0.01) i++;
      if (creditor.net_balance < 0.01) j++;
    }

    return NextResponse.json({
      balances: Array.from(balances.values()),
      debts,
      total_expenses: expenses.length,
      total_amount: expenses.reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0),
    });
  } catch (error) {
    console.error("Error calculating balances:", error);
    return NextResponse.json(
      { error: "Failed to calculate balances" },
      { status: 500 }
    );
  }
}

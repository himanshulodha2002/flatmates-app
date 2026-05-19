import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST /api/expenses/[id]/settle - Settle an expense split
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { split_ids } = body; // Array of split IDs to settle

    // Update splits to settled
    const result = await prisma.expenseSplit.updateMany({
      where: {
        id: { in: split_ids },
        expense_id: id,
      },
      data: {
        is_settled: true,
        settled_at: new Date(),
      },
    });

    // Check if all splits are now settled
    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        splits: true,
      },
    });

    const allSettled = expense?.splits.every((s) => s.is_settled);

    // Optionally mark the expense as settled if all splits are done
    if (allSettled && expense) {
      await prisma.expense.update({
        where: { id },
        data: {
          is_settled: true,
          updated_at: new Date(),
        },
      });
    }

    return NextResponse.json({ 
      success: true,
      settled_count: result.count,
      all_settled: allSettled,
    });
  } catch (error) {
    console.error("Error settling expense:", error);
    return NextResponse.json(
      { error: "Failed to settle expense" },
      { status: 500 }
    );
  }
}

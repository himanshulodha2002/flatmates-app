import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const householdId = searchParams.get("household_id");

    if (!householdId) {
      return NextResponse.json(
        { error: "household_id is required" },
        { status: 400 }
      );
    }

    // Verify user is member of household
    const membership = await prisma.householdMember.findFirst({
      where: {
        user_id: session.user.id,
        household_id: householdId,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const expenses = await prisma.expense.findMany({
      where: { household_id: householdId },
      include: {
        creator: {
          select: {
            id: true,
            full_name: true,
            email: true,
            profile_picture_url: true,
          },
        },
        splits: {
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
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ expenses });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const {
      household_id,
      amount,
      description,
      category,
      payment_method,
      split_type,
      is_personal,
    } = data;

    if (!household_id || !amount || !description) {
      return NextResponse.json(
        { error: "household_id, amount, and description are required" },
        { status: 400 }
      );
    }

    // Verify user is member of household
    const membership = await prisma.householdMember.findFirst({
      where: {
        user_id: session.user.id,
        household_id,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Create expense
    const expense = await prisma.expense.create({
      data: {
        household_id,
        created_by: session.user.id,
        amount,
        description,
        category: category || "other",
        payment_method: payment_method || "cash",
        split_type: split_type || "equal",
        is_personal: is_personal || false,
      },
    });

    // Create splits if not personal
    if (!is_personal && split_type === "equal") {
      const members = await prisma.householdMember.findMany({
        where: { household_id },
      });

      const splitAmount = Number(amount) / members.length;

      await prisma.expenseSplit.createMany({
        data: members.map((member) => ({
          expense_id: expense.id,
          user_id: member.user_id,
          amount_owed: splitAmount,
          is_settled: member.user_id === session.user.id,
          settled_at: member.user_id === session.user.id ? new Date() : null,
        })),
      });
    }

    const expenseWithSplits = await prisma.expense.findUnique({
      where: { id: expense.id },
      include: {
        creator: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
        splits: {
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
    });

    return NextResponse.json({ expense: expenseWithSplits }, { status: 201 });
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 }
    );
  }
}

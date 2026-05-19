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

    const lists = await prisma.shoppingList.findMany({
      where: { household_id: householdId },
      include: {
        creator: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
        _count: {
          select: { items: true },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({ lists });
  } catch (error) {
    console.error("Error fetching shopping lists:", error);
    return NextResponse.json(
      { error: "Failed to fetch shopping lists" },
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
    const { household_id, name, description } = data;

    if (!household_id || !name) {
      return NextResponse.json(
        { error: "household_id and name are required" },
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

    const list = await prisma.shoppingList.create({
      data: {
        household_id,
        name,
        description,
        created_by: session.user.id,
        status: "active",
      },
      include: {
        creator: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ list }, { status: 201 });
  } catch (error) {
    console.error("Error creating shopping list:", error);
    return NextResponse.json(
      { error: "Failed to create shopping list" },
      { status: 500 }
    );
  }
}

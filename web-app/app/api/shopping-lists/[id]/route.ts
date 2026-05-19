import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const listId = params.id;

    const list = await prisma.shoppingList.findUnique({
      where: { id: listId },
      include: {
        items: {
          include: {
            assigned_to: {
              select: {
                id: true,
                full_name: true,
                email: true,
              },
            },
            creator: {
              select: {
                id: true,
                full_name: true,
              },
            },
          },
          orderBy: [{ is_purchased: "asc" }, { position: "asc" }],
        },
        creator: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
      },
    });

    if (!list) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    // Verify user is member of household
    const membership = await prisma.householdMember.findFirst({
      where: {
        user_id: session.user.id,
        household_id: list.household_id,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ list });
  } catch (error) {
    console.error("Error fetching shopping list:", error);
    return NextResponse.json(
      { error: "Failed to fetch shopping list" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const listId = params.id;

    const list = await prisma.shoppingList.findUnique({
      where: { id: listId },
    });

    if (!list) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    // Verify user is member of household
    const membership = await prisma.householdMember.findFirst({
      where: {
        user_id: session.user.id,
        household_id: list.household_id,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.shoppingList.delete({
      where: { id: listId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting shopping list:", error);
    return NextResponse.json(
      { error: "Failed to delete shopping list" },
      { status: 500 }
    );
  }
}

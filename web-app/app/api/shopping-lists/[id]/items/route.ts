import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const listId = params.id;
    const data = await request.json();
    const { name, quantity, unit, category, assigned_to_id, notes } = data;

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

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

    // Get max position
    const maxPosition = await prisma.shoppingListItem.aggregate({
      where: { shopping_list_id: listId },
      _max: { position: true },
    });

    const item = await prisma.shoppingListItem.create({
      data: {
        shopping_list_id: listId,
        name,
        quantity: quantity || 1,
        unit,
        category,
        assigned_to_id,
        notes,
        created_by: session.user.id,
        position: (maxPosition._max.position || 0) + 1,
      },
      include: {
        assigned_to: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("Error creating shopping item:", error);
    return NextResponse.json(
      { error: "Failed to create shopping item" },
      { status: 500 }
    );
  }
}

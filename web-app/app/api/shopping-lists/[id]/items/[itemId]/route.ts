import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { itemId } = params;
    const data = await request.json();

    const item = await prisma.shoppingListItem.findUnique({
      where: { id: itemId },
      include: { shopping_list: true },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Verify user is member of household
    const membership = await prisma.householdMember.findFirst({
      where: {
        user_id: session.user.id,
        household_id: item.shopping_list.household_id,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.quantity !== undefined) updateData.quantity = data.quantity;
    if (data.unit !== undefined) updateData.unit = data.unit;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.is_purchased !== undefined) {
      updateData.is_purchased = data.is_purchased;
      if (data.is_purchased) {
        updateData.checked_off_by = session.user.id;
        updateData.checked_off_at = new Date();
      } else {
        updateData.checked_off_by = null;
        updateData.checked_off_at = null;
      }
    }
    if (data.assigned_to_id !== undefined)
      updateData.assigned_to_id = data.assigned_to_id;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const updatedItem = await prisma.shoppingListItem.update({
      where: { id: itemId },
      data: updateData,
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

    return NextResponse.json({ item: updatedItem });
  } catch (error) {
    console.error("Error updating shopping item:", error);
    return NextResponse.json(
      { error: "Failed to update shopping item" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { itemId } = params;

    const item = await prisma.shoppingListItem.findUnique({
      where: { id: itemId },
      include: { shopping_list: true },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Verify user is member of household
    const membership = await prisma.householdMember.findFirst({
      where: {
        user_id: session.user.id,
        household_id: item.shopping_list.household_id,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.shoppingListItem.delete({
      where: { id: itemId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting shopping item:", error);
    return NextResponse.json(
      { error: "Failed to delete shopping item" },
      { status: 500 }
    );
  }
}

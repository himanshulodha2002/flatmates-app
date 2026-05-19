import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const todoId = params.id;
    const data = await request.json();

    // Verify todo exists and user has access
    const todo = await prisma.todo.findUnique({
      where: { id: todoId },
      include: { household: true },
    });

    if (!todo) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }

    const membership = await prisma.householdMember.findFirst({
      where: {
        user_id: session.user.id,
        household_id: todo.household_id,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updatedTodo = await prisma.todo.update({
      where: { id: todoId },
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        due_date: data.due_date ? new Date(data.due_date) : null,
        assigned_to_id: data.assigned_to_id,
        completed_at: data.status === "completed" ? new Date() : null,
      },
      include: {
        assigned_to: {
          select: {
            id: true,
            full_name: true,
            email: true,
            profile_picture_url: true,
          },
        },
      },
    });

    return NextResponse.json({ todo: updatedTodo });
  } catch (error) {
    console.error("Error updating todo:", error);
    return NextResponse.json(
      { error: "Failed to update todo" },
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

    const todoId = params.id;

    // Verify todo exists and user has access
    const todo = await prisma.todo.findUnique({
      where: { id: todoId },
    });

    if (!todo) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }

    const membership = await prisma.householdMember.findFirst({
      where: {
        user_id: session.user.id,
        household_id: todo.household_id,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.todo.delete({
      where: { id: todoId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting todo:", error);
    return NextResponse.json(
      { error: "Failed to delete todo" },
      { status: 500 }
    );
  }
}

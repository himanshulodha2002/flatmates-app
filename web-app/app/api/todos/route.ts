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
    const status = searchParams.get("status");

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

    const todos = await prisma.todo.findMany({
      where: {
        household_id: householdId,
        ...(status && { status: status as any }),
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
        creator: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
      },
      orderBy: [{ status: "asc" }, { priority: "desc" }, { created_at: "desc" }],
    });

    return NextResponse.json({ todos });
  } catch (error) {
    console.error("Error fetching todos:", error);
    return NextResponse.json(
      { error: "Failed to fetch todos" },
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
    const { household_id, title, description, priority, due_date, assigned_to_id } = data;

    if (!household_id || !title) {
      return NextResponse.json(
        { error: "household_id and title are required" },
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

    const todo = await prisma.todo.create({
      data: {
        household_id,
        title,
        description,
        priority: priority || "medium",
        due_date: due_date ? new Date(due_date) : null,
        assigned_to_id,
        created_by: session.user.id,
        status: "pending",
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

    return NextResponse.json({ todo }, { status: 201 });
  } catch (error) {
    console.error("Error creating todo:", error);
    return NextResponse.json(
      { error: "Failed to create todo" },
      { status: 500 }
    );
  }
}

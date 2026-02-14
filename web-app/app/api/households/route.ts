import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
                    email: true,
                    full_name: true,
                    profile_picture_url: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ household: null });
    }

    return NextResponse.json({ 
      household: membership.household,
      role: membership.role,
    });
  } catch (error) {
    console.error("Error fetching household:", error);
    return NextResponse.json(
      { error: "Failed to fetch household" },
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

    const { name } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Check if user already in a household
    const existingMembership = await prisma.householdMember.findFirst({
      where: { user_id: session.user.id },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: "You are already in a household" },
        { status: 400 }
      );
    }

    // Create household and add user as owner
    const household = await prisma.household.create({
      data: {
        name,
        created_by: session.user.id,
        members: {
          create: {
            user_id: session.user.id,
            role: "owner",
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                full_name: true,
                profile_picture_url: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ household }, { status: 201 });
  } catch (error) {
    console.error("Error creating household:", error);
    return NextResponse.json(
      { error: "Failed to create household" },
      { status: 500 }
    );
  }
}

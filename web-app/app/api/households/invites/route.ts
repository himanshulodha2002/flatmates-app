import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { randomUUID } from "crypto";

// GET /api/households/invites - Get all invites for user's household
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
            invites: {
              include: {
                creator: {
                  select: {
                    id: true,
                    email: true,
                    full_name: true,
                  },
                },
              },
              orderBy: { created_at: "desc" },
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

    return NextResponse.json({ invites: membership.household.invites });
  } catch (error) {
    console.error("Error fetching invites:", error);
    return NextResponse.json(
      { error: "Failed to fetch invites" },
      { status: 500 }
    );
  }
}

// POST /api/households/invites - Create a new invite
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Get user's household
    const membership = await prisma.householdMember.findFirst({
      where: { user_id: session.user.id },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "You must belong to a household to invite members" },
        { status: 400 }
      );
    }

    // Check if the email is already a member
    const existingMember = await prisma.householdMember.findFirst({
      where: {
        household_id: membership.household_id,
        user: { email: email },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a member of this household" },
        { status: 400 }
      );
    }

    // Check if there's already a pending invite
    const existingInvite = await prisma.householdInvite.findFirst({
      where: {
        household_id: membership.household_id,
        email: email,
        status: "pending",
      },
    });

    if (existingInvite) {
      return NextResponse.json(
        { error: "An invite has already been sent to this email" },
        { status: 400 }
      );
    }

    // Generate unique invite token
    const token = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    const invite = await prisma.householdInvite.create({
      data: {
        household_id: membership.household_id,
        email: email,
        token: token,
        created_by: session.user.id,
        expires_at: expiresAt,
        status: "pending",
      },
      include: {
        household: {
          select: {
            name: true,
          },
        },
        creator: {
          select: {
            id: true,
            email: true,
            full_name: true,
          },
        },
      },
    });

    return NextResponse.json({ 
      invite,
      inviteLink: `${process.env.NEXTAUTH_URL}/invite/${token}`,
    });
  } catch (error) {
    console.error("Error creating invite:", error);
    return NextResponse.json(
      { error: "Failed to create invite" },
      { status: 500 }
    );
  }
}

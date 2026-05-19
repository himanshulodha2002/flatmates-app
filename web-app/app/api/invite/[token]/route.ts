import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/invite/[token] - Get invite details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const invite = await prisma.householdInvite.findUnique({
      where: { token },
      include: {
        household: {
          select: {
            id: true,
            name: true,
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
    });

    if (!invite) {
      return NextResponse.json(
        { error: "Invite not found" },
        { status: 404 }
      );
    }

    if (invite.status !== "pending") {
      return NextResponse.json(
        { error: `Invite has already been ${invite.status}` },
        { status: 400 }
      );
    }

    if (invite.expires_at && new Date() > invite.expires_at) {
      return NextResponse.json(
        { error: "Invite has expired" },
        { status: 400 }
      );
    }

    return NextResponse.json({ invite });
  } catch (error) {
    console.error("Error fetching invite:", error);
    return NextResponse.json(
      { error: "Failed to fetch invite" },
      { status: 500 }
    );
  }
}

// POST /api/invite/[token] - Accept an invite
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { token } = await params;

    const invite = await prisma.householdInvite.findUnique({
      where: { token },
      include: {
        household: true,
      },
    });

    if (!invite) {
      return NextResponse.json(
        { error: "Invite not found" },
        { status: 404 }
      );
    }

    if (invite.status !== "pending") {
      return NextResponse.json(
        { error: `Invite has already been ${invite.status}` },
        { status: 400 }
      );
    }

    if (invite.expires_at && new Date() > invite.expires_at) {
      return NextResponse.json(
        { error: "Invite has expired" },
        { status: 400 }
      );
    }

    // Check if user is already a member
    const existingMembership = await prisma.householdMember.findFirst({
      where: {
        user_id: session.user.id,
        household_id: invite.household_id,
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: "You are already a member of this household" },
        { status: 400 }
      );
    }

    // Check if user has another household
    const otherMembership = await prisma.householdMember.findFirst({
      where: { user_id: session.user.id },
    });

    if (otherMembership) {
      return NextResponse.json(
        { error: "You are already a member of another household" },
        { status: 400 }
      );
    }

    // Create membership and update invite in a transaction
    const [membership] = await prisma.$transaction([
      prisma.householdMember.create({
        data: {
          user_id: session.user.id,
          household_id: invite.household_id,
          role: "member",
        },
        include: {
          household: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.householdInvite.update({
        where: { token },
        data: { status: "accepted" },
      }),
    ]);

    return NextResponse.json({ 
      success: true,
      household: membership.household,
    });
  } catch (error) {
    console.error("Error accepting invite:", error);
    return NextResponse.json(
      { error: "Failed to accept invite" },
      { status: 500 }
    );
  }
}

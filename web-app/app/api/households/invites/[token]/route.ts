import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// DELETE /api/households/invites/[token] - Cancel an invite
export async function DELETE(
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

    // Find the invite
    const invite = await prisma.householdInvite.findUnique({
      where: { token },
      include: {
        household: {
          include: {
            members: true,
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

    // Check if user is a member of the household
    const isMember = invite.household.members.some(
      (m) => m.user_id === session.user.id
    );

    if (!isMember) {
      return NextResponse.json(
        { error: "Not authorized to cancel this invite" },
        { status: 403 }
      );
    }

    // Delete the invite
    await prisma.householdInvite.delete({
      where: { token },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error canceling invite:", error);
    return NextResponse.json(
      { error: "Failed to cancel invite" },
      { status: 500 }
    );
  }
}

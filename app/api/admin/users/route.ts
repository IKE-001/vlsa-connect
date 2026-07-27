import { getCallerUserId } from '@/lib/utils/getCallerUserId';
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const userId = await getCallerUserId(req);
    const role = req.headers.get("x-caller-platform-role");

    // if (!userId || role !== "ADMIN") {
    //   return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    // }

    const users = await prisma.user.findMany({
      include: {
        groupMemberships: {
          include: {
            vslaGroup: true,
          },
        },
      },
    });

    // Map to GroupDirectory format
    const directory = users.map((user) => {
      // Find active membership if any
      const activeMembership = user.groupMemberships.find((m) => m.status === "ACTIVE");
      const groupName = activeMembership ? activeMembership.vslaGroup.name : "No Active Group";
      
      // We map the role from the platform role or the active membership role
      let displayRole = user.platformRole.toString();
      if (activeMembership && user.platformRole === "MEMBER") {
        displayRole = activeMembership.roleInGroup.toString();
      }

      return {
        id: user.id,
        name: user.fullName,
        role: displayRole,
        phone: user.phoneNumber,
        email: null,
        avatarUrl: user.avatarUrl,
        groupName, // Custom field for admin view
      };
    });

    return NextResponse.json({ success: true, data: directory }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/admin/users]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}

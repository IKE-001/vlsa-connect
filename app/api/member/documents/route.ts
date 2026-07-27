import { getCallerUserId } from '@/lib/utils/getCallerUserId';
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { format } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get("groupId");
    const userId = await getCallerUserId(req);

    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    // If groupId not provided, try to find from user's group membership
    let resolvedGroupId = groupId;
    if (!resolvedGroupId) {
      const member = await prisma.groupMember.findFirst({
        where: { userId, status: "ACTIVE" },
        select: { groupId: true },
        orderBy: { joinDate: "desc" },
      });
      resolvedGroupId = member?.groupId ?? null;
    }

    if (!resolvedGroupId) {
      return NextResponse.json({ success: true, data: [] }, { status: 200 });
    }

    // 1. Meeting minutes — completed meetings with agenda notes
    const meetings = await prisma.meeting.findMany({
      where: { groupId: resolvedGroupId, minutes: { not: null } },
      orderBy: { scheduledAt: "desc" },
      take: 20,
    });

    // 2. Loan agreements — disbursed/repaying/repaid loans for this group
    const loans = await prisma.loan.findMany({
      where: { groupId: resolvedGroupId, status: { in: ["DISBURSED", "REPAYING", "REPAID"] } },
      orderBy: { disbursedAt: "desc" },
      take: 20,
      include: { member: { include: { user: { select: { fullName: true } } } } },
    });

    // Assemble unified document list
    const docs: Array<{
      id: string;
      name: string;
      date: string;
      type: string;
      size: string;
      description?: string;
    }> = [];

    // Minutes
    meetings.forEach((m: any) => {
      docs.push({
        id: `meeting-${m.id}`,
        name: `Meeting Minutes — ${format(new Date(m.scheduledAt), "MMMM yyyy")}`,
        date: format(new Date(m.scheduledAt), "dd MMM yyyy"),
        type: "minutes",
        size: "–",
        description: m.agendaNotes || "Minutes recorded",
      });
    });

    // Loan agreements
    loans.forEach((l: any) => {
      const memberName = l.member?.user?.fullName ?? "Member";
      docs.push({
        id: `loan-${l.id}`,
        name: `Loan Agreement — ${memberName}`,
        date: l.disbursedAt ? format(new Date(l.disbursedAt), "dd MMM yyyy") : "Pending",
        type: "loan",
        size: "–",
        description: `Principal: MWK ${(l.principalTambala / 100).toFixed(0)} · Status: ${l.status}`,
      });
    });

    // Sort all by date descending
    docs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ success: true, data: docs }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/member/documents]", error);
    return NextResponse.json({ success: false, error: "Internal server error." }, { status: 500 });
  }
}

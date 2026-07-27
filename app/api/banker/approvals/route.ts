import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { formatMWK } from "@/lib/utils/money";
import { sendFanOutNotification } from "@/services/notifications/sendFanOutNotification";

export async function GET() {
  try {
    const approvals = await prisma.bankLoanApplication.findMany({
      include: {
        group: {
          include: {
            _count: {
              select: { members: true },
            },
            contributions: {
              where: { status: "APPROVED" },
            }
          }
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedApprovals = approvals.map((app: any) => {
      const totalSavings = app.group.contributions.reduce((sum: number, c: any) => sum + c.amountTambala, 0);

      let status: "pending" | "approved" | "rejected" = "pending";
      if (app.status === "APPROVED" || app.status === "DISBURSED" || app.status === "REPAID") {
        status = "approved";
      } else if (app.status === "REJECTED" || app.status === "DEFAULTED") {
        status = "rejected";
      }

      return {
        id: app.id,
        group: app.group.name,
        amount: formatMWK(app.amountTambala),
        purpose: app.purpose,
        members: app.group._count.members,
        savings: formatMWK(totalSavings),
        status,
        score: app.score ?? 0,
      };
    });

    return NextResponse.json({ approvals: formattedApprovals });
  } catch (error) {
    console.error("Error fetching banker approvals:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { applicationId, action } = await req.json();

    if (!applicationId || !['APPROVED', 'REJECTED'].includes(action)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const application = await prisma.bankLoanApplication.update({
      where: { id: applicationId },
      data: {
        status: action === 'APPROVED' ? 'APPROVED' : 'REJECTED',
        ...(action === 'APPROVED' ? { approvedAt: new Date() } : {}),
      },
      include: {
        group: {
          include: {
            members: {
              where: { roleInGroup: 'CHAIRPERSON' },
              select: { userId: true },
            }
          }
        }
      }
    });

    // Notify group chairperson
    const chairpersonUserId = application.group.members[0]?.userId;
    if (chairpersonUserId) {
      const mwk = (application.amountTambala / 100).toLocaleString();
      sendFanOutNotification({
        userId: chairpersonUserId,
        title: action === 'APPROVED' ? 'Bank Credit Application Approved!' : 'Bank Credit Application Rejected',
        message: action === 'APPROVED'
          ? `Great news! Your bank loan application of ${mwk} MWK for ${application.group.name} was approved by the Bank Officer.`
          : `Your bank loan application of ${mwk} MWK for ${application.group.name} was rejected.`,
      }).catch(console.error);
    }

    return NextResponse.json({ success: true, application });
  } catch (error: any) {
    console.error("Error updating bank loan status:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

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

    // 1. Total Users
    const totalUsers = await prisma.user.count();

    // 2. Active Groups
    const activeGroups = await prisma.vslaGroup.count({
      where: { status: "ACTIVE" },
    });

    // 3. Platform Total Savings (Ledger CREDITs minus DEBITs)
    const ledgerAgg = await prisma.ledgerEntry.aggregate({
      _sum: {
        amountTambala: true,
      },
      where: {
        direction: "CREDIT",
      },
    });
    
    const debitAgg = await prisma.ledgerEntry.aggregate({
      _sum: {
        amountTambala: true,
      },
      where: {
        direction: "DEBIT",
      },
    });

    const totalSavingsTambala = (ledgerAgg._sum.amountTambala || 0) - (debitAgg._sum.amountTambala || 0);

    // 4. Avg Health Score
    // Get latest score per group by distinct
    const latestScores = await prisma.healthScore.findMany({
      distinct: ['groupId'],
      orderBy: [
        { groupId: 'asc' },
        { computedAt: 'desc' },
      ],
      select: {
        score: true,
      },
    });

    let healthScoreAvg = 0;
    if (latestScores.length > 0) {
      healthScoreAvg = Math.round(
        latestScores.reduce((acc, curr) => acc + curr.score, 0) / latestScores.length
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          totalUsers,
          activeGroups,
          totalSavingsTambala,
          healthScoreAvg,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET /api/admin/metrics]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}

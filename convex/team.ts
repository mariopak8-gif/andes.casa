import { v } from "convex/values";
import { query } from "./_generated/server";

export const getTeamReport = query({
  args: { userId: v.id("user") },
  handler: async (ctx, args) => {
    const users = await ctx.db.query("user").collect();
    const transactions = await ctx.db.query("transaction").collect();

    // ✅ referredBy is an array of Id<"user">, so each user can appear
    // in multiple referrers' children lists
    const childrenMap: Record<string, string[]> = {};
    for (const u of users) {
      const referredBy: string[] = Array.isArray((u as any).referredBy)
        ? (u as any).referredBy.map(String)
        : [];

      for (const referrerId of referredBy) {
        if (!childrenMap[referrerId]) childrenMap[referrerId] = [];
        childrenMap[referrerId].push(String(u._id));
      }
    }

    // Rest of the logic is unchanged — childrenMap shape is the same
    const levelA: string[] = childrenMap[String(args.userId)] ?? [];
    const levelB: string[] = [];
    const levelC: string[] = [];

    for (const a of levelA) {
      for (const b of childrenMap[a] ?? []) {
        if (!levelB.includes(b)) levelB.push(b);
      }
    }

    for (const b of levelB) {
      for (const c of childrenMap[b] ?? []) {
        if (!levelC.includes(c)) levelC.push(c);
      }
    }

    // Build deposit map for all members
    const memberDepositMap: Record<string, number> = {};
    for (const id of [...levelA, ...levelB, ...levelC]) {
      memberDepositMap[id] = 0;
    }
    for (const t of transactions) {
      if (t.type === "deposit" && t.status === "completed") {
        const uid = String(t.userId);
        if (uid in memberDepositMap) {
          memberDepositMap[uid] += t.amount || 0;
        }
      }
    }

    const sumDepositsFor = (ids: string[]) =>
      ids.reduce((sum, id) => sum + (memberDepositMap[id] || 0), 0);

    const aSum = sumDepositsFor(levelA);
    const bSum = sumDepositsFor(levelB);
    const cSum = sumDepositsFor(levelC);

    const aRate = 0.18;
    const bRate = 0.03;
    const cRate = 0.02;

    const mapMembers = (ids: string[]) =>
      ids.map((id) => {
        const u = users.find((x) => String(x._id) === id);
        return {
          _id: u?._id || id,
          contact: u?.contact || "",
          invitationCode: u?.invitationCode || "",
          depositSum: memberDepositMap[id] || 0,
        };
      });

    return {
      levels: {
        A: { count: levelA.length, depositSum: aSum, commission: aSum * aRate, rate: aRate, members: mapMembers(levelA) },
        B: { count: levelB.length, depositSum: bSum, commission: bSum * bRate, rate: bRate, members: mapMembers(levelB) },
        C: { count: levelC.length, depositSum: cSum, commission: cSum * cRate, rate: cRate, members: mapMembers(levelC) },
      },
      totalMembers: levelA.length + levelB.length + levelC.length,
      totalCommission: aSum * aRate + bSum * bRate + cSum * cRate,
    };
  },
});

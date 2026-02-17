import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Request a withdrawal
 * Creates a pending transaction and checks balance
 */
export const requestWithdrawal = mutation({
  args: {
    userId: v.id("user"),
    amount: v.number(),
    address: v.string(),
    network: v.union(
      v.literal("trc20"),
      v.literal("bep20"),
      v.literal("erc20"),
      v.literal("polygon")
    ),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    
    if (!user) {
      throw new Error("User not found");
    }

    const currentBalance = user.balance || 0;

    if (currentBalance < args.amount) {
      throw new Error("Insufficient balance");
    }

    // Deduct balance immediately to prevent double spending
    await ctx.db.patch(args.userId, {
      balance: currentBalance - args.amount,
    });

    // Create pending withdrawal transaction
    const transactionId = await ctx.db.insert("transaction", {
      userId: args.userId,
      type: "withdrawal",
      amount: args.amount,
      network: args.network,
      status: "pending",
      walletAddress: args.address,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return transactionId;
  },
});

/**
 * Complete a withdrawal (update status)
 * If failed, refund the amount to user
 */
export const completeWithdrawal = mutation({
  args: {
    transactionId: v.id("transaction"),
    status: v.union(
      v.literal("completed"),
      v.literal("failed")
    ),
    transactionHash: v.optional(v.string()), // For completed withdrawals
    error: v.optional(v.string()), // For failed withdrawals
  },
  handler: async (ctx, args) => {
    const transaction = await ctx.db.get(args.transactionId);

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    if (transaction.type !== "withdrawal") {
      throw new Error("Not a withdrawal transaction");
    }

    if (transaction.status !== "pending") {
      throw new Error("Transaction is already processed");
    }

    await ctx.db.patch(args.transactionId, {
      status: args.status,
      transactionHash: args.transactionHash,
      updatedAt: Date.now(),
    });

    // If failed, refund the user
    if (args.status === "failed") {
      const user = await ctx.db.get(transaction.userId);
      if (user) {
        const currentBalance = user.balance || 0;
        await ctx.db.patch(transaction.userId, {
          balance: currentBalance + transaction.amount,
        });
      }
    }

    return args.status;
  },
});

/**
 * Get user's withdrawal history
 */
export const getUserWithdrawals = query({
  args: {
    userId: v.id("user"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    const withdrawals = await ctx.db
      .query("transaction")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("type"), "withdrawal"))
      .order("desc")
      .take(limit);

    return withdrawals;
  },
});

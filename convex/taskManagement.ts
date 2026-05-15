import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * Task Management Functions
 * Handles task lifecycle, timers, and admin controls
 */

// Get active tasks for a user
export const getUserActiveTasks = query({
  args: {
    userId: v.id("user"),
  },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("task")
      .withIndex("by_userId_status", (q) =>
        q.eq("userId", args.userId).eq("status", "active")
      )
      .collect();
    return tasks;
  },
});

// Get all active tasks (for admin monitoring)
export const getAllActiveTasks = query({
  handler: async (ctx) => {
    const tasks = await ctx.db
      .query("task")
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();
    return tasks;
  },
});

// Start a new task for a user
export const startTask = mutation({
  args: {
    userId: v.id("user"),
    grade: v.string(),
    durationHours: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const expiresAt = now + args.durationHours * 60 * 60 * 1000; // Convert hours to milliseconds

    const taskId = await ctx.db.insert("task", {
      userId: args.userId,
      grade: args.grade,
      startedAt: now,
      expiresAt: expiresAt,
      status: "active",
      durationHours: args.durationHours,
      createdAt: now,
      updatedAt: now,
    });

    return {
      taskId,
      startedAt: now,
      expiresAt: expiresAt,
      durationHours: args.durationHours,
    };
  },
});

// Close an expired task
export const closeExpiredTask = mutation({
  args: {
    taskId: v.id("task"),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) return null;

    const now = Date.now();
    if (now >= task.expiresAt) {
      // Award rewards and mark completed when a task expires
      const awardResult = await awardTaskRewards(ctx, task);
      if (awardResult && awardResult.success) {
        return { success: true, status: "completed", awarded: awardResult.earningsAwarded };
      }

      // Fallback: mark expired if awarding failed
      await ctx.db.patch(args.taskId, {
        status: "expired",
        updatedAt: now,
      });
      return { success: true, status: "expired" };
    }

    return { success: false, reason: "Task not yet expired" };
  },
});

// Manual close task by user or admin
export const closeTask = mutation({
  args: {
    taskId: v.id("task"),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) return null;

    const now = Date.now();
    await ctx.db.patch(args.taskId, {
      status: "closed",
      updatedAt: now,
    });

    return { success: true, status: "closed" };
  },
});

// Complete a task (marks it as completed instead of closed)
export const completeTask = mutation({
  args: {
    taskId: v.id("task"),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) return null;

    const now = Date.now();
    await ctx.db.patch(args.taskId, {
      status: "completed",
      updatedAt: now,
    });

    return { success: true, status: "completed" };
  },
});

// Update task duration (admin only) and auto-extend active tasks
export const updateTaskDuration = mutation({
  args: {
    grade: v.string(),
    newDurationHours: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const durationMs = args.newDurationHours * 60 * 60 * 1000;

    // Get all active tasks for this grade
    const activeTasks = await ctx.db
      .query("task")
      .filter((q) => q.eq(q.field("grade"), args.grade))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    // Update each active task with new expiry time
    let updatedCount = 0;
    for (const task of activeTasks) {
      // Calculate new expiry: start time + new duration
      const newExpiresAt = task.startedAt + durationMs;
      await ctx.db.patch(task._id, {
        durationHours: args.newDurationHours,
        expiresAt: newExpiresAt,
        updatedAt: now,
      });
      updatedCount++;
    }

    return {
      success: true,
      updatedCount,
      grade: args.grade,
      newDurationHours: args.newDurationHours,
    };
  },
});

// Get task details
export const getTaskById = query({
  args: {
    taskId: v.id("task"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.taskId);
  },
});

// Get user's task history
export const getUserTaskHistory = query({
  args: {
    userId: v.id("user"),
  },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("task")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    return tasks.reverse(); // Most recent first
  },
});

// Check and auto-close all expired tasks (can be called periodically)
export const checkAndCloseExpiredTasks = mutation({
  handler: async (ctx) => {
    const now = Date.now();
    const activeTasks = await ctx.db
      .query("task")
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    let closedCount = 0;
    for (const task of activeTasks) {
      if (now >= task.expiresAt) {
        // Try to award and complete the task when it expires
        const awardResult = await awardTaskRewards(ctx, task);
        if (awardResult && awardResult.success) {
          closedCount++;
          continue;
        }

        // Fallback: mark expired if awarding failed
        await ctx.db.patch(task._id, {
          status: "expired",
          updatedAt: now,
        });
        closedCount++;
      }
    }

    return {
      success: true,
      closedCount,
      timestamp: now,
    };
  },
});

// Helper: award rewards for a task and mark it completed
async function awardTaskRewards(ctx: any, task: any) {
  if (!task || task.status !== "active") return null;

  const user = await ctx.db.get(task.userId);
  if (!user) return null;

  const earningsMap: { [key: string]: number } = {
    A1: 2,
    A2: 6.6,
    A3: 25,
    B1: 52,
    B2: 120,
    B3: 320,
  };

  const dailyEarnings = earningsMap[task.grade] || 0;
  const now = Date.now();

  // Update task: mark completed and note awarded amount
  await ctx.db.patch(task._id, {
    status: "completed",
    updatedAt: now,
    earningsAwarded: dailyEarnings,
    rewardedAt: now,
  });

  // Credit user
  const newEarnings = (user.earnings || 0) + dailyEarnings;
  const userDeposit = user.depositAmount || 0;
  const newBalance = userDeposit + newEarnings;
  await ctx.db.patch(task.userId, {
    earnings: newEarnings,
  });

  return {
    success: true,
    earningsAwarded: dailyEarnings,
    newBalance,
    newEarnings,
  };
}

// Complete task and award earnings to user
export const completeTaskWithRewards = mutation({
  args: {
    taskId: v.id("task"),
    userId: v.id("user"),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) return { success: false, error: "Task not found" };

    const user = await ctx.db.get(args.userId);
    if (!user) return { success: false, error: "User not found" };

    // Check 24-hour cooldown after last task claim
    const now = Date.now();
    const cooldownMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    if (user.lastTaskClaimTime && (now - user.lastTaskClaimTime) < cooldownMs) {
      const remainingMs = cooldownMs - (now - user.lastTaskClaimTime);
      const remainingHours = Math.ceil(remainingMs / (60 * 60 * 1000));
      return { success: false, error: `You must wait ${remainingHours} hours before claiming another task reward.` };
    }

    // Delegate to helper which locks-in awarding and marks task completed
    const awardResult = await awardTaskRewards(ctx, task);
    if (!awardResult || !awardResult.success) {
      return { success: false, error: "Failed to award rewards" };
    }

    // Update last task claim time
    await ctx.db.patch(args.userId, {
      lastTaskClaimTime: now,
    });

    return {
      success: true,
      taskId: args.taskId,
      grade: task.grade,
      earningsAwarded: awardResult.earningsAwarded,
      newBalance: awardResult.newBalance,
      newEarnings: awardResult.newEarnings,
    };
  },
});

// Instant claim task (creates and immediately completes a task)
export const instantClaimTask = mutation({
  args: {
    userId: v.id("user"),
    grade: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return { success: false, error: "User not found" };

    // Get renewal time from settings
    const renewalSettings = await ctx.db
      .query("settings")
      .withIndex("by_key", (q: any) => q.eq("key", "taskRenewalTime"))
      .first();
    const renewalHour = renewalSettings?.value?.hour ?? 19;
    const renewalMinute = renewalSettings?.value?.minute ?? 0;
    const timeZone = renewalSettings?.value?.timeZone ?? 'local';

    const now = Date.now();
    const todayRenewal = new Date();
    todayRenewal.setHours(renewalHour, renewalMinute, 0, 0);
    if (timeZone !== 'local') {
      // For simplicity, assume local for now; can add timezone logic later
    }
    if (now < todayRenewal.getTime()) {
      // If before today's renewal, check yesterday's renewal
      todayRenewal.setDate(todayRenewal.getDate() - 1);
    }
    const lastAllowedClaim = todayRenewal.getTime();

    if (user.lastTaskClaimTimes?.[args.grade] && user.lastTaskClaimTimes[args.grade] >= lastAllowedClaim) {
      const nextRenewal = new Date(todayRenewal);
      nextRenewal.setDate(nextRenewal.getDate() + 1);
      const remainingMs = nextRenewal.getTime() - now;
      const remainingHours = Math.ceil(remainingMs / (60 * 60 * 1000));
      return { success: false, error: `You must wait ${remainingHours} hours before claiming another task reward.` };
    }

    // Create a task record (with 0 duration since it's instant)
    const taskId = await ctx.db.insert("task", {
      userId: args.userId,
      grade: args.grade,
      startedAt: now,
      expiresAt: now, // Instant expiry
      status: "active",
      durationHours: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Immediately award rewards
    const awardResult = await awardTaskRewards(ctx, { _id: taskId, ...await ctx.db.get(taskId) } as any);
    if (!awardResult || !awardResult.success) {
      return { success: false, error: "Failed to award rewards" };
    }

    // Update last task claim time
    const updatedClaimTimes = { ...user.lastTaskClaimTimes };
    updatedClaimTimes[args.grade] = now;
    await ctx.db.patch(args.userId, {
      lastTaskClaimTimes: updatedClaimTimes,
    });

    return {
      success: true,
      taskId,
      grade: args.grade,
      earningsAwarded: awardResult.earningsAwarded,
      newBalance: awardResult.newBalance,
      newEarnings: awardResult.newEarnings,
    };
  },
});

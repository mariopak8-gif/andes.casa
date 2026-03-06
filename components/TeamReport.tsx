"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSession } from "next-auth/react";
import { ScrollArea } from "./ui/scroll-area";

export default function TeamReport() {
  const { data: session } = useSession();
  const userId = (session as any)?.user?.id;
  const report = useQuery(api.team.getTeamReport, userId ? { userId } : "skip");

  if (!userId) return null;
  if (!report)
    return (
      <div className="mt-6 p-4 bg-white rounded-2xl">
        Loading team report...
      </div>
    );

  const totalDeposits =
    report.levels.A.depositSum +
    report.levels.B.depositSum +
    report.levels.C.depositSum;

  return (
    <div className="space-y-4">
      {/* Top Stats Card - Matching Screenshot */}
      <div className="bg-white rounded-3xl p-5 shadow-md">
        {/* First Row - Main Stats */}
        <div className="grid grid-cols-3 gap-3 text-center mb-5">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {report.totalMembers}
            </div>
            <div className="text-xs text-gray-600 mt-1.5">Team size</div>
          </div>
          <div>
            <div className="text-base font-bold text-gray-900">
              USD{totalDeposits.toFixed(4)}
            </div>
            <div className="text-xs text-gray-600 mt-1.5">Team recharge</div>
          </div>
          <div>
            <div className="text-base font-bold text-gray-900">
              USD{report.totalCommission.toFixed(4)}
            </div>
            <div className="text-xs text-gray-600 mt-1.5">Team withdrawal</div>
          </div>
        </div>

        <div className="h-px bg-gray-200 my-4"></div>

        {/* Second Row - Secondary Stats */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {report.levels.A.count}
            </div>
            <div className="text-xs text-gray-600 mt-1.5">New team</div>
          </div>
          <div>
            <div className="text-base font-bold text-gray-900">
              {report.levels.B.depositSum.toFixed(4)}
            </div>
            <div className="text-xs text-gray-600 mt-1.5">
              First recharge
              <br />
              number
            </div>
          </div>
          <div>
            <div className="text-base font-bold text-gray-900">
              {report.levels.C.depositSum.toFixed(2)}
            </div>
            <div className="text-xs text-gray-600 mt-1.5">
              First withdrawal
              <br />
              number
            </div>
          </div>
        </div>
      </div>

      {/* Team Sections - Matching Screenshot Layout */}
      <div className="space-y-3">
        {(["A", "B", "C"] as const).map((level, idx) => {
          const info = report.levels[level];
          const colors = [
            "from-green-400 to-emerald-500",
            "from-teal-400 to-cyan-500",
            "from-blue-400 to-blue-500",
          ];

          return (
            <div
              key={level}
              className={`bg-gradient-to-r ${colors[idx]} rounded-2xl p-4 flex items-center justify-between text-white relative overflow-hidden group`}
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div
                  className="absolute bottom-0 right-0 w-40 h-40 rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)",
                  }}
                ></div>
              </div>

              {/* Left Side - Team Icon & Count */}
              <div className="flex items-center gap-3 relative z-10 flex-1">
                <span className="text-2xl">⭐</span>
                <div>
                  <div className="text-sm font-semibold opacity-90">
                    Team {level}
                  </div>
                  <div className="text-3xl font-bold">{info.count}</div>
                  <div className="text-xs opacity-80 mt-0.5">Team size</div>
                </div>
              </div>

              {/* Right Side - Commission Badge */}
              <div className="flex items-center justify-center relative z-10">
                <div className="bg-white/25 backdrop-blur-sm rounded-2xl px-4 py-3 text-center border border-white/30">
                  <div className="text-2xl font-bold">
                    {(info.rate * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs opacity-90 mt-0.5">Team benefits</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Direct referrals list for Team A */}
      <ScrollArea className="h-[200px] w-full pt-2">
        
      <>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">
          Your Direct Referrals
        </h4>
        <div className="bg-white rounded-lg p-3">
          {report.levels.A.members && report.levels.A.members.length > 0 ? (
            report.levels.A.members.slice(0, 10).map((m: any) => (
              <div
                key={String(m._id)}
                className="flex items-center justify-between py-2 border-b last:border-b-0"
              >
                <div className="text-sm font-medium text-gray-900">
                  {m.contact || "—"}
                </div>
                <div className="text-xs text-gray-500">
                  {m.invitationCode ? `Invited: ${m.invitationCode}` : ""}
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500">
              No direct referrals yet.
            </div>
          )}
        </div>
      </>
      </ScrollArea>
    </div>
  );
}

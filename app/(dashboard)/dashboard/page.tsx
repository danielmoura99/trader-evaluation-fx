import { StatsCards } from "./_components/stats-cards";
import { Charts } from "./_components/charts";
import { RecentClients } from "./_components/recent-clients";
import {
  getDashboardStats,
  getClientsByPlan,
  getEvaluationsByMonth,
  getRecentClients,
} from "./_actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const [stats, planData, monthlyData, recentClients] = await Promise.all([
    getDashboardStats(),
    getClientsByPlan(),
    getEvaluationsByMonth(),
    getRecentClients(),
  ]);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left Column */}
      <div className="flex-1 space-y-6">
        <StatsCards {...stats} />
        <Charts planData={planData} monthlyData={monthlyData} />
      </div>

      {/* Right Column */}
      <div className="lg:w-1/3">
        <RecentClients clients={recentClients} />
      </div>
    </div>
  );
}

import { UserData as BaseUserData } from './GitGravityDashboard';

export interface TelemetryUserData extends BaseUserData {
  totalCommits: number;
  highestCommitDay: string;
  highestCommitCount: number;
  lowestCommitDay: string;
  lowestCommitCount: number;
  weeklyCommits: number[];
  longestStreak?: number;
  totalPRs?: number;
  contributionsByMonth?: number[];
}
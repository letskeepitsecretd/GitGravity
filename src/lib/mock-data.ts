/**
 * Mock GitHub data for the GitGravity "Wrapped" experience.
 * Replace this with real GitHub API data in production.
 */
export const mockGitHubData = {
  username: "devkumar",
  avatarUrl: "https://github.com/identicons/devkumar.png",
  year: 2025,
  totalCommits: 1205,
  totalPRs: 87,
  totalStars: 342,
  longestStreak: 47,
  topLanguages: [
    { name: "JavaScript", percentage: 42, color: "#f7df1e" },
    { name: "Python", percentage: 31, color: "#3776ab" },
    { name: "Rust", percentage: 27, color: "#dea584" },
  ],
  mostActiveRepo: "GitGravity-engine",
  mostActiveRepoCommits: 384,
  contributionsPerMonth: [34, 56, 89, 120, 145, 98, 76, 112, 134, 156, 102, 83],
  topCollaborators: ["alice-dev", "bob-hacker", "carol-rust"],
};

export type GitHubData = typeof mockGitHubData;

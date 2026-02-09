// config/gamificationRules.js

export const POINT_SYSTEM = {
  LOGIN_DAILY: 10,          // Points for logging in once every 24h
  COMPLETE_QUIZ: 50,        // Base points for finishing a quiz
  PERFECT_SCORE: 100,       // Bonus for getting 100% on a quiz
  SUBMIT_ASSIGNMENT: 75,    // Points for turning in work on time
  CLASS_PARTICIPATION: 20   // Awarded by teacher manually
};

export const BADGE_CRITERIA = [
  {
    id: 'badge_001',
    name: 'Novice Gamer',
    description: 'Earn your first 100 points',
    icon: 'assets/badges/novice.png',
    condition: (userPoints) => userPoints >= 100
  },
  {
    id: 'badge_002',
    name: 'Quiz Master',
    description: 'Score 100% on 3 different quizzes',
    icon: 'assets/badges/quiz_master.png',
    condition: (perfectQuizCount) => perfectQuizCount >= 3
  },
  {
    id: 'badge_003',
    name: 'Consistent Player',
    description: 'Login for 7 consecutive days',
    icon: 'assets/badges/streak_fire.png',
    condition: (loginStreak) => loginStreak >= 7
  },
  {
    id: 'badge_004',
    name: 'Top of the Leaderboard',
    description: 'Reach the #1 rank in your class',
    icon: 'assets/badges/crown.png',
    condition: (rank) => rank === 1
  }
];
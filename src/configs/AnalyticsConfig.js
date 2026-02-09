// src/config/AnalyticsConfig.js

export const PERFORMANCE_METRICS = {
    LOGIN_FREQUENCY: 'track_login_count',
    AVG_SESSION_DURATION: 'track_session_time',
    LAST_ACTIVE_DATE: 'track_last_access',
    QUIZ_COMPLETION_RATE: 'calc_quiz_percentage',
    AVG_TEST_SCORE: 'calc_score_average',
    TOTAL_BADGES_EARNED: 'count_badges',
    POINTS_ACCUMULATED: 'sum_total_points',
    LEADERBOARD_RANK: 'get_current_rank'
};

export const ALERTS = {
    LOW_LOGIN_WARNING: 7,
    FAILING_GRADE_THRESHOLD: 75 
};
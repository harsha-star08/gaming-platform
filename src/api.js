const BASE_URL = '/api';

export function getToken() {
  return localStorage.getItem('upskill_token');
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('upskill_token', token);
  } else {
    localStorage.removeItem('upskill_token');
  }
}

export function getStoredUser() {
  const u = localStorage.getItem('upskill_user');
  return u ? JSON.parse(u) : null;
}

export function setStoredUser(user) {
  if (user) {
    localStorage.setItem('upskill_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('upskill_user');
  }
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data;
}

export const api = {
  auth: {
    register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
    login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
    me: () => request('/auth/me')
  },
  student: {
    getDashboard: () => request('/student/dashboard'),
    getCourses: () => request('/student/courses'),
    getTopics: (courseSlug) => request(`/student/courses/${courseSlug}/topics`),
    getTopicDetail: (topicId) => request(`/student/topics/${topicId}`),
    completeTopic: (topicId) => request(`/student/topics/${topicId}/complete`, { method: 'POST' }),
    attemptQuestion: (questionId, selectedAnswer) => request(`/student/questions/${questionId}/attempt`, {
      method: 'POST',
      body: JSON.stringify({ selectedAnswer })
    }),
    getProfile: () => request('/student/profile')
  },
  coding: {
    getProblem: (slug) => request(`/coding/problems/${slug}`),
    runCode: (slug, code, customInput) => request(`/coding/problems/${slug}/run`, {
      method: 'POST',
      body: JSON.stringify({ code, customInput })
    }),
    submitCode: (slug, code, language = 'python') => request(`/coding/problems/${slug}/submit`, {
      method: 'POST',
      body: JSON.stringify({ code, language })
    }),
    getSubmissions: () => request('/coding/submissions')
  },
  mentor: {
    getDashboard: () => request('/mentor/dashboard'),
    searchStudents: (query = '', minLevel = '') => request(`/mentor/students/search?query=${encodeURIComponent(query)}&minLevel=${encodeURIComponent(minLevel)}`),
    getConnectedStudents: () => request('/mentor/students'),
    getStudentAnalytics: (studentId) => request(`/mentor/students/${studentId}/analytics`),
    sendRequest: (studentId, message) => request('/mentor/requests', {
      method: 'POST',
      body: JSON.stringify({ studentId, message })
    }),
    getSentRequests: () => request('/mentor/requests'),
    sendFeedback: (payload) => request('/mentor/feedback', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
    createQuiz: (payload) => request('/mentor/quizzes', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
    getQuizzes: () => request('/mentor/quizzes'),
    createCodingChallenge: (payload) => request('/mentor/coding-challenges', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
    getCodingChallenges: () => request('/mentor/coding-challenges'),
    createAssignment: (payload) => request('/mentor/assignments', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
    getAssignments: () => request('/mentor/assignments'),
    getAssignmentResults: (assignmentId) => request(`/mentor/assignments/${assignmentId}/results`),
    getProfile: () => request('/mentor/profile'),
    updateProfile: (payload) => request('/mentor/profile', { method: 'PUT', body: JSON.stringify(payload) })
  },
  mentorRequests: {
    getRequests: () => request('/mentor-requests'),
    accept: (requestId) => request(`/mentor-requests/${requestId}/accept`, { method: 'POST' }),
    decline: (requestId) => request(`/mentor-requests/${requestId}/decline`, { method: 'POST' })
  },
  assignments: {
    getStudentAssignments: () => request('/assignments'),
    getAssignmentDetail: (tokenOrId) => request(`/assignments/${tokenOrId}`),
    start: (id) => request(`/assignments/${id}/start`, { method: 'POST' }),
    submit: (id, payload) => request(`/assignments/${id}/submit`, { method: 'POST', body: JSON.stringify(payload) })
  },
  teams: {
    getTeams: () => request('/teams'),
    getMyTeam: () => request('/teams/my'),
    createTeam: (name, courseId) => request('/teams/create', { method: 'POST', body: JSON.stringify({ name, courseId }) }),
    joinTeam: (teamId) => request(`/teams/${teamId}/join`, { method: 'POST' }),
    leaveTeam: (teamId) => request(`/teams/${teamId}/leave`, { method: 'POST' }),
    compete: () => request('/teams/compete', { method: 'POST' }),
    getMatches: () => request('/teams/matches')
  },
  rewards: {
    getShop: () => request('/rewards/shop'),
    buyPowerUp: (powerUpId) => request('/rewards/buy', { method: 'POST', body: JSON.stringify({ powerUpId }) }),
    getInventory: () => request('/rewards/inventory'),
    getScratchCards: () => request('/rewards/scratch-cards'),
    revealScratchCard: (cardId) => request(`/rewards/scratch-cards/${cardId}/reveal`, { method: 'POST' }),
    getTransactions: () => request('/rewards/transactions')
  },
  streaks: {
    getDetails: () => request('/streaks'),
    simulateMiss: () => request('/streaks/simulate-miss', { method: 'POST' }),
    getRestoreTask: () => request('/streaks/restore-task'),
    submitRestoreTask: (taskId, code) => request('/streaks/restore-task/submit', {
      method: 'POST',
      body: JSON.stringify({ taskId, code })
    }),
    useRestoreCard: () => request('/streaks/use-restore-card', { method: 'POST' })
  },
  ai: {
    chat: (message) => request('/ai/chat', { method: 'POST', body: JSON.stringify({ message }) }),
    getPerformance: () => request('/ai/performance')
  },
  notifications: {
    getAll: () => request('/notifications'),
    markRead: (id) => request(`/notifications/${id}/read`, { method: 'POST' }),
    markAllRead: () => request('/notifications/read-all', { method: 'POST' })
  }
};

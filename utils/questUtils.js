function getCurrentPeriodIdentifier(type) {
  const now = new Date();

  if (type === 'daily') {
    return now.toISOString().split('T')[0];
  } else if (type === 'weekly') {
    const date = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
    return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  }

  return 'unknown';
}

module.exports = {
  getCurrentPeriodIdentifier,
};

const Quest = require('../models/Quest');
const QuestProgress = require('../models/QuestProgress');
const { getCurrentPeriodIdentifier } = require('../utils/questUtils');

// GET /quests/:walletAddress
exports.getActiveQuests = async (req, res, next) => {
    const walletAddress = req.user.walletAddress;

    try {
        const now = new Date();
        const dailyIdentifier = getCurrentPeriodIdentifier('daily');
        const weeklyIdentifier = getCurrentPeriodIdentifier('weekly');

        const activeQuests = await Quest.find({ isActive: true });

        const progressRecords = await QuestProgress.find({
            walletAddress,
            questId: { $in: activeQuests.map(q => q.questId) },
            periodIdentifier: { $in: [dailyIdentifier, weeklyIdentifier] }
        });

        const questsWithProgress = activeQuests.map(quest => {
            const periodId = quest.type === 'daily' ? dailyIdentifier : weeklyIdentifier;
            const progress = progressRecords.find(p => p.questId === quest.questId && p.periodIdentifier === periodId);
            return {
                questId: quest.questId,
                description: quest.description,
                type: quest.type,
                goal: quest.goal,
                metric: quest.metric,
                reward: quest.reward,
                currentProgress: progress ? progress.progress : 0,
                isCompleted: progress ? progress.isCompleted : false,
            };
        });

        res.status(200).json(questsWithProgress);
    } catch (error) {
        next(error);
    }
};

// POST /quests/update - Internal helper function
async function updateQuestProgress(walletAddress, metric, increment = 1) {
    console.log(`Updating quest progress for ${walletAddress}, metric: ${metric}, increment: ${increment}`);
    try {
        const dailyIdentifier = getCurrentPeriodIdentifier('daily');
        const weeklyIdentifier = getCurrentPeriodIdentifier('weekly');

        const relevantQuests = await Quest.find({ metric: metric, isActive: true });
        if (!relevantQuests.length) return;

        for (const quest of relevantQuests) {
            const periodId = quest.type === 'daily' ? dailyIdentifier : weeklyIdentifier;

            const progressRecord = await QuestProgress.findOneAndUpdate(
                { walletAddress, questId: quest.questId, periodIdentifier: periodId },
                { $inc: { progress: increment }, $set: { lastUpdatedAt: new Date() } },
                { upsert: true, new: true }
            );

            if (!progressRecord.isCompleted && progressRecord.progress >= quest.goal) {
                progressRecord.isCompleted = true;
                progressRecord.completedAt = new Date();
                await progressRecord.save();
                console.log(`Quest ${quest.questId} completed for ${walletAddress} in period ${periodId}`);
                showToast(`Quest Completed: ${quest.description}! +${quest.reward} SOL`, 'success');
            }
        }
    } catch (error) {
        console.error(`Error updating quest progress for ${walletAddress}:`, error);
    }
}

module.exports.updateQuestProgress = updateQuestProgress;

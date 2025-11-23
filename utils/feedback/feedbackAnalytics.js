const natural = require('natural');
const { WordTokenizer, SentimentAnalyzer, PorterStemmer } = natural;
const tokenizer = new WordTokenizer();
const analyzer = new SentimentAnalyzer('English', PorterStemmer, 'afinn');

class FeedbackAnalytics {
    
    // Calculate sentiment score
    static calculateSentiment(text) {
        try {
            const tokens = tokenizer.tokenize(text.toLowerCase());
            const score = analyzer.getSentiment(tokens);
            
            let label = 'neutral';
            if (score > 0.1) label = 'positive';
            else if (score < -0.1) label = 'negative';
            
            const confidence = Math.min(Math.abs(score) * 2, 1); // Normalize to 0-1
            
            return {
                score: parseFloat(score.toFixed(3)),
                label,
                confidence: parseFloat(confidence.toFixed(3))
            };
        } catch (error) {
            return {
                score: 0,
                label: 'neutral',
                confidence: 0
            };
        }
    }

    // Extract keywords from feedback
    static extractKeywords(text, maxKeywords = 5) {
        try {
            const tokens = tokenizer.tokenize(text.toLowerCase());
            const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
            
            const frequency = {};
            tokens.forEach(token => {
                if (token.length > 2 && !stopWords.has(token)) {
                    frequency[token] = (frequency[token] || 0) + 1;
                }
            });
            
            return Object.entries(frequency)
                .sort(([,a], [,b]) => b - a)
                .slice(0, maxKeywords)
                .map(([word]) => word);
        } catch (error) {
            return [];
        }
    }

    // Categorize feedback automatically
    static categorizeFeedback(text, rating) {
        const keywords = {
            bug: ['error', 'bug', 'crash', 'not working', 'broken', 'issue', 'problem'],
            feature_request: ['should have', 'would be nice', 'please add', 'suggest', 'feature'],
            complaint: ['terrible', 'awful', 'horrible', 'disappointed', 'frustrated', 'angry'],
            appreciation: ['great', 'awesome', 'amazing', 'love', 'thank you', 'excellent', 'good']
        };

        const textLower = text.toLowerCase();
        
        for (const [category, words] of Object.entries(keywords)) {
            if (words.some(word => textLower.includes(word))) {
                return category;
            }
        }

        // Fallback based on rating
        if (rating <= 2) return 'complaint';
        if (rating >= 4) return 'appreciation';
        
        return 'general';
    }

    // Calculate priority based on content and rating
    static calculatePriority(text, rating, category) {
        let score = 0;
        
        // Rating impact (lower rating = higher priority)
        score += (6 - rating) * 2;
        
        // Category impact
        if (category === 'bug') score += 3;
        if (category === 'complaint') score += 2;
        
        // Keyword impact
        const urgentKeywords = ['urgent', 'critical', 'emergency', 'not working', 'broken'];
        if (urgentKeywords.some(keyword => text.toLowerCase().includes(keyword))) {
            score += 5;
        }

        // Determine priority
        if (score >= 8) return 'critical';
        if (score >= 6) return 'high';
        if (score >= 4) return 'medium';
        return 'low';
    }

    // Generate analytics insights
    static generateInsights(analyticsData) {
        const insights = [];
        const { overview, trends, teamPerformance } = analyticsData;

        // High priority feedback insight
        if (overview.byPriority?.critical > 5) {
            insights.push({
                type: 'warning',
                title: 'High Critical Feedback',
                message: `You have ${overview.byPriority.critical} critical feedback items requiring immediate attention.`,
                priority: 'high'
            });
        }

        // Low resolution rate insight
        const totalResolved = overview.byStatus?.resolved || 0;
        const totalClosed = overview.byStatus?.closed || 0;
        const totalFeedback = overview.total;
        const resolutionRate = ((totalResolved + totalClosed) / totalFeedback) * 100;

        if (resolutionRate < 50) {
            insights.push({
                type: 'info',
                title: 'Low Resolution Rate',
                message: `Your feedback resolution rate is ${resolutionRate.toFixed(1)}%. Consider allocating more resources.`,
                priority: 'medium'
            });
        }

        // Team performance insights
        if (teamPerformance && teamPerformance.length > 0) {
            const lowestPerformer = teamPerformance[teamPerformance.length - 1];
            if (lowestPerformer.resolutionRate < 30) {
                insights.push({
                    type: 'warning',
                    title: 'Team Member Needs Support',
                    message: `${lowestPerformer.adminName} has a low resolution rate of ${lowestPerformer.resolutionRate}%.`,
                    priority: 'medium'
                });
            }
        }

        // Response time insight
        if (overview.responseMetrics?.avgResponseTime > 24) {
            insights.push({
                type: 'warning',
                title: 'Slow Response Times',
                message: `Average response time is ${overview.responseMetrics.avgResponseTime.toFixed(1)} hours. Aim for under 24 hours.`,
                priority: 'high'
            });
        }

        return insights;
    }
}

module.exports = FeedbackAnalytics;
export const CATEGORIES = [
  'Study',
  'Coding',
  'Business',
  'Design Inspiration',
  'Shopping Research',
  'Client Work',
  'Ideas',
  'Finance',
  'Health',
  'General',
] as const;

export type Category = (typeof CATEGORIES)[number];

const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  Study: ['learn', 'course', 'education', 'university', 'lecture', 'exam', 'study', 'tutorial', 'research', 'academic'],
  Coding: ['code', 'programming', 'javascript', 'typescript', 'python', 'react', 'api', 'function', 'developer', 'github', 'software', 'algorithm', 'debug'],
  Business: ['business', 'startup', 'marketing', 'sales', 'strategy', 'company', 'enterprise', 'revenue', 'growth', 'b2b'],
  'Design Inspiration': ['design', 'ui', 'ux', 'layout', 'typography', 'color', 'inspiration', 'figma', 'aesthetic', 'visual', 'website'],
  'Shopping Research': ['buy', 'price', 'product', 'review', 'amazon', 'shop', 'deal', 'compare', 'purchase', 'cart'],
  'Client Work': ['client', 'project', 'deliverable', 'deadline', 'proposal', 'contract', 'meeting', 'stakeholder'],
  Ideas: ['idea', 'brainstorm', 'concept', 'innovation', 'thought', 'inspiration', 'creative', 'possibility'],
  Finance: ['finance', 'bank', 'invest', 'stock', 'money', 'budget', 'tax', 'loan', 'crypto', 'savings', 'accounting'],
  Health: ['health', 'fitness', 'wellness', 'medical', 'nutrition', 'exercise', 'mental', 'diet', 'sleep'],
  General: [],
};

export function categorizeByKeywords(content: string, domain: string): Category {
  const text = `${content} ${domain}`.toLowerCase();
  let bestCategory: Category = 'General';
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [Category, string[]][]) {
    if (category === 'General') continue;
    const score = keywords.reduce((acc, kw) => acc + (text.includes(kw) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  return bestCategory;
}

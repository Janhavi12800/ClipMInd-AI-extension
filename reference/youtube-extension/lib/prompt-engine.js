/**
 * Prompt templates + JSON schemas for AI providers.
 */

export const THUMBNAIL_ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    ctr_score: { type: 'integer', description: 'Predicted CTR potential 1-10' },
    quality_ctr_note: { type: 'string' },
    strengths: { type: 'array', items: { type: 'string' } },
    weaknesses: { type: 'array', items: { type: 'string' } },
    text_readability: { type: 'string', enum: ['good', 'fair', 'poor'] },
    face_detected: { type: 'boolean' },
    color_contrast: { type: 'string', enum: ['high', 'medium', 'low'] },
    emotion_trigger: {
      type: 'string',
      enum: ['curiosity', 'shock', 'value', 'fear', 'none']
    },
    recommendations: { type: 'array', items: { type: 'string' } },
    improved_title_suggestion: { type: 'string' }
  },
  required: [
    'ctr_score',
    'strengths',
    'weaknesses',
    'recommendations',
    'improved_title_suggestion'
  ]
};

export const SEO_GENERATION_SCHEMA = {
  type: 'object',
  properties: {
    titles: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          ctr_potential: { type: 'integer' },
          style: {
            type: 'string',
            enum: ['curiosity', 'how-to', 'listicle', 'story', 'contrarian']
          }
        },
        required: ['text', 'ctr_potential', 'style']
      }
    },
    description: { type: 'string' },
    tags: { type: 'array', items: { type: 'string' } },
    hashtags: { type: 'array', items: { type: 'string' } },
    chapters: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          time: { type: 'string' },
          title: { type: 'string' }
        },
        required: ['time', 'title']
      }
    },
    hook_script_15sec: { type: 'string' },
    packaging_score: { type: 'integer' }
  },
  required: ['titles', 'description', 'tags', 'hook_script_15sec', 'packaging_score']
};

/**
 * @param {{ title: string, channel?: string, niche?: string }} ctx
 * @returns {{ system: string, user: string }}
 */
export function buildThumbnailAnalysisPrompt(ctx) {
  return {
    system: `You are a YouTube packaging expert. Score thumbnails for CTR and Quality CTR (accurate expectation vs clickbait). Respond only with valid JSON matching the schema.`,
    user: `Analyze this YouTube thumbnail for the video titled "${ctx.title}"${ctx.channel ? ` by ${ctx.channel}` : ''}${ctx.niche ? ` in the ${ctx.niche} niche` : ''}. Rate ctr_score 1-10. Give 3 strengths, 3 weaknesses, and 3 actionable recommendations.`
  };
}

/**
 * @param {{ topic: string, keywords?: string[], transcript?: string, language?: string }} ctx
 * @returns {{ system: string, user: string }}
 */
export function buildSeoPrompt(ctx) {
  const lang = ctx.language || 'en';
  return {
    system: `You are a YouTube SEO strategist. Generate 5 title variants optimized for CTR and watch-time alignment. First 2 lines of description must be search-optimized. Language: ${lang}. JSON only.`,
    user: `Topic: ${ctx.topic}\nKeywords: ${(ctx.keywords || []).join(', ') || 'none'}\n${ctx.transcript ? `Transcript excerpt:\n${ctx.transcript.slice(0, 3000)}` : ''}`
  };
}

/** Gemini model for vision + structured JSON — NOT gemini-2.5-flash-image */
export const GEMINI_VISION_MODEL = 'gemini-2.5-flash';

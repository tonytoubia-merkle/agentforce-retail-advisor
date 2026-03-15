export interface SkinConcernScore {
  concern: string;
  label: string;
  score: number; // 0–100
  severity: 'none' | 'mild' | 'moderate' | 'severe';
}

export interface SkinAnalysisResult {
  skinType: 'dry' | 'oily' | 'combination' | 'normal' | 'sensitive';
  skinAge: number;
  overallScore: number; // 0–100, higher = healthier
  concerns: SkinConcernScore[];
  primaryConcern: string;
  analyzedAt: string; // ISO string
  // Raw provider response stored for Data Cloud profile enrichment
  rawResult?: Record<string, unknown>;
}

/** Summary string sent to the agent after analysis to seed the conversation. */
export function buildAnalysisSummary(result: SkinAnalysisResult): string {
  const top = result.concerns
    .filter((c) => c.severity !== 'none')
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((c) => `${c.label} (${c.severity})`)
    .join(', ');

  return (
    `Skin analysis complete. Skin type: ${result.skinType}. ` +
    `Estimated skin age: ${result.skinAge}. ` +
    `Overall skin health score: ${result.overallScore}/100. ` +
    (top ? `Top concerns: ${top}. ` : 'No significant concerns detected. ') +
    `Please review these results and recommend a personalized skincare routine.`
  );
}

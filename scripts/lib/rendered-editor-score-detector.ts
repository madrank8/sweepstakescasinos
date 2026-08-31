export interface RenderedEditorScoreContext {
  kind:
    | 'labeled-score'
    | 'score-total'
    | 'star-score'
    | 'score-bars-total'
    | 'sticky-score';
  value: number;
  scale: 5 | 100;
  excerpt: string;
}

export function findRenderedEditorScoreContexts(
  _html: string,
): RenderedEditorScoreContext[] {
  return [];
}

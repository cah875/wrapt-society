// PeptideVault color palette — permanent dark mode.
// These exact values are used across every screen and component.

export const colors = {
  background: '#0F1117',
  cardSurface: '#1A1D2E',
  primaryAccent: '#00D4AA', // teal / cyan
  secondaryAccent: '#7C5CBF', // soft purple
  warning: '#F5A623',
  danger: '#E84040', // expired / danger
  textPrimary: '#FFFFFF',
  textSecondary: '#8A8FA8',

  // Derived / convenience tints used in a few components.
  primaryAccentDim: 'rgba(0, 212, 170, 0.15)',
  secondaryAccentDim: 'rgba(124, 92, 191, 0.15)',
  warningDim: 'rgba(245, 166, 35, 0.15)',
  dangerDim: 'rgba(232, 64, 64, 0.15)',
  border: '#262A3E',
  overlay: 'rgba(0, 0, 0, 0.75)',
} as const;

export type AppColors = typeof colors;

// Map a peptide category string to an accent color for badges.
export function categoryColor(category: string): string {
  const c = category.toLowerCase();
  if (c.includes('recovery')) return colors.primaryAccent;
  if (c.includes('gh secretagogue')) return colors.secondaryAccent;
  if (c.includes('glp-1') || c.includes('metabolic')) return '#4A90D9';
  if (c.includes('cognitive')) return '#E0A458';
  if (c.includes('longevity')) return '#5CBFA8';
  if (c.includes('mitochondrial')) return '#BF5C9E';
  if (c.includes('sexual')) return '#D95C7C';
  if (c.includes('immune')) return '#5C9EBF';
  if (c.includes('sleep')) return '#7C7CBF';
  if (c.includes('antimicrobial')) return '#9EBF5C';
  if (c.includes('skin')) return '#BFA85C';
  if (c.includes('cardio')) return '#D9744A';
  return colors.textSecondary; // Other / uncategorized
}

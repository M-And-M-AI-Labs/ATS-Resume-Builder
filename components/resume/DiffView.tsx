'use client';

import { useState } from 'react';
import { ResumeJSON } from '@/types/resume';

interface DiffViewProps {
  original: ResumeJSON;
  tailored: ResumeJSON;
}

type DiffType = 'added' | 'removed' | 'modified' | 'unchanged';

// Normalize string for comparison (collapse whitespace, normalize unicode)
function normalizeForComparison(str: string): string {
  return str
    .normalize('NFKC') // Normalize unicode
    .replace(/[\u2018\u2019]/g, "'") // Smart quotes to regular
    .replace(/[\u201C\u201D]/g, '"') // Smart double quotes
    .replace(/[\u2013\u2014]/g, '-') // En/em dash to hyphen
    .replace(/\s+/g, ' ') // Collapse whitespace
    .trim();
}

// Check if two strings are effectively the same (ignoring formatting differences)
function areStringsEqual(a: string, b: string): boolean {
  return normalizeForComparison(a) === normalizeForComparison(b);
}

interface DiffLine {
  type: DiffType;
  original?: string;
  tailored?: string;
  content: string;
}

interface SectionDiff {
  name: string;
  lines: DiffLine[];
  hasChanges: boolean;
}

// Simple word-level diff for a single line
function getWordDiff(original: string, tailored: string): { original: JSX.Element; tailored: JSX.Element } {
  const origWords = original.split(/(\s+)/);
  const tailWords = tailored.split(/(\s+)/);

  // Find common words using LCS-like approach (simplified)
  const origSet = new Set(origWords.filter(w => w.trim()));
  const tailSet = new Set(tailWords.filter(w => w.trim()));

  const origElements = origWords.map((word, i) => {
    if (!word.trim()) return <span key={i}>{word}</span>;
    if (!tailSet.has(word)) {
      return <span key={i} className="bg-red-200 text-red-800 px-0.5 rounded">{word}</span>;
    }
    return <span key={i}>{word}</span>;
  });

  const tailElements = tailWords.map((word, i) => {
    if (!word.trim()) return <span key={i}>{word}</span>;
    if (!origSet.has(word)) {
      return <span key={i} className="bg-green-200 text-green-800 px-0.5 rounded">{word}</span>;
    }
    return <span key={i}>{word}</span>;
  });

  return {
    original: <>{origElements}</>,
    tailored: <>{tailElements}</>,
  };
}

// Compare two arrays of strings (like bullets)
function compareBullets(original: string[], tailored: string[]): DiffLine[] {
  const lines: DiffLine[] = [];
  const maxLen = Math.max(original.length, tailored.length);

  for (let i = 0; i < maxLen; i++) {
    const orig = original[i];
    const tail = tailored[i];

    if (orig && tail) {
      if (areStringsEqual(orig, tail)) {
        lines.push({ type: 'unchanged', content: tail });
      } else {
        lines.push({ type: 'modified', original: orig, tailored: tail, content: tail });
      }
    } else if (orig && !tail) {
      lines.push({ type: 'removed', content: orig });
    } else if (!orig && tail) {
      lines.push({ type: 'added', content: tail });
    }
  }

  return lines;
}

// Generate diff for experience section
function diffExperience(original: ResumeJSON['experience'], tailored: ResumeJSON['experience']): SectionDiff {
  const lines: DiffLine[] = [];
  let hasChanges = false;

  const maxLen = Math.max(original?.length || 0, tailored?.length || 0);

  for (let i = 0; i < maxLen; i++) {
    const orig = original?.[i];
    const tail = tailored?.[i];

    if (orig && tail) {
      // Compare header (company, title)
      const origHeader = `${orig.company}, ${orig.location} | ${orig.title} (${orig.start} – ${orig.end})`;
      const tailHeader = `${tail.company}, ${tail.location} | ${tail.title} (${tail.start} – ${tail.end})`;

      if (!areStringsEqual(origHeader, tailHeader)) {
        hasChanges = true;
        lines.push({ type: 'modified', original: origHeader, tailored: tailHeader, content: tailHeader });
      } else {
        lines.push({ type: 'unchanged', content: tailHeader });
      }

      // Compare bullets
      const bulletDiffs = compareBullets(orig.bullets || [], tail.bullets || []);
      bulletDiffs.forEach(diff => {
        if (diff.type !== 'unchanged') hasChanges = true;
        lines.push({ ...diff, content: `• ${diff.content}` });
      });

      lines.push({ type: 'unchanged', content: '' }); // Spacer
    } else if (orig && !tail) {
      hasChanges = true;
      lines.push({ type: 'removed', content: `${orig.company} - ${orig.title}` });
    } else if (!orig && tail) {
      hasChanges = true;
      lines.push({ type: 'added', content: `${tail.company} - ${tail.title}` });
    }
  }

  return { name: 'Work Experience', lines, hasChanges };
}

// Generate diff for education section
function diffEducation(original: ResumeJSON['education'], tailored: ResumeJSON['education']): SectionDiff {
  const lines: DiffLine[] = [];
  let hasChanges = false;

  const maxLen = Math.max(original?.length || 0, tailored?.length || 0);

  for (let i = 0; i < maxLen; i++) {
    const orig = original?.[i];
    const tail = tailored?.[i];

    if (orig && tail) {
      const origLine = `${orig.institution}, ${orig.location || ''} | ${orig.degree}${orig.field ? `, ${orig.field}` : ''} (${orig.end || ''})`;
      const tailLine = `${tail.institution}, ${tail.location || ''} | ${tail.degree}${tail.field ? `, ${tail.field}` : ''} (${tail.end || ''})`;

      if (!areStringsEqual(origLine, tailLine)) {
        hasChanges = true;
        lines.push({ type: 'modified', original: origLine, tailored: tailLine, content: tailLine });
      } else {
        lines.push({ type: 'unchanged', content: tailLine });
      }
    }
  }

  return { name: 'Education', lines, hasChanges };
}

// Generate diff for projects section
function diffProjects(original: ResumeJSON['projects'], tailored: ResumeJSON['projects']): SectionDiff {
  const lines: DiffLine[] = [];
  let hasChanges = false;

  const maxLen = Math.max(original?.length || 0, tailored?.length || 0);

  for (let i = 0; i < maxLen; i++) {
    const orig = original?.[i];
    const tail = tailored?.[i];

    if (orig && tail) {
      // Project name
      if (!areStringsEqual(orig.name, tail.name)) {
        hasChanges = true;
        lines.push({ type: 'modified', original: orig.name, tailored: tail.name, content: tail.name });
      } else {
        lines.push({ type: 'unchanged', content: tail.name });
      }

      // Description
      if (!areStringsEqual(orig.description, tail.description)) {
        hasChanges = true;
        lines.push({ type: 'modified', original: `• ${orig.description}`, tailored: `• ${tail.description}`, content: `• ${tail.description}` });
      } else {
        lines.push({ type: 'unchanged', content: `• ${tail.description}` });
      }

      lines.push({ type: 'unchanged', content: '' });
    }
  }

  return { name: 'Projects', lines, hasChanges };
}

// Generate diff for skills section
function diffSkills(original: ResumeJSON['skills'], tailored: ResumeJSON['skills']): SectionDiff {
  const lines: DiffLine[] = [];
  let hasChanges = false;

  const origGroups = original?.groups || [];
  const tailGroups = tailored?.groups || [];

  const maxLen = Math.max(origGroups.length, tailGroups.length);

  for (let i = 0; i < maxLen; i++) {
    const orig = origGroups[i];
    const tail = tailGroups[i];

    if (orig && tail) {
      const origLine = `${orig.name}: ${orig.items.join(', ')}`;
      const tailLine = `${tail.name}: ${tail.items.join(', ')}`;

      if (!areStringsEqual(origLine, tailLine)) {
        hasChanges = true;
        lines.push({ type: 'modified', original: origLine, tailored: tailLine, content: tailLine });
      } else {
        lines.push({ type: 'unchanged', content: tailLine });
      }
    } else if (orig && !tail) {
      hasChanges = true;
      lines.push({ type: 'removed', content: `${orig.name}: ${orig.items.join(', ')}` });
    } else if (!orig && tail) {
      hasChanges = true;
      lines.push({ type: 'added', content: `${tail.name}: ${tail.items.join(', ')}` });
    }
  }

  return { name: 'Skills', lines, hasChanges };
}

// Generate diff for summary
function diffSummary(original: string | undefined, tailored: string | undefined): SectionDiff {
  const lines: DiffLine[] = [];
  let hasChanges = false;

  const origNorm = original || '';
  const tailNorm = tailored || '';

  if (!areStringsEqual(origNorm, tailNorm)) {
    hasChanges = true;
    if (original && tailored) {
      lines.push({ type: 'modified', original, tailored, content: tailored });
    } else if (original && !tailored) {
      lines.push({ type: 'removed', content: original });
    } else if (!original && tailored) {
      lines.push({ type: 'added', content: tailored });
    }
  } else if (tailored) {
    lines.push({ type: 'unchanged', content: tailored });
  }

  return { name: 'Summary', lines, hasChanges };
}

export default function DiffView({ original, tailored }: DiffViewProps) {
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('unified');
  const [showOnlyChanges, setShowOnlyChanges] = useState(false);

  // Generate diffs for each section
  const sections: SectionDiff[] = [
    diffSummary(original.summary, tailored.summary),
    diffEducation(original.education, tailored.education),
    diffExperience(original.experience, tailored.experience),
    diffProjects(original.projects, tailored.projects),
    diffSkills(original.skills, tailored.skills),
  ].filter(section => !showOnlyChanges || section.hasChanges);

  const totalChanges = sections.reduce((acc, section) =>
    acc + section.lines.filter(l => l.type !== 'unchanged').length, 0
  );

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold text-slate-900">Changes Made</h3>
          <span className="text-sm text-slate-500">
            {totalChanges} change{totalChanges !== 1 ? 's' : ''} detected
          </span>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={showOnlyChanges}
              onChange={(e) => setShowOnlyChanges(e.target.checked)}
              className="rounded border-slate-300"
            />
            Show only changes
          </label>
          <div className="flex rounded-lg border border-slate-300 overflow-hidden">
            <button
              onClick={() => setViewMode('unified')}
              className={`px-3 py-1 text-sm ${viewMode === 'unified' ? 'bg-slate-200 text-slate-900' : 'bg-white text-slate-600'}`}
            >
              Unified
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1 text-sm ${viewMode === 'split' ? 'bg-slate-200 text-slate-900' : 'bg-white text-slate-600'}`}
            >
              Split
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-6 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-green-100 border border-green-300"></span>
          <span className="text-slate-600">Added</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-red-100 border border-red-300"></span>
          <span className="text-slate-600">Removed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-amber-100 border border-amber-300"></span>
          <span className="text-slate-600">Modified</span>
        </div>
      </div>

      {/* Diff Content */}
      <div className="bg-white max-h-[500px] overflow-y-auto">
        {sections.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No changes were made to the resume.
          </div>
        ) : (
          sections.map((section, sectionIdx) => (
            <div key={sectionIdx} className="border-b border-slate-100 last:border-b-0">
              {/* Section Header */}
              <div className="bg-slate-50 px-4 py-2 flex items-center gap-2">
                <span className="font-medium text-sm text-slate-700">{section.name}</span>
                {section.hasChanges && (
                  <span className="px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 rounded">
                    modified
                  </span>
                )}
              </div>

              {/* Section Lines */}
              <div className="font-mono text-sm">
                {viewMode === 'unified' ? (
                  // Unified view
                  <div>
                    {section.lines.map((line, lineIdx) => {
                      if (line.type === 'unchanged') {
                        if (!line.content) return <div key={lineIdx} className="h-2" />;
                        return (
                          <div key={lineIdx} className="px-4 py-1 text-slate-700 bg-white">
                            {line.content}
                          </div>
                        );
                      }

                      if (line.type === 'added') {
                        return (
                          <div key={lineIdx} className="px-4 py-1 bg-green-50 text-green-800 border-l-4 border-green-400">
                            <span className="text-green-600 mr-2">+</span>
                            {line.content}
                          </div>
                        );
                      }

                      if (line.type === 'removed') {
                        return (
                          <div key={lineIdx} className="px-4 py-1 bg-red-50 text-red-800 border-l-4 border-red-400">
                            <span className="text-red-600 mr-2">−</span>
                            {line.content}
                          </div>
                        );
                      }

                      if (line.type === 'modified' && line.original && line.tailored) {
                        const { original: origEl, tailored: tailEl } = getWordDiff(line.original, line.tailored);
                        return (
                          <div key={lineIdx}>
                            <div className="px-4 py-1 bg-red-50 text-red-800 border-l-4 border-red-400">
                              <span className="text-red-600 mr-2">−</span>
                              {origEl}
                            </div>
                            <div className="px-4 py-1 bg-green-50 text-green-800 border-l-4 border-green-400">
                              <span className="text-green-600 mr-2">+</span>
                              {tailEl}
                            </div>
                          </div>
                        );
                      }

                      return null;
                    })}
                  </div>
                ) : (
                  // Split view
                  <div className="grid grid-cols-2 divide-x divide-slate-200">
                    <div className="bg-red-50/30">
                      <div className="px-3 py-1 text-xs font-semibold text-slate-500 bg-slate-100 border-b border-slate-200">
                        Original
                      </div>
                      {section.lines.map((line, lineIdx) => {
                        if (line.type === 'unchanged') {
                          if (!line.content) return <div key={lineIdx} className="h-2" />;
                          return (
                            <div key={lineIdx} className="px-3 py-1 text-slate-600 text-xs">
                              {line.content}
                            </div>
                          );
                        }
                        if (line.type === 'removed' || line.type === 'modified') {
                          const content = line.type === 'modified' ? line.original : line.content;
                          return (
                            <div key={lineIdx} className="px-3 py-1 bg-red-100 text-red-800 text-xs">
                              {content}
                            </div>
                          );
                        }
                        if (line.type === 'added') {
                          return <div key={lineIdx} className="px-3 py-1 text-xs text-slate-300">—</div>;
                        }
                        return null;
                      })}
                    </div>
                    <div className="bg-green-50/30">
                      <div className="px-3 py-1 text-xs font-semibold text-slate-500 bg-slate-100 border-b border-slate-200">
                        Tailored
                      </div>
                      {section.lines.map((line, lineIdx) => {
                        if (line.type === 'unchanged') {
                          if (!line.content) return <div key={lineIdx} className="h-2" />;
                          return (
                            <div key={lineIdx} className="px-3 py-1 text-slate-600 text-xs">
                              {line.content}
                            </div>
                          );
                        }
                        if (line.type === 'added' || line.type === 'modified') {
                          const content = line.type === 'modified' ? line.tailored : line.content;
                          return (
                            <div key={lineIdx} className="px-3 py-1 bg-green-100 text-green-800 text-xs">
                              {content}
                            </div>
                          );
                        }
                        if (line.type === 'removed') {
                          return <div key={lineIdx} className="px-3 py-1 text-xs text-slate-300">—</div>;
                        }
                        return null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

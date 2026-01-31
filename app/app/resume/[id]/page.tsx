'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ResumeJSON, ATSKeywordDiff, ATSGapReport } from '@/types/resume';
import DiffView from '@/components/resume/DiffView';
import SectionEditor from '@/components/resume/SectionEditor';

type ViewTab = 'preview' | 'changes' | 'analysis' | 'edit';

export default function ResumePreviewPage() {
  const params = useParams();
  const router = useRouter();
  const resumeId = params.id as string;
  const supabase = createClient();

  const [resume, setResume] = useState<ResumeJSON | null>(null);
  const [originalResume, setOriginalResume] = useState<ResumeJSON | null>(null);
  const [keywordDiff, setKeywordDiff] = useState<ATSKeywordDiff | null>(null);
  const [gapReport, setGapReport] = useState<ATSGapReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<ViewTab>('changes');
  const [editedResume, setEditedResume] = useState<ResumeJSON | null>(null);
  const [docsExporting, setDocsExporting] = useState(false);

  const loadResume = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data, error } = await supabase
      .from('tailored_resumes')
      .select('tailored_resume_json, original_resume_json, ats_keyword_diff, ats_gap_report')
      .eq('id', resumeId)
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      console.error('Error loading resume:', error);
      return;
    }

    setResume(data.tailored_resume_json);
    setOriginalResume(data.original_resume_json);
    setEditedResume(data.tailored_resume_json); // Initialize edited state with AI-tailored version
    setKeywordDiff(data.ats_keyword_diff);
    setGapReport(data.ats_gap_report);
    setLoading(false);
  }, [resumeId, supabase, router]);

  useEffect(() => {
    loadResume();
  }, [loadResume]);

  const handleExport = async (format: 'docx' | 'txt' | 'pdf') => {
    setExporting(true);
    try {
      const response = await fetch(`/api/resume/export/${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tailoredResumeId: resumeId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Export failed');
      }

      if (format === 'docx') {
        const byteCharacters = atob(data.docx);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: data.mimeType });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'resume.docx';
        a.click();
        URL.revokeObjectURL(url);
      } else if (format === 'pdf') {
        const byteCharacters = atob(data.pdf);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: data.mimeType });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'resume.pdf';
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const blob = new Blob([data.txt], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'resume.txt';
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleDocsExport = async () => {
    setDocsExporting(true);
    try {
      const response = await fetch('/api/resume/export/docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume: editedResume }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Export failed');
      }

      // Open in new tab
      window.open(data.docUrl, '_blank');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to export to Google Docs');
    } finally {
      setDocsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading resume...</div>
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">Resume not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/app')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back
              </button>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleExport('pdf')}
                disabled={exporting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 18h12a2 2 0 002-2V6l-4-4H4a2 2 0 00-2 2v12a2 2 0 002 2zm8-14l3 3h-3V4zM6 9h8v2H6V9zm0 3h8v2H6v-2z"/>
                </svg>
                {exporting ? 'Exporting...' : 'PDF'}
              </button>
              <button
                onClick={() => handleExport('docx')}
                disabled={exporting}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 18h12a2 2 0 002-2V6l-4-4H4a2 2 0 00-2 2v12a2 2 0 002 2zm8-14l3 3h-3V4z"/>
                </svg>
                {exporting ? 'Exporting...' : 'DOCX'}
              </button>
              <button
                onClick={() => handleExport('txt')}
                disabled={exporting}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 18h12a2 2 0 002-2V4a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2zm2-10h8v2H6V8zm0 3h8v2H6v-2zm0 3h5v2H6v-2z"/>
                </svg>
                {exporting ? 'Exporting...' : 'TXT'}
              </button>

              {/* Google Docs export */}
              <div className="border-l border-gray-300 h-6 mx-1" />
              <button
                onClick={handleDocsExport}
                disabled={docsExporting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
                  <path d="M8 12h8v2H8zm0 4h8v2H8zm0-8h5v2H8z"/>
                </svg>
                {docsExporting ? 'Exporting...' : 'Google Docs'}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('changes')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'changes'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Changes Made
              {originalResume && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700">
                  Review
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'preview'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Final Preview
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analysis'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              ATS Analysis
            </button>
            <button
              onClick={() => setActiveTab('edit')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'edit'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Edit Sections
            </button>
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Changes Tab - Diff View */}
        {activeTab === 'changes' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Review Changes</h2>
              <p className="text-gray-600 text-sm mb-6">
                Review all the changes made to your resume before exporting.
                Green highlights show additions, red shows removals.
              </p>

              {originalResume ? (
                <DiffView original={originalResume} tailored={resume} />
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>Original resume data not available for comparison.</p>
                  <p className="text-sm mt-2">This may be an older tailored resume.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Preview Tab - uses editedResume to reflect any user edits */}
        {activeTab === 'preview' && editedResume && (
          <div className="bg-white rounded-lg shadow p-8">
            <div className="resume-preview font-['Calibri',sans-serif]">
              {/* Header */}
              <div className="text-center mb-4">
                <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">
                  {editedResume.header.name}
                </h1>
                <div className="mt-1 text-sm text-gray-700">
                  {[
                    editedResume.header.location,
                    editedResume.header.phone && `P: ${editedResume.header.phone}`,
                    editedResume.header.email,
                  ].filter(Boolean).join(' | ')}
                </div>
                {editedResume.header.links && editedResume.header.links.length > 0 && (
                  <div className="mt-1 text-sm text-gray-600">
                    {editedResume.header.links.map((link, i) => (
                      <span key={i}>
                        {i > 0 && ' | '}
                        <a href={link.url} className="text-indigo-600 hover:underline">
                          {link.type}
                        </a>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Education */}
              {editedResume.education && editedResume.education.length > 0 && (
                <section className="mb-4">
                  <h2 className="text-sm font-bold text-gray-900 uppercase border-b border-gray-900 pb-1 mb-2">
                    Education
                  </h2>
                  {editedResume.education.map((edu, i) => (
                    <div key={i} className="mb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-bold text-sm">{edu.institution}</span>
                          {edu.location && <span className="text-sm">, {edu.location}</span>}
                        </div>
                        <div className="text-sm text-right">
                          <span className="font-bold">{edu.degree}{edu.field && `, ${edu.field}`}</span>
                          {edu.end && <span>, {edu.start ? `${edu.start} - ${edu.end}` : edu.end}</span>}
                        </div>
                      </div>
                      {(edu.gpa || edu.honors) && (
                        <div className="text-sm text-gray-700 mt-0.5">
                          {[edu.gpa && `GPA: ${edu.gpa}`, edu.honors].filter(Boolean).join('; ')}
                        </div>
                      )}
                      {edu.coursework && edu.coursework.length > 0 && (
                        <div className="text-sm text-gray-700 mt-0.5">
                          <span className="font-semibold">Relevant Coursework:</span> {edu.coursework.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </section>
              )}

              {/* Work Experience */}
              {editedResume.experience && editedResume.experience.length > 0 && (
                <section className="mb-4">
                  <h2 className="text-sm font-bold text-gray-900 uppercase border-b border-gray-900 pb-1 mb-2">
                    Work Experience
                  </h2>
                  {editedResume.experience.map((exp, i) => (
                    <div key={i} className="mb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-bold text-sm">{exp.company}</span>
                          {exp.location && <span className="text-sm">, {exp.location}</span>}
                        </div>
                        <div className="text-sm text-right">
                          <span className="font-bold">{exp.title}</span>
                          <span> ({exp.start} – {exp.end})</span>
                        </div>
                      </div>
                      <ul className="list-disc list-outside ml-4 mt-1 space-y-0.5">
                        {exp.bullets.map((bullet, j) => (
                          <li key={j} className="text-sm text-gray-700">{bullet}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </section>
              )}

              {/* Projects */}
              {editedResume.projects && editedResume.projects.length > 0 && (
                <section className="mb-4">
                  <h2 className="text-sm font-bold text-gray-900 uppercase border-b border-gray-900 pb-1 mb-2">
                    Projects
                  </h2>
                  {editedResume.projects.map((project, i) => (
                    <div key={i} className="mb-3">
                      <div className="font-bold text-sm">
                        {project.name}
                        {project.date && <span className="font-normal"> ({project.date})</span>}
                      </div>
                      <ul className="list-disc list-outside ml-4 mt-1 space-y-0.5">
                        <li className="text-sm text-gray-700">
                          {project.description}
                          {project.achievement && `; ${project.achievement}`}
                        </li>
                        {project.technologies && project.technologies.length > 0 && (
                          <li className="text-sm text-gray-700">
                            Technologies: {project.technologies.join(', ')}
                          </li>
                        )}
                      </ul>
                    </div>
                  ))}
                </section>
              )}

              {/* Activities */}
              {editedResume.activities && editedResume.activities.length > 0 && (
                <section className="mb-4">
                  <h2 className="text-sm font-bold text-gray-900 uppercase border-b border-gray-900 pb-1 mb-2">
                    Activities
                  </h2>
                  {editedResume.activities.map((activity, i) => (
                    <div key={i} className="mb-3">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-sm">{activity.organization}</span>
                        <span className="font-bold text-sm">{activity.role}</span>
                      </div>
                      <ul className="list-disc list-outside ml-4 mt-1 space-y-0.5">
                        {activity.bullets.map((bullet, j) => (
                          <li key={j} className="text-sm text-gray-700">{bullet}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </section>
              )}

              {/* Additional */}
              {((editedResume.skills?.groups && editedResume.skills.groups.length > 0) ||
                (editedResume.languages && editedResume.languages.length > 0) ||
                (editedResume.certifications && editedResume.certifications.length > 0)) && (
                <section className="mb-4">
                  <h2 className="text-sm font-bold text-gray-900 uppercase border-b border-gray-900 pb-1 mb-2">
                    Additional
                  </h2>
                  <div className="space-y-1">
                    {editedResume.skills?.groups && editedResume.skills.groups.map((group, i) => (
                      <div key={i} className="text-sm">
                        <span className="font-semibold">{group.name}:</span>{' '}
                        <span className="text-gray-700">{group.items.join(', ')}</span>
                      </div>
                    ))}
                    {editedResume.languages && editedResume.languages.length > 0 && (
                      <div className="text-sm">
                        <span className="font-semibold">Languages:</span>{' '}
                        <span className="text-gray-700">
                          {editedResume.languages.map(l => `${l.name} (${l.proficiency})`).join(', ')}
                        </span>
                      </div>
                    )}
                    {editedResume.certifications && editedResume.certifications.length > 0 && (
                      <div className="text-sm">
                        <span className="font-semibold">Certifications:</span>{' '}
                        <span className="text-gray-700">
                          {editedResume.certifications.map(c => `${c.name}${c.issuer ? ` (${c.issuer})` : ''}`).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </section>
              )}
            </div>
          </div>
        )}

        {/* Analysis Tab */}
        {activeTab === 'analysis' && gapReport && (
          <div className="bg-white rounded-lg shadow p-8 space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">ATS Analysis</h2>

            {/* Coverage Score */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-700 font-medium">Keyword Coverage Score</span>
                <span className={`text-3xl font-bold ${
                  gapReport.coverageScore >= 80 ? 'text-green-600' :
                  gapReport.coverageScore >= 60 ? 'text-amber-600' : 'text-red-600'
                }`}>
                  {gapReport.coverageScore}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    gapReport.coverageScore >= 80 ? 'bg-green-500' :
                    gapReport.coverageScore >= 60 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${gapReport.coverageScore}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {gapReport.coverageScore >= 80 ? 'Excellent match! Your resume covers most job requirements.' :
                 gapReport.coverageScore >= 60 ? 'Good match. Consider addressing the missing keywords below.' :
                 'Needs improvement. Review the missing keywords and suggestions.'}
              </p>
            </div>

            {/* Keyword Changes */}
            {keywordDiff && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {keywordDiff.added.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-green-500"></span>
                      Keywords Added
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {keywordDiff.added.map((keyword, i) => (
                        <span key={i} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {keywordDiff.emphasized.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                      Keywords Emphasized
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {keywordDiff.emphasized.map((keyword, i) => (
                        <span key={i} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Skills Match */}
            {(gapReport.matchedSkills.length > 0 || gapReport.missingSkills.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {gapReport.matchedSkills.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Matched Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {gapReport.matchedSkills.map((skill, i) => (
                        <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {gapReport.missingSkills.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-red-500"></span>
                      Missing Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {gapReport.missingSkills.map((skill, i) => (
                        <span key={i} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Suggestions */}
            {gapReport.suggestions.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Suggestions for Improvement</h3>
                <ul className="space-y-2">
                  {gapReport.suggestions.map((suggestion, i) => (
                    <li key={i} className="flex items-start gap-3 text-gray-700">
                      <span className="text-amber-500 mt-0.5">💡</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analysis' && !gapReport && (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            <p>ATS analysis data not available for this resume.</p>
          </div>
        )}

        {/* Edit Tab */}
        {activeTab === 'edit' && editedResume && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Edit Resume Sections</h2>
            <p className="text-gray-600 text-sm mb-6">
              Make adjustments to your resume before exporting. These edits are temporary and will be used for the current export only.
            </p>
            <SectionEditor
              resume={editedResume}
              onChange={setEditedResume}
            />
          </div>
        )}
      </main>
    </div>
  );
}

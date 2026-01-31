'use client';

import { useState } from 'react';
import { ResumeJSON, Experience, Education, Project, Activity, SkillGroup } from '@/types/resume';

interface SectionEditorProps {
  resume: ResumeJSON;
  onChange: (updated: ResumeJSON) => void;
}

type ExpandedSection = 'header' | 'summary' | 'experience' | 'education' | 'projects' | 'activities' | 'skills' | null;

export default function SectionEditor({ resume, onChange }: SectionEditorProps) {
  const [expanded, setExpanded] = useState<ExpandedSection>(null);

  const toggleSection = (section: ExpandedSection) => {
    setExpanded(expanded === section ? null : section);
  };

  const updateHeader = (field: keyof typeof resume.header, value: string) => {
    onChange({
      ...resume,
      header: { ...resume.header, [field]: value },
    });
  };

  const updateSummary = (value: string) => {
    onChange({ ...resume, summary: value });
  };

  const updateExperience = (index: number, field: keyof Experience, value: string | string[]) => {
    const updated = [...resume.experience];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...resume, experience: updated });
  };

  const updateExperienceBullet = (expIndex: number, bulletIndex: number, value: string) => {
    const updated = [...resume.experience];
    const bullets = [...updated[expIndex].bullets];
    bullets[bulletIndex] = value;
    updated[expIndex] = { ...updated[expIndex], bullets };
    onChange({ ...resume, experience: updated });
  };

  const updateEducation = (index: number, field: keyof Education, value: string) => {
    const updated = [...resume.education];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...resume, education: updated });
  };

  const updateProject = (index: number, field: keyof Project, value: string) => {
    const updated = [...resume.projects];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...resume, projects: updated });
  };

  const updateActivity = (index: number, field: keyof Activity, value: string | string[]) => {
    const updated = [...resume.activities];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...resume, activities: updated });
  };

  const updateSkillGroup = (index: number, value: string) => {
    const updated = [...(resume.skills?.groups || [])];
    const items = value.split(',').map(s => s.trim()).filter(Boolean);
    updated[index] = { ...updated[index], items };
    onChange({ ...resume, skills: { groups: updated } });
  };

  const SectionHeader = ({
    title,
    section,
    count
  }: {
    title: string;
    section: ExpandedSection;
    count?: number;
  }) => (
    <button
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
    >
      <div className="flex items-center gap-2">
        <span className="font-semibold text-gray-900">{title}</span>
        {count !== undefined && (
          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
            {count}
          </span>
        )}
      </div>
      <svg
        className={`w-5 h-5 text-gray-500 transition-transform ${expanded === section ? 'rotate-180' : ''}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm";
  const textareaClass = "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none";
  const labelClass = "block text-xs font-medium text-gray-600 mb-1";

  return (
    <div className="space-y-3">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
        <p className="text-sm text-amber-800">
          <strong>Note:</strong> Edits here are temporary and only apply to this export.
          The original AI-tailored version is preserved in the database.
        </p>
      </div>

      {/* Header Section */}
      <div className="border rounded-lg overflow-hidden">
        <SectionHeader title="Contact Information" section="header" />
        {expanded === 'header' && (
          <div className="p-4 space-y-3 border-t">
            <div>
              <label className={labelClass}>Name</label>
              <input
                type="text"
                value={resume.header.name}
                onChange={(e) => updateHeader('name', e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Email</label>
                <input
                  type="email"
                  value={resume.header.email}
                  onChange={(e) => updateHeader('email', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Phone</label>
                <input
                  type="text"
                  value={resume.header.phone}
                  onChange={(e) => updateHeader('phone', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Location</label>
              <input
                type="text"
                value={resume.header.location}
                onChange={(e) => updateHeader('location', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        )}
      </div>

      {/* Summary Section */}
      {resume.summary !== undefined && (
        <div className="border rounded-lg overflow-hidden">
          <SectionHeader title="Summary" section="summary" />
          {expanded === 'summary' && (
            <div className="p-4 border-t">
              <textarea
                value={resume.summary || ''}
                onChange={(e) => updateSummary(e.target.value)}
                rows={4}
                className={textareaClass}
              />
            </div>
          )}
        </div>
      )}

      {/* Experience Section */}
      {resume.experience && resume.experience.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <SectionHeader title="Experience" section="experience" count={resume.experience.length} />
          {expanded === 'experience' && (
            <div className="p-4 space-y-6 border-t">
              {resume.experience.map((exp, i) => (
                <div key={i} className="p-4 bg-gray-50 rounded-lg space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Company</label>
                      <input
                        type="text"
                        value={exp.company}
                        onChange={(e) => updateExperience(i, 'company', e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Title</label>
                      <input
                        type="text"
                        value={exp.title}
                        onChange={(e) => updateExperience(i, 'title', e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className={labelClass}>Location</label>
                      <input
                        type="text"
                        value={exp.location || ''}
                        onChange={(e) => updateExperience(i, 'location', e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Start</label>
                      <input
                        type="text"
                        value={exp.start}
                        onChange={(e) => updateExperience(i, 'start', e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>End</label>
                      <input
                        type="text"
                        value={exp.end}
                        onChange={(e) => updateExperience(i, 'end', e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Bullet Points</label>
                    {exp.bullets.map((bullet, j) => (
                      <textarea
                        key={j}
                        value={bullet}
                        onChange={(e) => updateExperienceBullet(i, j, e.target.value)}
                        rows={2}
                        className={`${textareaClass} mb-2`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Education Section */}
      {resume.education && resume.education.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <SectionHeader title="Education" section="education" count={resume.education.length} />
          {expanded === 'education' && (
            <div className="p-4 space-y-6 border-t">
              {resume.education.map((edu, i) => (
                <div key={i} className="p-4 bg-gray-50 rounded-lg space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Institution</label>
                      <input
                        type="text"
                        value={edu.institution}
                        onChange={(e) => updateEducation(i, 'institution', e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Degree</label>
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) => updateEducation(i, 'degree', e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Field</label>
                      <input
                        type="text"
                        value={edu.field || ''}
                        onChange={(e) => updateEducation(i, 'field', e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>GPA</label>
                      <input
                        type="text"
                        value={edu.gpa || ''}
                        onChange={(e) => updateEducation(i, 'gpa', e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Projects Section */}
      {resume.projects && resume.projects.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <SectionHeader title="Projects" section="projects" count={resume.projects.length} />
          {expanded === 'projects' && (
            <div className="p-4 space-y-6 border-t">
              {resume.projects.map((proj, i) => (
                <div key={i} className="p-4 bg-gray-50 rounded-lg space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Name</label>
                      <input
                        type="text"
                        value={proj.name}
                        onChange={(e) => updateProject(i, 'name', e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Date</label>
                      <input
                        type="text"
                        value={proj.date || ''}
                        onChange={(e) => updateProject(i, 'date', e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Description</label>
                    <textarea
                      value={proj.description}
                      onChange={(e) => updateProject(i, 'description', e.target.value)}
                      rows={3}
                      className={textareaClass}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Activities Section */}
      {resume.activities && resume.activities.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <SectionHeader title="Activities" section="activities" count={resume.activities.length} />
          {expanded === 'activities' && (
            <div className="p-4 space-y-6 border-t">
              {resume.activities.map((act, i) => (
                <div key={i} className="p-4 bg-gray-50 rounded-lg space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Organization</label>
                      <input
                        type="text"
                        value={act.organization}
                        onChange={(e) => updateActivity(i, 'organization', e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Role</label>
                      <input
                        type="text"
                        value={act.role}
                        onChange={(e) => updateActivity(i, 'role', e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Skills Section */}
      {resume.skills?.groups && resume.skills.groups.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <SectionHeader title="Skills" section="skills" count={resume.skills.groups.length} />
          {expanded === 'skills' && (
            <div className="p-4 space-y-4 border-t">
              {resume.skills.groups.map((group, i) => (
                <div key={i}>
                  <label className={labelClass}>{group.name}</label>
                  <input
                    type="text"
                    value={group.items.join(', ')}
                    onChange={(e) => updateSkillGroup(i, e.target.value)}
                    className={inputClass}
                    placeholder="Comma-separated skills"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

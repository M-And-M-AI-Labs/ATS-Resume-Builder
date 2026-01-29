'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { UserProfile, Experience, Education, Project, Certification, SkillGroup, Activity, Language } from '@/types/profile';

// Empty profile template
const emptyProfile: UserProfile = {
  fullName: '',
  email: '',
  phone: '',
  location: '',
  linkedinUrl: '',
  githubUrl: '',
  portfolioUrl: '',
  otherLinks: [],
  summary: '',
  skills: [],
  experience: [],
  education: [],
  projects: [],
  activities: [],
  languages: [],
  certifications: [],
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  const loadProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch('/api/profile');
      const data = await response.json();

      if (response.ok && data.profile) {
        setProfile(data.profile);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save profile');
      }

      setSuccess('Profile saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/profile/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload file');
      }

      setProfile(data.profile);
      setSuccess('Resume uploaded and parsed successfully! Please review and edit your profile.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Helper functions to update profile sections
  const updateField = (field: keyof UserProfile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const addExperience = () => {
    const newExp: Experience = {
      id: `exp-${Date.now()}`,
      company: '',
      title: '',
      location: '',
      start: '',
      end: '',
      current: false,
      bullets: [''],
      technologies: [],
    };
    setProfile(prev => ({ ...prev, experience: [...prev.experience, newExp] }));
  };

  const updateExperience = (index: number, field: keyof Experience, value: any) => {
    setProfile(prev => ({
      ...prev,
      experience: prev.experience.map((exp, i) => 
        i === index ? { ...exp, [field]: value } : exp
      ),
    }));
  };

  const removeExperience = (index: number) => {
    setProfile(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index),
    }));
  };

  const addEducation = () => {
    const newEdu: Education = {
      id: `edu-${Date.now()}`,
      institution: '',
      degree: '',
      field: '',
      location: '',
      start: '',
      end: '',
      gpa: '',
      achievements: [],
    };
    setProfile(prev => ({ ...prev, education: [...prev.education, newEdu] }));
  };

  const updateEducation = (index: number, field: keyof Education, value: any) => {
    setProfile(prev => ({
      ...prev,
      education: prev.education.map((edu, i) => 
        i === index ? { ...edu, [field]: value } : edu
      ),
    }));
  };

  const removeEducation = (index: number) => {
    setProfile(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index),
    }));
  };

  const addSkillGroup = () => {
    const newGroup: SkillGroup = { name: '', items: [] };
    setProfile(prev => ({ ...prev, skills: [...prev.skills, newGroup] }));
  };

  const updateSkillGroup = (index: number, field: keyof SkillGroup, value: any) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.map((group, i) => 
        i === index ? { ...group, [field]: value } : group
      ),
    }));
  };

  const removeSkillGroup = (index: number) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index),
    }));
  };

  const addProject = () => {
    const newProj: Project = {
      id: `proj-${Date.now()}`,
      name: '',
      description: '',
      technologies: [],
      url: '',
    };
    setProfile(prev => ({ ...prev, projects: [...prev.projects, newProj] }));
  };

  const updateProject = (index: number, field: keyof Project, value: any) => {
    setProfile(prev => ({
      ...prev,
      projects: prev.projects.map((proj, i) => 
        i === index ? { ...proj, [field]: value } : proj
      ),
    }));
  };

  const removeProject = (index: number) => {
    setProfile(prev => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index),
    }));
  };

  const addCertification = () => {
    const newCert: Certification = {
      id: `cert-${Date.now()}`,
      name: '',
      issuer: '',
      date: '',
    };
    setProfile(prev => ({ ...prev, certifications: [...prev.certifications, newCert] }));
  };

  const updateCertification = (index: number, field: keyof Certification, value: any) => {
    setProfile(prev => ({
      ...prev,
      certifications: prev.certifications.map((cert, i) => 
        i === index ? { ...cert, [field]: value } : cert
      ),
    }));
  };

  const removeCertification = (index: number) => {
    setProfile(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index),
    }));
  };

  const addActivity = () => {
    const newActivity: Activity = {
      id: `act-${Date.now()}`,
      organization: '',
      role: '',
      start: '',
      end: '',
      bullets: [''],
    };
    setProfile(prev => ({ ...prev, activities: [...(prev.activities || []), newActivity] }));
  };

  const updateActivity = (index: number, field: keyof Activity, value: any) => {
    setProfile(prev => ({
      ...prev,
      activities: (prev.activities || []).map((act, i) =>
        i === index ? { ...act, [field]: value } : act
      ),
    }));
  };

  const removeActivity = (index: number) => {
    setProfile(prev => ({
      ...prev,
      activities: (prev.activities || []).filter((_, i) => i !== index),
    }));
  };

  const addLanguage = () => {
    const newLang: Language = {
      name: '',
      proficiency: 'Conversational',
    };
    setProfile(prev => ({ ...prev, languages: [...(prev.languages || []), newLang] }));
  };

  const updateLanguage = (index: number, field: keyof Language, value: any) => {
    setProfile(prev => ({
      ...prev,
      languages: (prev.languages || []).map((lang, i) =>
        i === index ? { ...lang, [field]: value } : lang
      ),
    }));
  };

  const removeLanguage = (index: number) => {
    setProfile(prev => ({
      ...prev,
      languages: (prev.languages || []).filter((_, i) => i !== index),
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-600">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/app')}
                className="text-slate-600 hover:text-slate-900 mr-4"
              >
                ← Back
              </button>
              <h1 className="text-xl font-semibold text-slate-900">My Profile</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Upload Resume</h2>
          <p className="text-slate-600 text-sm mb-4">
            Upload your existing resume (PDF or Word) to automatically fill your profile. You can edit the details afterwards.
          </p>
          <div className="flex items-center gap-4">
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
              id="resume-upload"
            />
            <label
              htmlFor="resume-upload"
              className={`px-4 py-2 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {uploading ? 'Uploading & Parsing...' : '📄 Choose File (PDF or DOCX)'}
            </label>
            {profile.uploadedFileName && (
              <span className="text-sm text-slate-500">
                Last uploaded: {profile.uploadedFileName}
              </span>
            )}
          </div>
        </div>

        {/* Personal Information */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={profile.fullName}
                onChange={(e) => updateField('fullName', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => updateField('email', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="john@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
              <input
                type="text"
                value={profile.location}
                onChange={(e) => updateField('location', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="San Francisco, CA"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">LinkedIn URL</label>
              <input
                type="url"
                value={profile.linkedinUrl || ''}
                onChange={(e) => updateField('linkedinUrl', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="https://linkedin.com/in/johndoe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">GitHub URL</label>
              <input
                type="url"
                value={profile.githubUrl || ''}
                onChange={(e) => updateField('githubUrl', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="https://github.com/johndoe"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Portfolio URL</label>
              <input
                type="url"
                value={profile.portfolioUrl || ''}
                onChange={(e) => updateField('portfolioUrl', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="https://johndoe.com"
              />
            </div>
          </div>
        </section>

        {/* Professional Summary */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Professional Summary</h2>
          <textarea
            value={profile.summary}
            onChange={(e) => updateField('summary', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="A brief summary of your professional background and career objectives..."
          />
        </section>

        {/* Skills */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Skills</h2>
            <button
              onClick={addSkillGroup}
              className="px-3 py-1.5 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
            >
              + Add Skill Group
            </button>
          </div>
          {profile.skills.length === 0 ? (
            <p className="text-slate-500 text-sm">No skills added yet. Click "Add Skill Group" to start.</p>
          ) : (
            <div className="space-y-4">
              {profile.skills.map((group, index) => (
                <div key={index} className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex gap-4 mb-2">
                    <input
                      type="text"
                      value={group.name}
                      onChange={(e) => updateSkillGroup(index, 'name', e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      placeholder="Category (e.g., Languages, Frameworks)"
                    />
                    <button
                      onClick={() => removeSkillGroup(index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                  <input
                    type="text"
                    value={group.items.join(', ')}
                    onChange={(e) => updateSkillGroup(index, 'items', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    placeholder="Skills (comma-separated, e.g., Python, JavaScript, React)"
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Experience */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Experience</h2>
            <button
              onClick={addExperience}
              className="px-3 py-1.5 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
            >
              + Add Experience
            </button>
          </div>
          {profile.experience.length === 0 ? (
            <p className="text-slate-500 text-sm">No experience added yet. Click "Add Experience" to start.</p>
          ) : (
            <div className="space-y-6">
              {profile.experience.map((exp, index) => (
                <div key={exp.id || index} className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex justify-between mb-3">
                    <span className="text-sm font-medium text-slate-600">Experience {index + 1}</span>
                    <button
                      onClick={() => removeExperience(index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <input
                      type="text"
                      value={exp.company}
                      onChange={(e) => updateExperience(index, 'company', e.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      placeholder="Company"
                    />
                    <input
                      type="text"
                      value={exp.title}
                      onChange={(e) => updateExperience(index, 'title', e.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      placeholder="Job Title"
                    />
                    <input
                      type="text"
                      value={exp.location}
                      onChange={(e) => updateExperience(index, 'location', e.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      placeholder="Location"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={exp.start}
                        onChange={(e) => updateExperience(index, 'start', e.target.value)}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        placeholder="Start (YYYY-MM)"
                      />
                      <input
                        type="text"
                        value={exp.current ? 'Present' : exp.end}
                        onChange={(e) => {
                          if (e.target.value.toLowerCase() === 'present') {
                            updateExperience(index, 'current', true);
                            updateExperience(index, 'end', '');
                          } else {
                            updateExperience(index, 'current', false);
                            updateExperience(index, 'end', e.target.value);
                          }
                        }}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        placeholder="End (YYYY-MM or Present)"
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="block text-sm text-slate-600 mb-1">Bullet Points (one per line)</label>
                    <textarea
                      value={exp.bullets.join('\n')}
                      onChange={(e) => updateExperience(index, 'bullets', e.target.value.split('\n').filter(Boolean))}
                      rows={4}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      placeholder="• Achieved X by doing Y resulting in Z&#10;• Led team of N engineers..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Technologies (comma-separated)</label>
                    <input
                      type="text"
                      value={exp.technologies.join(', ')}
                      onChange={(e) => updateExperience(index, 'technologies', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      placeholder="React, Node.js, PostgreSQL"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Education */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Education</h2>
            <button
              onClick={addEducation}
              className="px-3 py-1.5 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
            >
              + Add Education
            </button>
          </div>
          {profile.education.length === 0 ? (
            <p className="text-slate-500 text-sm">No education added yet. Click "Add Education" to start.</p>
          ) : (
            <div className="space-y-4">
              {profile.education.map((edu, index) => (
                <div key={edu.id || index} className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex justify-between mb-3">
                    <span className="text-sm font-medium text-slate-600">Education {index + 1}</span>
                    <button
                      onClick={() => removeEducation(index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={edu.institution}
                      onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      placeholder="Institution"
                    />
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      placeholder="Degree (e.g., Bachelor of Science)"
                    />
                    <input
                      type="text"
                      value={edu.field}
                      onChange={(e) => updateEducation(index, 'field', e.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      placeholder="Field of Study"
                    />
                    <input
                      type="text"
                      value={edu.gpa || ''}
                      onChange={(e) => updateEducation(index, 'gpa', e.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      placeholder="GPA (optional)"
                    />
                    <input
                      type="text"
                      value={edu.start || ''}
                      onChange={(e) => updateEducation(index, 'start', e.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      placeholder="Start Year"
                    />
                    <input
                      type="text"
                      value={edu.end || ''}
                      onChange={(e) => updateEducation(index, 'end', e.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      placeholder="End Year"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Projects */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Projects</h2>
            <button
              onClick={addProject}
              className="px-3 py-1.5 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
            >
              + Add Project
            </button>
          </div>
          {profile.projects.length === 0 ? (
            <p className="text-slate-500 text-sm">No projects added yet. Click "Add Project" to start.</p>
          ) : (
            <div className="space-y-4">
              {profile.projects.map((proj, index) => (
                <div key={proj.id || index} className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex justify-between mb-3">
                    <span className="text-sm font-medium text-slate-600">Project {index + 1}</span>
                    <button
                      onClick={() => removeProject(index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <input
                      type="text"
                      value={proj.name}
                      onChange={(e) => updateProject(index, 'name', e.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      placeholder="Project Name"
                    />
                    <input
                      type="url"
                      value={proj.url || ''}
                      onChange={(e) => updateProject(index, 'url', e.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      placeholder="Project URL (optional)"
                    />
                  </div>
                  <textarea
                    value={proj.description}
                    onChange={(e) => updateProject(index, 'description', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm mb-3"
                    placeholder="Project description..."
                  />
                  <input
                    type="text"
                    value={proj.technologies.join(', ')}
                    onChange={(e) => updateProject(index, 'technologies', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    placeholder="Technologies (comma-separated)"
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Activities */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Activities</h2>
            <button
              onClick={addActivity}
              className="px-3 py-1.5 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
            >
              + Add Activity
            </button>
          </div>
          {(!profile.activities || profile.activities.length === 0) ? (
            <p className="text-slate-500 text-sm">No activities added yet. Click &quot;Add Activity&quot; to start.</p>
          ) : (
            <div className="space-y-4">
              {profile.activities.map((activity, index) => (
                <div key={activity.id || index} className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex justify-between mb-3">
                    <span className="text-sm font-medium text-slate-600">Activity {index + 1}</span>
                    <button
                      onClick={() => removeActivity(index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <input
                      type="text"
                      value={activity.organization}
                      onChange={(e) => updateActivity(index, 'organization', e.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      placeholder="Organization"
                    />
                    <input
                      type="text"
                      value={activity.role}
                      onChange={(e) => updateActivity(index, 'role', e.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      placeholder="Role"
                    />
                    <input
                      type="text"
                      value={activity.start || ''}
                      onChange={(e) => updateActivity(index, 'start', e.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      placeholder="Start (e.g., Sep 2017)"
                    />
                    <input
                      type="text"
                      value={activity.end || ''}
                      onChange={(e) => updateActivity(index, 'end', e.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      placeholder="End (e.g., Present)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Bullet Points (one per line)</label>
                    <textarea
                      value={activity.bullets.join('\n')}
                      onChange={(e) => updateActivity(index, 'bullets', e.target.value.split('\n').filter(Boolean))}
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      placeholder="• Founded Business Series for 500 students&#10;• Organized weekly events..."
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Languages */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Languages</h2>
            <button
              onClick={addLanguage}
              className="px-3 py-1.5 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
            >
              + Add Language
            </button>
          </div>
          {(!profile.languages || profile.languages.length === 0) ? (
            <p className="text-slate-500 text-sm">No languages added yet. Click &quot;Add Language&quot; to start.</p>
          ) : (
            <div className="space-y-4">
              {profile.languages.map((lang, index) => (
                <div key={index} className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex justify-between mb-3">
                    <span className="text-sm font-medium text-slate-600">Language {index + 1}</span>
                    <button
                      onClick={() => removeLanguage(index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={lang.name}
                      onChange={(e) => updateLanguage(index, 'name', e.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      placeholder="Language (e.g., French)"
                    />
                    <select
                      value={lang.proficiency}
                      onChange={(e) => updateLanguage(index, 'proficiency', e.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    >
                      <option value="Native">Native</option>
                      <option value="Fluent">Fluent</option>
                      <option value="Conversational">Conversational</option>
                      <option value="Basic">Basic</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Certifications */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Certifications</h2>
            <button
              onClick={addCertification}
              className="px-3 py-1.5 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
            >
              + Add Certification
            </button>
          </div>
          {profile.certifications.length === 0 ? (
            <p className="text-slate-500 text-sm">No certifications added yet. Click "Add Certification" to start.</p>
          ) : (
            <div className="space-y-4">
              {profile.certifications.map((cert, index) => (
                <div key={cert.id || index} className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex justify-between mb-3">
                    <span className="text-sm font-medium text-slate-600">Certification {index + 1}</span>
                    <button
                      onClick={() => removeCertification(index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={cert.name}
                      onChange={(e) => updateCertification(index, 'name', e.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      placeholder="Certification Name"
                    />
                    <input
                      type="text"
                      value={cert.issuer}
                      onChange={(e) => updateCertification(index, 'issuer', e.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      placeholder="Issuing Organization"
                    />
                    <input
                      type="text"
                      value={cert.date || ''}
                      onChange={(e) => updateCertification(index, 'date', e.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      placeholder="Date Issued"
                    />
                    <input
                      type="url"
                      value={cert.url || ''}
                      onChange={(e) => updateCertification(index, 'url', e.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      placeholder="Credential URL (optional)"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Save Button at Bottom */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </main>
    </div>
  );
}


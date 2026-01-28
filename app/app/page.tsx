'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface UserData {
  plan: string;
  resumes_generated_this_period: number;
  max_resumes_per_period: number;
}

interface ProfileData {
  fullName: string;
  email: string;
  experience: any[];
  education: any[];
  skills: any[];
}

export default function AppPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [jobUrl, setJobUrl] = useState('');
  const [jdText, setJdText] = useState('');
  const [useText, setUseText] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const loadData = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      router.push('/login');
      return;
    }

    // Load user data
    const { data: userDataRow } = await supabase
      .from('users')
      .select('plan, resumes_generated_this_period, max_resumes_per_period')
      .eq('id', authUser.id)
      .single();

    if (userDataRow) {
      setUserData(userDataRow);
    }

    // Load profile
    try {
      const profileResponse = await fetch('/api/profile');
      const profileData = await profileResponse.json();
      
      if (profileData.exists && profileData.profile) {
        setProfile(profileData.profile);
        setHasProfile(true);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    }

    setPageLoading(false);
  }, [supabase, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTailorResume = async () => {
    if (!hasProfile) {
      setError('Please create your profile first');
      return;
    }

    if (!jobUrl.trim() && !jdText.trim()) {
      setError('Please enter a job URL or paste the job description');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let jobId: string;

      if (useText && jdText.trim()) {
        // Use pasted JD text - create job directly
        const jobResponse = await fetch('/api/job/from-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jdText }),
        });

        const jobData = await jobResponse.json();

        if (!jobResponse.ok) {
          throw new Error(jobData.error || 'Failed to process job description');
        }

        jobId = jobData.id;
      } else {
        // Extract from URL
        const jobResponse = await fetch('/api/job/from-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobUrl }),
        });

        const jobData = await jobResponse.json();

        if (!jobResponse.ok) {
          throw new Error(jobData.error || 'Failed to extract job');
        }

        jobId = jobData.id;
      }

      // Tailor resume using profile
      const tailorResponse = await fetch('/api/resume/tailor-from-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });

      const tailorData = await tailorResponse.json();

      if (!tailorResponse.ok) {
        throw new Error(tailorData.error || 'Failed to tailor resume');
      }

      router.push(`/app/resume/${tailorData.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to tailor resume');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-slate-900">ATS Resume Builder</h1>
            </div>
            <div className="flex items-center space-x-4">
              {userData && (
                <div className="text-sm text-slate-600">
                  {userData.resumes_generated_this_period} / {userData.max_resumes_per_period} resumes
                  <span className="ml-2 px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs font-medium">
                    {userData.plan}
                  </span>
                </div>
              )}
              <button
                onClick={handleSignOut}
                className="text-slate-600 hover:text-slate-900 text-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Profile Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Your Profile</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Your profile is used to generate tailored resumes for each job application.
                </p>
              </div>
              <button
                onClick={() => router.push('/app/profile')}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm"
              >
                {hasProfile ? 'Edit Profile' : 'Create Profile'}
              </button>
            </div>

            {hasProfile && profile ? (
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Name</span>
                    <p className="font-medium text-slate-900">{profile.fullName || 'Not set'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Experience</span>
                    <p className="font-medium text-slate-900">{profile.experience?.length || 0} positions</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Education</span>
                    <p className="font-medium text-slate-900">{profile.education?.length || 0} entries</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Skill Groups</span>
                    <p className="font-medium text-slate-900">{profile.skills?.length || 0} groups</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-amber-800 text-sm">
                  <strong>No profile yet.</strong> Create your profile to start tailoring resumes. 
                  You can upload your existing resume or fill in the details manually.
                </p>
              </div>
            )}
          </div>

          {/* Job Input Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Job Posting</h2>
            
            {/* Toggle between URL and Text */}
            <div className="flex space-x-4 mb-4">
              <button
                onClick={() => setUseText(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !useText 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Paste URL
              </button>
              <button
                onClick={() => setUseText(true)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  useText 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Paste Job Description
              </button>
            </div>

            {!useText ? (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Job Posting URL
                </label>
                <input
                  type="url"
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  placeholder="https://linkedin.com/jobs/view/..."
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="text-sm text-slate-500 mt-2">
                  Paste the URL of the job posting (LinkedIn, Indeed, company website, etc.)
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Job Description Text
                </label>
                <textarea
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  placeholder="Paste the full job description here..."
                  rows={8}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="text-sm text-slate-500 mt-2">
                  Paste the complete job description including requirements and responsibilities.
                </p>
              </div>
            )}

            <button
              onClick={handleTailorResume}
              disabled={loading || !hasProfile}
              className="mt-6 w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg"
            >
              {loading ? 'Generating Tailored Resume...' : 'Generate Tailored Resume'}
            </button>

            {!hasProfile && (
              <p className="text-sm text-amber-600 mt-2 text-center">
                Please create your profile first before generating a resume.
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* How It Works */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-indigo-600 font-bold text-lg">1</span>
                </div>
                <h3 className="font-medium text-slate-900 mb-1">Create Profile</h3>
                <p className="text-sm text-slate-600">
                  Upload your resume or fill in your experience, education, and skills.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-indigo-600 font-bold text-lg">2</span>
                </div>
                <h3 className="font-medium text-slate-900 mb-1">Add Job Posting</h3>
                <p className="text-sm text-slate-600">
                  Paste the job URL or description you want to apply for.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-indigo-600 font-bold text-lg">3</span>
                </div>
                <h3 className="font-medium text-slate-900 mb-1">Get ATS Resume</h3>
                <p className="text-sm text-slate-600">
                  AI tailors your resume to match job requirements. Export as DOCX.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

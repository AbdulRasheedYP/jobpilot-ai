import React, { useState } from 'react';
import {
  UserCheck,
  Upload,
  RefreshCw,
  Save,
  ShieldCheck,
  FileCheck,
  Zap,
  Briefcase,
  GraduationCap,
  Sparkles,
  X,
  Search,
  Plus,
  Trash2,
} from 'lucide-react';
export default function ProfileTab({
  metaOptions,
  profileForm,
  setProfileForm,
  resumes,
  selectedResume,
  setSelectedResume,
  fileInputRef,
  uploadingResume,
  handleUploadCV,
  handleSaveProfile,
  savingProfile,
  handleAddSkill,
  handleRemoveSkill,
  handleSelectSkillOption,
  newSkillInput,
  setNewSkillInput,
  handleAddExperience,
  handleRemoveExperience,
  newExp,
  setNewExp,
  handleAddEducation,
  handleRemoveEducation,
  newEdu,
  setNewEdu,
}) {
  const [profileSection, setProfileSection] = useState('cv_sync');
  const [showAddExp, setShowAddExp] = useState(false);
  const [showAddEdu, setShowAddEdu] = useState(false);

  return (
    <div className="space-y-6">
      {/* Top Header & Fast Save Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-600" />
            <span>Candidate Profile & Decision Center</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Auto-filled from your CV. Use the side menu below to review and configure roles, locations, skills, and experience.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleUploadCV}
            accept=".pdf,.docx,.txt"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingResume}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border border-slate-200"
          >
            <Upload className="w-3.5 h-3.5 text-slate-600" />
            <span>{uploadingResume ? 'Parsing CV...' : 'Import / Replace CV'}</span>
          </button>

          <button
            onClick={handleSaveProfile}
            disabled={savingProfile}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            {savingProfile ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{savingProfile ? 'Saving & Re-scoring...' : 'Save Profile & Re-score Jobs'}</span>
          </button>
        </div>
      </div>

      {/* Sync & Zero-Hallucination Status Banner */}
      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="text-xs text-emerald-900">
            <span className="font-bold">Active CV Source: </span>
            {selectedResume ? (
              <span>
                <strong className="text-slate-900">{selectedResume.file_name}</strong> (Auto-populated into profile draft)
              </span>
            ) : (
              <span className="text-amber-800">No CV file uploaded yet. Form is in manual entry mode.</span>
            )}
          </div>
        </div>
        <span className="text-[11px] font-semibold text-emerald-700 bg-white/70 px-2.5 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
          Zero-Hallucination Active
        </span>
      </div>

      {/* Main Side Menu Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Side Sub-Navigation Menu */}
        <div className="md:col-span-4 lg:col-span-3 space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-sm space-y-1">
            {[
              { id: 'cv_sync', label: 'CV File & Sync', icon: FileCheck, badge: selectedResume ? 'Active' : 'Empty' },
              { id: 'personal', label: 'Personal Details', icon: UserCheck, badge: profileForm.full_name ? 'Filled' : 'Required' },
              { id: 'skills', label: 'Technical Skills', icon: Zap, badge: `${profileForm.skills.length}` },
              { id: 'experience', label: 'Work Experience', icon: Briefcase, badge: `${profileForm.experience.length}` },
              { id: 'education', label: 'Education Credentials', icon: GraduationCap, badge: `${profileForm.education.length}` },
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = profileSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setProfileSection(item.id)}
                  className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200 shadow-2xs font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        isSelected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Left Sidebar Info Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>How it works</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500">
              Your confirmed skills, roles, and locations directly drive the 5-factor scoring engine. Save your changes to immediately re-rank all jobs.
            </p>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="md:col-span-8 lg:col-span-9 space-y-6">
          {/* SUB-SECTION 1: CV File & Sync */}
          {profileSection === 'cv_sync' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-emerald-600" />
                  <span>CV Document & Auto-Sync Center</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Upload your CV (PDF or DOCX). Facts are extracted without hallucination and auto-filled into your profile draft.
                </p>
              </div>

              {/* Active Upload Card */}
              <div className="p-5 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-all text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-800">
                    {selectedResume ? `Active CV: ${selectedResume.file_name}` : 'Upload Your Candidate CV'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Supports PDF, DOCX, and TXT files up to 10MB.
                  </p>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingResume}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl inline-flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20"
                >
                  <Upload className="w-4 h-4" />
                  <span>{uploadingResume ? 'Parsing Document...' : selectedResume ? 'Upload Replacement CV' : 'Select CV File'}</span>
                </button>
              </div>

              {/* Resumes History Table */}
              {resumes.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Uploaded Documents ({resumes.length})</h4>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {resumes.map((r) => (
                      <div key={r.id} className="p-3.5 bg-white hover:bg-slate-50 flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-800 flex items-center gap-2">
                            <span>{r.file_name}</span>
                            {selectedResume?.id === r.id && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                                Active Source
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400">
                            Uploaded on {r.created_at ? new Date(r.created_at).toLocaleDateString() : 'Recent'} • {r.file_size ? `${Math.round(r.file_size / 1024)} KB` : 'PDF'}
                          </span>
                        </div>
                        <button
                          onClick={() => setSelectedResume(r)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border ${
                            selectedResume?.id === r.id
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {selectedResume?.id === r.id ? 'Selected' : 'Use as Active'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SUB-SECTION 2: Personal Details */}
          {profileSection === 'personal' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-emerald-600" />
                  <span>Personal & Contact Information</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Contact details auto-extracted from your CV. Fill any missing fields or edit them as needed.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Full Name</label>
                  <input
                    type="text"
                    value={profileForm.full_name}
                    onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                    placeholder="e.g. Arjun Nair"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Email Address</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    placeholder="e.g. candidate@example.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="e.g. +91 9876543210"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Current Base Location</label>
                  <input
                    type="text"
                    value={profileForm.current_location}
                    onChange={(e) => setProfileForm({ ...profileForm, current_location: e.target.value })}
                    placeholder="e.g. Kochi, Kerala, India"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Notice Period (Days)</label>
                  <input
                    type="number"
                    min="0"
                    value={profileForm.notice_period_days}
                    onChange={(e) => setProfileForm({ ...profileForm, notice_period_days: e.target.value })}
                    placeholder="0 (Immediate)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white text-xs"
                  />
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="sponsorshipReq"
                    checked={profileForm.sponsorship_required}
                    onChange={(e) => setProfileForm({ ...profileForm, sponsorship_required: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="sponsorshipReq" className="text-xs text-slate-700 font-medium cursor-pointer">
                    Visa Sponsorship Required
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* SUB-SECTION 3: Technical Skills */}
          {profileSection === 'skills' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-emerald-600" />
                    <span>Confirmed Technical Skills ({profileForm.skills.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Skills account for 35% of the match scoring weight.
                  </p>
                </div>
              </div>

              {/* Skills Tag Cloud */}
              <div className="flex flex-wrap gap-2 min-h-[50px] p-3 bg-slate-50 rounded-xl border border-slate-200">
                {profileForm.skills.length > 0 ? (
                  profileForm.skills.map((skill) => (
                    <span
                      key={skill}
                      className="bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5 shadow-2xs"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="text-emerald-500 hover:text-rose-600 cursor-pointer"
                        title="Remove skill"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400 text-xs italic">
                    No skills listed yet. Add skills below or upload your CV to auto-extract.
                  </span>
                )}
              </div>

              {/* Add Skill Form with Keyword Search */}
              <form onSubmit={handleAddSkill} className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    placeholder="Type keyword to filter IT skills (e.g. FastAPI, Docker, React, PostgreSQL)..."
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1 cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Skill</span>
                </button>
              </form>

              {/* IT Skills Master Dynamic Suggestion Pills */}
              <div className="pt-1 space-y-1.5">
                <span className="text-[11px] text-slate-500 font-semibold block">
                  {newSkillInput.trim() ? `Matching Skills for "${newSkillInput}":` : 'Popular IT Skills (Click to add):'}
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
                  {(metaOptions?.skills || [])
                    .filter((skill) => {
                      const matchSearch = newSkillInput.trim()
                        ? skill.toLowerCase().includes(newSkillInput.toLowerCase().trim())
                        : true;
                      const notAdded = !profileForm.skills.some((s) => s.toLowerCase() === skill.toLowerCase());
                      return matchSearch && notAdded;
                    })
                    .slice(0, newSkillInput.trim() ? 20 : 12)
                    .map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => handleSelectSkillOption(skill)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 text-slate-700 text-[11px] font-medium rounded-lg border border-slate-200 transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3 text-slate-400" />
                        <span>{skill}</span>
                      </button>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* SUB-SECTION 4: Work Experience */}
          {profileSection === 'experience' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-emerald-600" />
                    <span>Work Experience ({profileForm.experience.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Experience fit contributes 20% to matching scores.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddExp(!showAddExp)}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showAddExp ? 'Cancel' : 'Add Experience'}</span>
                </button>
              </div>

              {/* Add Experience Inline Form */}
              {showAddExp && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
                  <h4 className="font-bold text-slate-800">Add New Experience</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Company name"
                      value={newExp.company}
                      onChange={(e) => setNewExp({ ...newExp, company: e.target.value })}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900"
                    />
                    <input
                      type="text"
                      placeholder="Role title"
                      value={newExp.title}
                      onChange={(e) => setNewExp({ ...newExp, title: e.target.value })}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900"
                    />
                    <input
                      type="text"
                      placeholder="Start Date (e.g. 2023-01)"
                      value={newExp.start_date}
                      onChange={(e) => setNewExp({ ...newExp, start_date: e.target.value })}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900"
                    />
                    <input
                      type="text"
                      placeholder="End Date (e.g. Present)"
                      value={newExp.end_date}
                      onChange={(e) => setNewExp({ ...newExp, end_date: e.target.value })}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900"
                    />
                  </div>
                  <textarea
                    placeholder="Key responsibilities and technical accomplishments..."
                    value={newExp.description}
                    onChange={(e) => setNewExp({ ...newExp, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900"
                  />
                  <button
                    onClick={handleAddExperience}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs cursor-pointer"
                  >
                    Save Experience
                  </button>
                </div>
              )}

              {/* Experience List */}
              <div className="space-y-3">
                {profileForm.experience.length > 0 ? (
                  profileForm.experience.map((exp, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{exp.title || 'Role'}</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-emerald-700 font-semibold">{exp.company || 'Company'}</span>
                        </div>
                        <span className="text-slate-400 text-[11px] block">
                          {exp.start_date || 'Past'} – {exp.end_date || 'Present'}
                        </span>
                        {exp.description && (
                          <p className="text-slate-600 text-[11px] mt-1 line-clamp-2">{exp.description}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveExperience(idx)}
                        className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-md cursor-pointer transition-colors"
                        title="Remove role"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                    No experience recorded. Click "Add Experience" above or upload a CV.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SUB-SECTION 5: Education Credentials */}
          {profileSection === 'education' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-emerald-600" />
                    <span>Education Credentials ({profileForm.education.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Education credentials contribute 10% to matching scores.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddEdu(!showAddEdu)}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showAddEdu ? 'Cancel' : 'Add Education'}</span>
                </button>
              </div>

              {/* Add Education Inline Form */}
              {showAddEdu && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
                  <h4 className="font-bold text-slate-800">Add New Credential</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Institution / University"
                      value={newEdu.institution}
                      onChange={(e) => setNewEdu({ ...newEdu, institution: e.target.value })}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900"
                    />
                    <input
                      type="text"
                      placeholder="Degree (e.g. B.Tech CS)"
                      value={newEdu.degree}
                      onChange={(e) => setNewEdu({ ...newEdu, degree: e.target.value })}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900"
                    />
                    <input
                      type="number"
                      placeholder="Graduation Year (e.g. 2024)"
                      value={newEdu.graduation_year}
                      onChange={(e) => setNewEdu({ ...newEdu, graduation_year: e.target.value })}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900"
                    />
                  </div>
                  <button
                    onClick={handleAddEducation}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs cursor-pointer"
                  >
                    Save Education
                  </button>
                </div>
              )}

              {/* Education List */}
              <div className="space-y-3">
                {profileForm.education.length > 0 ? (
                  profileForm.education.map((edu, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-900 text-sm block">{edu.degree || 'Degree'}</span>
                        <span className="text-slate-600">{edu.institution || 'University'}</span>
                        {edu.graduation_year && (
                          <span className="text-slate-400 text-[11px] block">Graduation: {edu.graduation_year}</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveEducation(idx)}
                        className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-md cursor-pointer transition-colors"
                        title="Remove education"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                    No education recorded. Click "Add Education" above or upload a CV.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bottom Global Save Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Changes apply immediately to your candidate profile and job match scoring.
            </span>
            <button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              {savingProfile ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{savingProfile ? 'Saving & Re-scoring...' : 'Save Profile & Re-score Jobs'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

"""initial schema

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-11-17 14:48:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '0001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Enums
    application_status = postgresql.ENUM(
        'NOT_STARTED', 'PREPARING', 'NEEDS_USER_INPUT', 'READY',
        'AUTO_APPLY_QUEUED', 'SUBMITTING', 'APPLIED_CONFIRMED',
        'SUBMISSION_UNCONFIRMED', 'MANUAL_ACTION_REQUIRED',
        'FAILED_RETRYABLE', 'FAILED_FINAL', 'WITHDRAWN',
        name='application_status', create_type=False
    )
    application_status.create(op.get_bind(), checkfirst=True)

    agent_run_status = postgresql.ENUM(
        'RUNNING', 'PAUSED', 'STOPPED', 'COMPLETED', 'FAILED',
        name='agent_run_status', create_type=False
    )
    agent_run_status.create(op.get_bind(), checkfirst=True)

    # 2. user_profiles
    op.create_table(
        'user_profiles',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('full_name', sa.String(255), nullable=False),
        sa.Column('email', sa.String(255), nullable=False, unique=True),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('phone', sa.String(50), nullable=True),
        sa.Column('current_location', sa.String(255), nullable=True),
        sa.Column('preferred_locations', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('education', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('skills', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('experience', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('languages', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('work_authorization', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('sponsorship_required', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('notice_period_days', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
    )
    op.create_index('ix_user_profiles_email', 'user_profiles', ['email'], unique=True)

    # 3. job_preferences
    op.create_table(
        'job_preferences',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_profile_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('user_profiles.id', ondelete='CASCADE'), unique=True, nullable=False),
        sa.Column('target_roles', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('target_countries', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('work_modes', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('experience_levels', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('min_salary', sa.Integer(), nullable=True),
        sa.Column('max_salary', sa.Integer(), nullable=True),
        sa.Column('currency', sa.String(10), nullable=False, server_default='INR'),
        sa.Column('min_match_score', sa.Integer(), nullable=False, server_default='65'),
        sa.Column('auto_apply_enabled', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('daily_application_limit', sa.Integer(), nullable=False, server_default='5'),
        sa.Column('weekly_application_limit', sa.Integer(), nullable=False, server_default='25'),
        sa.Column('excluded_companies', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
    )

    # 4. job_sources
    op.create_table(
        'job_sources',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('code', sa.String(50), unique=True, nullable=False),
        sa.Column('adapter_class', sa.String(100), nullable=False),
        sa.Column('is_enabled', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('permits_auto_apply', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('rate_limit_per_minute', sa.Integer(), nullable=False, server_default='30'),
        sa.Column('config', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
    )
    op.create_index('ix_job_sources_code', 'job_sources', ['code'], unique=True)

    # 5. companies
    op.create_table(
        'companies',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(255), unique=True, nullable=False),
        sa.Column('domain', sa.String(255), nullable=True),
        sa.Column('logo_url', sa.String(512), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
    )
    op.create_index('ix_companies_name', 'companies', ['name'], unique=True)

    # 6. jobs
    op.create_table(
        'jobs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('source_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('job_sources.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('external_id', sa.String(255), nullable=False),
        sa.Column('company_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('companies.id', ondelete='SET NULL'), nullable=True),
        sa.Column('company_name', sa.String(255), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('raw_payload', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('location', sa.String(255), nullable=False),
        sa.Column('is_remote', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('employment_type', sa.String(50), nullable=True),
        sa.Column('experience_level', sa.String(50), nullable=True),
        sa.Column('salary_min', sa.Integer(), nullable=True),
        sa.Column('salary_max', sa.Integer(), nullable=True),
        sa.Column('currency', sa.String(10), nullable=True),
        sa.Column('skills_required', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('application_url', sa.Text(), nullable=False),
        sa.Column('canonical_url', sa.Text(), nullable=False),
        sa.Column('posted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.UniqueConstraint('source_id', 'external_id', name='uq_jobs_source_external'),
        sa.UniqueConstraint('canonical_url', name='uq_jobs_canonical_url')
    )
    op.create_index('idx_jobs_search', 'jobs', ['title', 'location', 'is_remote', 'is_active'])

    # 7. resumes
    op.create_table(
        'resumes',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_profile_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('user_profiles.id', ondelete='CASCADE'), nullable=False),
        sa.Column('file_path', sa.String(512), nullable=False),
        sa.Column('file_name', sa.String(255), nullable=False),
        sa.Column('file_type', sa.String(50), nullable=False),
        sa.Column('is_original', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('target_job_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('jobs.id', ondelete='SET NULL'), nullable=True),
        sa.Column('parsed_facts', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('version', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
    )

    # 8. job_matches
    op.create_table(
        'job_matches',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('job_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('jobs.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_profile_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('user_profiles.id', ondelete='CASCADE'), nullable=False),
        sa.Column('eligibility_passed', sa.Boolean(), nullable=False),
        sa.Column('eligibility_details', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('overall_score', sa.Float(), nullable=False),
        sa.Column('score_breakdown', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('matched_skills', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('missing_skills', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('decision_reasons', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.UniqueConstraint('job_id', 'user_profile_id', name='uq_matches_job_user')
    )
    op.create_index('idx_matches_score', 'job_matches', ['overall_score'])

    # 9. applications
    op.create_table(
        'applications',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('job_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('jobs.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('user_profile_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('user_profiles.id', ondelete='CASCADE'), nullable=False),
        sa.Column('tailored_resume_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('resumes.id', ondelete='SET NULL'), nullable=True),
        sa.Column('status', application_status, nullable=False, server_default='NOT_STARTED'),
        sa.Column('submission_method', sa.String(50), nullable=True),
        sa.Column('submitted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('confirmation_evidence', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.UniqueConstraint('job_id', 'user_profile_id', name='uq_applications_job_user')
    )
    op.create_index('idx_applications_status', 'applications', ['status'])

    # 10. application_answers
    op.create_table(
        'application_answers',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('application_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('applications.id', ondelete='CASCADE'), nullable=False),
        sa.Column('question', sa.Text(), nullable=False),
        sa.Column('answer', sa.Text(), nullable=False),
        sa.Column('field_type', sa.String(50), nullable=False, server_default='text'),
        sa.Column('source_profile_field', sa.String(100), nullable=True),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
    )

    # 11. agent_runs
    op.create_table(
        'agent_runs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_profile_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('user_profiles.id', ondelete='CASCADE'), nullable=False),
        sa.Column('status', agent_run_status, nullable=False, server_default='RUNNING'),
        sa.Column('jobs_discovered', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('jobs_matched', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('applications_prepared', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('applications_submitted', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('error_summary', sa.Text(), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('finished_at', sa.DateTime(timezone=True), nullable=True),
    )

    # 12. agent_events
    op.create_table(
        'agent_events',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('agent_run_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('agent_runs.id', ondelete='CASCADE'), nullable=False),
        sa.Column('stage', sa.String(50), nullable=False),
        sa.Column('event_type', sa.String(100), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('payload', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
    )
    # 13. master_lookups
    op.create_table(
        'master_lookups',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('category', sa.String(50), nullable=False),
        sa.Column('value', sa.String(100), nullable=False),
        sa.Column('label', sa.String(150), nullable=True),
        sa.Column('sort_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('metadata_json', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
    )
    op.create_index('ix_master_lookups_category', 'master_lookups', ['category'])
    op.create_index('ix_master_lookups_value', 'master_lookups', ['value'])


def downgrade() -> None:
    op.drop_table('master_lookups')
    op.drop_table('agent_events')
    op.drop_table('agent_runs')
    op.drop_table('application_answers')
    op.drop_table('applications')
    op.drop_table('job_matches')
    op.drop_table('resumes')
    op.drop_table('jobs')
    op.drop_table('companies')
    op.drop_table('job_sources')
    op.drop_table('job_preferences')
    op.drop_table('user_profiles')

    op.execute('DROP TYPE IF EXISTS agent_run_status')
    op.execute('DROP TYPE IF EXISTS application_status')

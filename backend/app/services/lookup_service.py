import uuid
import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.app.models.lookup import MasterLookup

logger = logging.getLogger(__name__)

DEFAULT_ROLES = [
    'Python Developer',
    'Backend Developer',
    'Full Stack Developer',
    'Frontend Developer',
    'Software Engineer',
    'FastAPI Developer',
    'Django Developer',
    'React Developer',
    'Next.js Developer',
    'Node.js Developer',
    'Java Developer',
    'Spring Boot Developer',
    'AI / Machine Learning Engineer',
    'Data Engineer',
    'Data Scientist',
    'DevOps Engineer',
    'Cloud Engineer (AWS/GCP/Azure)',
    'QA Automation Engineer',
    'Mobile App Developer (Flutter/React Native)',
    'Android Developer',
    'iOS Developer',
    'MERN Stack Developer',
    'Golang Developer',
    'Database Administrator',
    'Cybersecurity Analyst',
    'Junior Software Engineer',
    'Solutions Architect',
]

DEFAULT_LOCATIONS = [
    'Remote',
    'India',
    'Kerala',
    'Kochi',
    'Trivandrum',
    'Calicut',
    'Thrissur',
    'Bangalore',
    'Hyderabad',
    'Chennai',
    'Pune',
    'Mumbai',
    'Delhi NCR',
    'Gurgaon / Gurugram',
    'Noida',
    'Coimbatore',
    'Dubai / UAE',
    'Europe (Remote)',
    'US (Remote)',
    'Worldwide (Remote)',
]

DEFAULT_SKILLS = [
    'Python',
    'FastAPI',
    'Django',
    'Flask',
    'React',
    'JavaScript',
    'TypeScript',
    'Next.js',
    'Node.js',
    'Express.js',
    'PostgreSQL',
    'MySQL',
    'MongoDB',
    'Redis',
    'SQLite',
    'Docker',
    'Kubernetes',
    'AWS',
    'Google Cloud (GCP)',
    'Microsoft Azure',
    'Git & GitHub',
    'CI/CD & GitHub Actions',
    'Linux',
    'Bash / Shell',
    'REST API',
    'GraphQL',
    'Tailwind CSS',
    'HTML5 / CSS3',
    'Celery',
    'Kafka',
    'RabbitMQ',
    'SQLAlchemy',
    'Pytest',
    'Unit Testing',
    'Microservices',
    'System Design',
    'Pandas',
    'NumPy',
    'Machine Learning',
    'Scikit-Learn',
    'TensorFlow',
    'PyTorch',
    'LangChain',
    'Large Language Models (LLM)',
    'Web Scraping (Playwright/BS4)',
    'Nginx',
    'Agile / Scrum',
]

DEFAULT_WORK_MODES = [
    {'value': 'remote', 'label': 'Remote'},
    {'value': 'hybrid', 'label': 'Hybrid'},
    {'value': 'onsite', 'label': 'On-site'},
]

DEFAULT_DATE_FRESHNESS = [
    {'days': 1, 'label': 'Today (Past 24 Hours)'},
    {'days': 3, 'label': 'Past 3 Days'},
    {'days': 7, 'label': 'Past 7 Days (Recommended)'},
    {'days': 14, 'label': 'Past 14 Days'},
    {'days': 30, 'label': 'Past 30 Days'},
]


def seed_master_lookups_if_empty(db: Session) -> None:
    """Ensures database lookup tables are populated with standard IT taxonomy."""
    count = db.query(MasterLookup).count()
    if count > 0:
        return

    logger.info("Seeding master lookup database tables...")
    records = []

    # Roles
    for idx, role in enumerate(DEFAULT_ROLES):
        records.append(MasterLookup(
            id=uuid.uuid4(),
            category='role',
            value=role,
            label=role,
            sort_order=idx,
            is_active=True,
        ))

    # Locations
    for idx, loc in enumerate(DEFAULT_LOCATIONS):
        records.append(MasterLookup(
            id=uuid.uuid4(),
            category='location',
            value=loc,
            label=loc,
            sort_order=idx,
            is_active=True,
        ))

    # Skills
    for idx, skill in enumerate(DEFAULT_SKILLS):
        records.append(MasterLookup(
            id=uuid.uuid4(),
            category='skill',
            value=skill,
            label=skill,
            sort_order=idx,
            is_active=True,
        ))

    # Work Modes
    for idx, wm in enumerate(DEFAULT_WORK_MODES):
        records.append(MasterLookup(
            id=uuid.uuid4(),
            category='work_mode',
            value=wm['value'],
            label=wm['label'],
            sort_order=idx,
            is_active=True,
        ))

    # Date Freshness
    for idx, df in enumerate(DEFAULT_DATE_FRESHNESS):
        records.append(MasterLookup(
            id=uuid.uuid4(),
            category='date_freshness',
            value=str(df['days']),
            label=df['label'],
            sort_order=idx,
            is_active=True,
            metadata_json={'days': df['days']},
        ))

    db.add_all(records)
    db.commit()
    logger.info(f"Seeded {len(records)} master lookup records in database.")


def get_meta_options(db: Session) -> Dict[str, Any]:
    """Retrieve full dynamic master taxonomy for candidate settings and autocomplete."""
    seed_master_lookups_if_empty(db)

    lookups = (
        db.query(MasterLookup)
        .filter(MasterLookup.is_active == True)
        .order_by(MasterLookup.sort_order, MasterLookup.value)
        .all()
    )

    roles = []
    locations = []
    skills = []
    work_modes = []
    date_freshness = []

    for item in lookups:
        if item.category == 'role':
            roles.append(item.value)
        elif item.category == 'location':
            locations.append(item.value)
        elif item.category == 'skill':
            skills.append(item.value)
        elif item.category == 'work_mode':
            work_modes.append(item.value)
        elif item.category == 'date_freshness':
            days = item.metadata_json.get('days') if item.metadata_json else int(item.value)
            date_freshness.append({'days': days, 'label': item.label or f"Past {days} Days"})

    return {
        'roles': roles,
        'locations': locations,
        'skills': skills,
        'work_modes': work_modes,
        'date_freshness': date_freshness,
    }


def add_lookup_if_missing(db: Session, category: str, value: str, label: Optional[str] = None) -> MasterLookup:
    """Dynamically register a new learned skill, role, or location into the database taxonomy."""
    clean_val = value.strip()
    clean_cat = category.strip().lower()
    existing = (
        db.query(MasterLookup)
        .filter(MasterLookup.category == clean_cat, MasterLookup.value.ilike(clean_val))
        .first()
    )
    if existing:
        return existing

    new_lookup = MasterLookup(
        id=uuid.uuid4(),
        category=clean_cat,
        value=clean_val,
        label=label or clean_val,
        sort_order=100,
        is_active=True,
    )
    db.add(new_lookup)
    db.commit()
    db.refresh(new_lookup)
    return new_lookup

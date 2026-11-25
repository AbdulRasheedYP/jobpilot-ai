import uuid
import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.app.models.lookup import MasterLookup

logger = logging.getLogger(__name__)

MASTER_ROLE_TAXONOMY: Dict[str, List[str]] = {
    "Data & Analytics": [
        "Data Analyst", "Junior Data Analyst", "Senior Data Analyst", "MIS Analyst",
        "MIS Executive", "MIS Reporting Executive", "MIS Coordinator", "Reporting Analyst",
        "Reporting Executive", "Business Data Analyst", "Business Analyst",
        "Business Intelligence Analyst", "BI Analyst", "BI Developer",
        "Data Visualization Analyst", "Data Visualization Developer", "Power BI Developer",
        "Tableau Developer", "Tableau Analyst", "Excel Analyst", "Data Quality Analyst",
        "Data Quality Executive", "Data Operations Analyst", "Data Management Executive",
        "Data Specialist", "Data Research Analyst", "Data Processing Executive",
        "Data Entry Operator", "Data Entry Executive", "Data Validation Analyst",
        "Data Reconciliation Analyst", "Database Analyst", "SQL Analyst",
        "Analytics Consultant", "Operations Analyst", "Product Data Analyst",
        "Marketing Data Analyst", "Financial Data Analyst", "HR Data Analyst",
    ],
    "RPA & Automation": [
        "RPA Developer", "Junior RPA Developer", "Senior RPA Developer", "UiPath Developer",
        "UiPath RPA Developer", "UiPath Automation Developer", "UiPath Consultant",
        "UiPath Business Analyst", "UiPath Solution Architect", "Automation Developer",
        "Automation Engineer", "Process Automation Developer", "Intelligent Automation Developer",
        "Robotic Process Automation Engineer", "RPA Analyst", "RPA Support Engineer",
        "RPA Administrator", "Blue Prism Developer", "Blue Prism Consultant",
        "Automation Anywhere Developer", "Power Automate Developer",
        "Microsoft Power Platform Developer", "Workflow Automation Developer",
        "Python Automation Developer", "Test Automation Engineer", "Selenium Automation Engineer",
        "API Automation Engineer", "Hyperautomation Developer",
    ],
    "Software & IT Development": [
        "Software Developer", "Software Engineer", "Junior Software Developer",
        "Associate Software Engineer", "Python Developer", "Java Developer",
        "Java Backend Developer", ".NET Developer", "C# Developer", "PHP Developer",
        "Laravel Developer", "Node.js Developer", "Backend Developer", "Frontend Developer",
        "Full Stack Developer", "Web Developer", "Application Developer",
        "Mobile App Developer", "React Developer", "Angular Developer", "Django Developer",
        "FastAPI Developer", "API Developer", "WordPress Developer", "Shopify Developer",
        "Software Programmer", "Application Engineer", "Technical Developer",
    ],
    "AI & Machine Learning": [
        "AI Developer", "AI Engineer", "Machine Learning Engineer", "Data Scientist",
        "Junior Data Scientist", "Generative AI Developer", "Generative AI Engineer",
        "LLM Developer", "LLM Engineer", "RAG Developer", "Prompt Engineer",
        "NLP Engineer", "Computer Vision Engineer", "AI Automation Developer",
        "AI Agent Developer", "AI Integration Developer", "Deep Learning Engineer",
        "MLOps Engineer", "AI Research Assistant", "AI Analyst",
    ],
    "Finance & Accounting": [
        "Accounts Executive", "Junior Accountant", "Senior Accountant", "Accounts Assistant",
        "Accounts Payable Executive", "Accounts Receivable Executive", "Finance Executive",
        "Finance Analyst", "Financial Analyst", "Financial Reporting Analyst",
        "Tax Analyst", "Tax Consultant", "GST Executive", "Billing Executive",
        "Invoice Processing Executive", "Payroll Executive", "Audit Executive",
        "Internal Auditor", "External Auditor", "Reconciliation Executive",
        "Banking Operations Executive", "Financial Operations Analyst", "Credit Analyst",
        "Loan Processing Executive", "KYC Analyst", "AML Analyst", "Fund Accountant",
        "Bookkeeper", "Cost Accountant",
    ],
    "HR & Recruitment": [
        "HR Executive", "HR Assistant", "HR Analyst", "HR Coordinator", "HR Generalist",
        "HR Operations Executive", "HR Recruiter", "IT Recruiter", "Technical Recruiter",
        "Talent Acquisition Executive", "Talent Acquisition Specialist", "Recruitment Coordinator",
        "Recruitment Consultant", "Payroll Specialist", "HR Payroll Executive",
        "HR Administrator", "Training and Development Executive", "Employee Engagement Executive",
        "Onboarding Specialist", "People Operations Executive", "HR MIS Executive",
    ],
    "Operations & Administration": [
        "Operations Executive", "Operations Analyst", "Operations Associate",
        "Operations Coordinator", "Operations Manager", "Business Operations Executive",
        "Process Associate", "Process Executive", "Process Analyst", "Process Coordinator",
        "Back Office Executive", "Back Office Associate", "Office Administrator",
        "Admin Executive", "Administration Assistant", "Administrative Officer",
        "Documentation Executive", "Document Controller", "Data Processing Executive",
        "Workflow Coordinator", "Service Delivery Executive", "Business Support Executive",
        "Operations Support Analyst",
    ],
    "Customer Support & Service": [
        "Customer Support Executive", "Customer Service Executive", "Customer Care Executive",
        "Customer Success Executive", "Customer Success Associate", "Technical Support Executive",
        "Technical Support Engineer", "Helpdesk Executive", "IT Support Executive",
        "Service Desk Analyst", "Support Analyst", "Client Support Executive",
        "Chat Support Executive", "Email Support Executive", "Voice Process Executive",
        "Non-Voice Process Executive", "International Process Executive",
        "Customer Experience Associate", "Product Support Specialist", "Application Support Analyst",
    ],
    "Sales & Marketing": [
        "Sales Executive", "Sales Analyst", "Sales Coordinator", "Sales Operations Executive",
        "Business Development Executive", "Business Development Associate",
        "Business Development Manager", "Lead Generation Executive", "Inside Sales Executive",
        "Digital Marketing Executive", "Digital Marketing Analyst", "SEO Executive",
        "SEO Analyst", "SEM Specialist", "Social Media Executive", "Social Media Manager",
        "Content Marketing Executive", "Content Writer", "Copywriter", "Email Marketing Executive",
        "Performance Marketing Executive", "Marketing Analyst", "Marketing Coordinator",
        "Market Research Analyst", "Brand Executive", "CRM Executive", "E-commerce Executive",
    ],
    "Supply Chain, Logistics & Procurement": [
        "Supply Chain Analyst", "Supply Chain Executive", "Logistics Executive",
        "Logistics Coordinator", "Procurement Executive", "Purchase Executive",
        "Procurement Analyst", "Inventory Analyst", "Inventory Executive", "Warehouse Executive",
        "Warehouse Coordinator", "Store Executive", "Dispatch Executive", "Shipping Executive",
        "Import Export Executive", "Vendor Management Executive", "Order Management Executive",
        "Supply Chain Coordinator", "Demand Planner", "Production Planner",
    ],
    "Quality & Testing": [
        "Quality Analyst", "Quality Assurance Executive", "QA Analyst", "QA Engineer",
        "Software Tester", "Manual Tester", "Automation Tester", "Test Engineer",
        "API Tester", "Performance Tester", "Quality Control Executive", "Quality Inspector",
        "Process Quality Analyst", "Data Quality Analyst", "Compliance Analyst", "Testing Associate",
    ],
    "Banking, Insurance & KYC": [
        "Banking Associate", "Banking Operations Executive", "Banking Analyst",
        "Insurance Executive", "Insurance Claims Analyst", "Claims Processing Executive",
        "Underwriting Analyst", "KYC Executive", "KYC Analyst", "AML Analyst",
        "Fraud Analyst", "Risk Analyst", "Credit Processing Executive", "Loan Operations Executive",
        "Mortgage Processing Executive", "Transaction Processing Executive",
        "Reconciliation Analyst", "Compliance Executive",
    ],
    "IT Infrastructure & Cloud": [
        "System Administrator", "Linux Administrator", "Network Administrator",
        "Network Engineer", "Cloud Engineer", "AWS Engineer", "Azure Engineer",
        "DevOps Engineer", "Junior DevOps Engineer", "Site Reliability Engineer",
        "Cybersecurity Analyst", "Security Analyst", "SOC Analyst", "Database Administrator",
        "Database Developer", "PostgreSQL Developer", "SQL Developer", "Cloud Support Engineer",
        "Infrastructure Support Engineer", "IT Operations Engineer",
    ],
    "Design & Creative": [
        "UI Designer", "UX Designer", "UI/UX Designer", "Graphic Designer",
        "Web Designer", "Product Designer", "Visual Designer", "Motion Graphic Designer",
        "Video Editor", "Photo Editor", "Multimedia Designer", "Creative Executive",
        "Content Designer", "Presentation Designer", "3D Designer",
    ],
    "ERP, CRM & Enterprise Tools": [
        "SAP Consultant", "SAP ABAP Developer", "SAP Functional Consultant", "SAP Analyst",
        "Oracle Developer", "Oracle Functional Consultant", "Salesforce Developer",
        "Salesforce Administrator", "Salesforce Consultant", "CRM Analyst", "CRM Executive",
        "Odoo Developer", "ERP Developer", "ERP Executive", "ERP Analyst",
        "ServiceNow Developer", "ServiceNow Administrator", "Power Platform Developer",
        "SharePoint Developer", "Dynamics 365 Developer",
    ],
    "Research, Documentation & Education": [
        "Research Analyst", "Research Associate", "Market Research Executive",
        "Business Research Analyst", "Data Research Executive", "Technical Writer",
        "Documentation Specialist", "Content Researcher", "Academic Research Assistant",
        "Training Executive", "Technical Trainer", "Software Trainer", "IT Trainer",
        "Data Analyst Trainer", "Process Trainer", "Instructional Designer",
    ],
    "Project & Product Management": [
        "Project Coordinator", "Project Executive", "Project Analyst", "Project Manager",
        "IT Project Manager", "Program Coordinator", "Program Manager", "Product Analyst",
        "Product Executive", "Product Associate", "Associate Product Manager", "Product Manager",
        "Product Owner", "Scrum Master", "Agile Coordinator", "Delivery Coordinator",
        "Delivery Manager", "PMO Analyst", "PMO Executive",
    ],
    "Other Business & Professional Roles": [
        "Business Associate", "Business Executive", "Business Consultant", "Management Trainee",
        "Graduate Trainee", "Graduate Engineer Trainee", "Executive Assistant",
        "Personal Assistant", "Virtual Assistant", "Office Coordinator", "Documentation Analyst",
        "Compliance Officer", "Legal Assistant", "Legal Executive", "Paralegal",
        "Risk Management Executive", "Vendor Coordinator", "Relationship Executive",
        "Relationship Manager", "Account Manager", "Client Relationship Executive",
    ],
}

LEVEL_VARIATIONS: List[str] = [
    "Intern", "Trainee", "Fresher", "Entry Level", "Junior", "Associate",
    "Executive", "Assistant", "Analyst", "Specialist", "Coordinator",
    "Consultant", "Engineer", "Developer", "Administrator", "Officer",
    "Senior", "Lead", "Team Lead", "Manager", "Assistant Manager",
    "Deputy Manager", "Head", "Director",
]

# Flatten all roles preserving order and uniqueness
_all_roles: List[str] = []
for _cat_roles in MASTER_ROLE_TAXONOMY.values():
    for _r in _cat_roles:
        if _r not in _all_roles:
            _all_roles.append(_r)

DEFAULT_ROLES: List[str] = _all_roles


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


def sync_all_master_roles(db: Session) -> int:
    """Ensures all roles from MASTER_ROLE_TAXONOMY exist in master_lookups with industry category."""
    existing_roles = {
        r.value.lower(): r
        for r in db.query(MasterLookup).filter(MasterLookup.category == 'role').all()
    }
    new_records = []
    sort_idx = 0
    for industry, roles in MASTER_ROLE_TAXONOMY.items():
        for role in roles:
            sort_idx += 1
            if role.lower() not in existing_roles:
                new_records.append(MasterLookup(
                    id=uuid.uuid4(),
                    category='role',
                    value=role,
                    label=role,
                    sort_order=sort_idx,
                    is_active=True,
                    metadata_json={'industry': industry},
                ))
            else:
                existing = existing_roles[role.lower()]
                meta = existing.metadata_json or {}
                if not meta.get('industry'):
                    meta['industry'] = industry
                    existing.metadata_json = meta

    if new_records:
        db.add_all(new_records)
        db.commit()
        logger.info(f"Synced {len(new_records)} new master roles across 18 categories.")
    elif db.is_modified:
        db.commit()
    return len(new_records)


def seed_master_lookups_if_empty(db: Session) -> None:
    """Ensures database lookup tables are populated with standard taxonomy."""
    count = db.query(MasterLookup).count()
    if count == 0:
        logger.info("Seeding initial master lookup database tables...")
        records = []

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
        logger.info(f"Seeded baseline lookup records in database.")

    # Always ensure all 18 categories and 420+ roles are synced
    sync_all_master_roles(db)


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
    role_categories: Dict[str, List[str]] = {cat: [] for cat in MASTER_ROLE_TAXONOMY.keys()}

    for item in lookups:
        if item.category == 'role':
            if item.value not in roles:
                roles.append(item.value)
            cat = (item.metadata_json or {}).get('industry')
            if cat and cat in role_categories:
                if item.value not in role_categories[cat]:
                    role_categories[cat].append(item.value)
        elif item.category == 'location':
            if item.value not in locations:
                locations.append(item.value)
        elif item.category == 'skill':
            if item.value not in skills:
                skills.append(item.value)
        elif item.category == 'work_mode':
            if item.value not in work_modes:
                work_modes.append(item.value)
        elif item.category == 'date_freshness':
            days = item.metadata_json.get('days') if item.metadata_json else int(item.value)
            date_freshness.append({'days': days, 'label': item.label or f"Past {days} Days"})

    # Ensure all categories are fully populated from MASTER_ROLE_TAXONOMY
    for cat, cat_roles in MASTER_ROLE_TAXONOMY.items():
        if not role_categories.get(cat):
            role_categories[cat] = list(cat_roles)
        else:
            for cr in cat_roles:
                if cr not in role_categories[cat]:
                    role_categories[cat].append(cr)

    return {
        'roles': roles,
        'locations': locations,
        'skills': skills,
        'work_modes': work_modes,
        'date_freshness': date_freshness,
        'role_categories': role_categories,
        'level_variations': LEVEL_VARIATIONS,
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

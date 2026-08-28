from datetime import datetime
from sqlalchemy.orm import Session
from app.models.models import *
FIELDS=[("full_name","Full Name","Chaitanya Demo User"),("father_name","Father Name","Rohan Demo User"),("mother_name","Mother Name","Maya Demo User"),("dob","Date of Birth","15 October 1995"),("gender","Gender","Male"),("mobile","Mobile","90000 00001"),("email","Email","chaitanya.demo@example.test"),("permanent_address","Permanent Address","123 Demo Street, Nagpur, Demo State 440001"),("correspondence_address","Correspondence Address","44 Sample Lane, Bhandara, Demo State 441904"),("state","State","Demo State"),("district","District","Nagpur"),("taluka","Taluka","Demo Taluka"),("pin","PIN","440001"),("tenth","10th Qualification","Demo State Board"),("twelfth","12th Qualification","Demo State Board"),("graduation","Graduation","B.Com"),("college","College","Demo City College"),("course","Course","Commerce"),("category","Category","General"),("experience","Experience","Customer service, 7 years")]
DOCS=[("photo","Photograph",["jpg","jpeg","png","webp"],50,20,200,230),("signature","Signature",["jpg","jpeg","png","webp"],50,10,140,60),("identity_proof","Demo Identity Proof",["pdf"],1024,None,None,None),("dob_proof","DOB Proof",["pdf"],1024,None,None,None),("education_certificate","Education Certificate",["pdf"],1024,None,None,None),("resume","Resume",["pdf"],1024,None,None,None),("experience_certificate","Experience Certificate",["pdf"],1024,None,None,None),("category_certificate","Category Certificate",["pdf"],1024,None,None,None)]
def type_and_fields(db: Session):
    kind=db.query(ApplicationType).filter_by(slug="demo-recruitment-2026").first()
    if kind: return kind
    kind=ApplicationType(slug="demo-recruitment-2026",title="Customer Support Associate — Demo Recruitment 2026",organization_name="National Skills & Employment Board (Fictional Demo)",organization_short_name="NSEB Demo",description="Independent FormSetu synthetic-data demonstration.",is_demo=True); db.add(kind); db.flush()
    sections={}; names=[("personal","Personal Details"),("contact","Contact Details"),("address","Address"),("education","Education"),("experience","Experience"),("eligibility","Eligibility")]
    for order,(slug,title) in enumerate(names): sections[slug]=ApplicationSection(application_type_id=kind.id,slug=slug,title=title,description=f"Synthetic {title.lower()}",display_order=order+1,required=True); db.add(sections[slug])
    db.flush()
    for order,(key,label,_) in enumerate(FIELDS):
        bucket="address" if key in {"permanent_address","correspondence_address","state","district","taluka","pin"} else "education" if key in {"tenth","twelfth","graduation","college","course"} else "experience" if key=="experience" else "contact" if key in {"mobile","email"} else "personal"
        db.add(ApplicationField(section_id=sections[bucket].id,key=key,label=label,field_type="text",required=True,display_order=order+1,validation_rules={}))
    PHOTO_RULES = {"face_count": 1, "face_required": True, "gaze_required": True, "plain_background": True, "preferred_background": "white", "body_coverage_percent": 70, "head_tilt_allowed_degrees": 15, "minimum_face_ratio": 0.08, "minimum_image_quality": True}
    for typ,label,formats,max_kb,min_kb,width,height in DOCS: db.add(DocumentRequirement(application_type_id=kind.id,document_type=typ,label=label,required=typ not in {"experience_certificate","category_certificate"},allowed_formats=formats,max_size_kb=max_kb,min_size_kb=min_kb,required_width=width,required_height=height,max_pages=1 if "pdf" in formats else None,photo_rules=PHOTO_RULES if typ=="photo" else {},description="Synthetic demo requirement."))
    db.commit(); return kind
def seed_session(db: Session) -> DemoSession:
    kind=type_and_fields(db); session=DemoSession(status="active"); db.add(session); db.flush(); app=Application(session_id=session.id,application_type_id=kind.id,status="draft",progress=0); db.add(app); db.flush()
    previous=PreviousApplication(session_id=session.id,application_type_id=kind.id,title="Recruitment Application — Demo 2025",application_year=2025,status="completed"); db.add(previous); db.flush()
    for key,label,value in FIELDS: db.add(PreviousApplicationField(previous_application_id=previous.id,field_key=key,label=label,value=value,last_verified=datetime(2025,8,18)))
    fields={f.key:f for s in kind.sections for f in s.fields}
    for key,_,value in FIELDS:
        current="Bhandara" if key=="district" else value
        db.add(FieldValue(application_id=app.id,field_id=fields[key].id,value=current,source="current_profile",status="available",confidence=1))
    for req in kind.requirements: db.add(ApplicationDocument(application_id=app.id,document_requirement_id=req.id,status="missing",validation_status="pending",preparation_status="not_required"))
    db.add(Conflict(application_id=app.id,field_key="district",previous_value="Nagpur",current_value="Bhandara",status="unresolved")); db.add(Declaration(application_id=app.id,accepted=False)); db.add(AuditEvent(session_id=session.id,application_id=app.id,event_type="demo_session_created",metadata_json={"synthetic":True})); db.commit(); return session
def reset_session(db: Session, session: DemoSession) -> DemoSession:
    db.delete(session); db.commit(); return seed_session(db)

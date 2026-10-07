import type { ClinicalFieldDef, SpecialtyConfig, SpecialtyId, Terminology } from "@/types";

/**
 * Specialty configuration. The core PMS is specialty-agnostic; everything that
 * differs between a dental clinic and a physiotherapy clinic lives here.
 * Later this can be served by the backend and customised per clinic.
 */

const BASE_TERMS: Terminology = {
  provider: "Doctor",
  providers: "Doctors",
  consultation: "Consultation",
  consultations: "Consultations",
  service: "Clinical Service",
  services: "Clinical Services",
  serviceRecord: "Service",
  serviceRecords: "Services",
  area: "Area",
  prescription: "Prescription",
};

const BASE_APPOINTMENT_TYPES = ["New Consultation", "Follow-up", "Review", "Teleconsultation"];

const scale = (key: string, label: string): ClinicalFieldDef => ({ key, label, type: "scale", min: 0, max: 10 });
const text = (key: string, label: string, wide = false, placeholder?: string): ClinicalFieldDef => ({
  key,
  label,
  type: wide ? "textarea" : "text",
  wide,
  placeholder,
});
const select = (key: string, label: string, options: string[]): ClinicalFieldDef => ({ key, label, type: "select", options });
const number = (key: string, label: string, unit?: string, min?: number, max?: number): ClinicalFieldDef => ({
  key,
  label,
  type: "number",
  unit,
  min,
  max,
});

export const SPECIALTIES: Record<SpecialtyId, SpecialtyConfig> = {
  physiotherapy: {
    id: "physiotherapy",
    name: "Physiotherapy",
    description: "Musculoskeletal, neuro and sports rehabilitation.",
    terminology: {
      ...BASE_TERMS,
      provider: "Physiotherapist",
      providers: "Physiotherapists",
      consultation: "Assessment",
      consultations: "Assessments",
      service: "Treatment",
      services: "Treatments",
      serviceRecord: "Treatment Session",
      serviceRecords: "Treatment Sessions",
      area: "Body part",
      prescription: "Home Exercise Programme",
    },
    appointmentTypes: ["New Consultation", "Follow-up", "Treatment Session", "Assessment", "Home Visit"],
    serviceCategories: ["Manual therapy", "Electrotherapy", "Exercise therapy", "Rehabilitation", "Specialised techniques"],
    defaultServices: [
      { name: "Manual Therapy", category: "Manual therapy", durationMinutes: 45, price: 900, taxRate: 0, description: "Joint mobilisation and soft tissue techniques." },
      { name: "Exercise Therapy", category: "Exercise therapy", durationMinutes: 45, price: 700, taxRate: 0, description: "Supervised therapeutic exercise programme." },
      { name: "Electrotherapy (TENS)", category: "Electrotherapy", durationMinutes: 30, price: 600, taxRate: 0, description: "Transcutaneous electrical nerve stimulation." },
      { name: "Interferential Therapy (IFT)", category: "Electrotherapy", durationMinutes: 30, price: 700, taxRate: 0, description: "Medium-frequency current for pain relief." },
      { name: "Ultrasound Therapy", category: "Electrotherapy", durationMinutes: 20, price: 700, taxRate: 0, description: "Therapeutic ultrasound for soft tissue healing." },
      { name: "Dry Needling", category: "Specialised techniques", durationMinutes: 30, price: 1200, taxRate: 0, description: "Trigger point dry needling." },
      { name: "Spinal Traction", category: "Manual therapy", durationMinutes: 30, price: 700, taxRate: 0, description: "Cervical or lumbar mechanical traction." },
      { name: "Kinesio Taping", category: "Specialised techniques", durationMinutes: 20, price: 800, taxRate: 0, description: "Elastic therapeutic taping." },
      { name: "Cupping Therapy", category: "Specialised techniques", durationMinutes: 30, price: 1000, taxRate: 0, description: "Myofascial decompression." },
      { name: "Post-operative Rehab", category: "Rehabilitation", durationMinutes: 60, price: 1200, taxRate: 0, description: "Protocol-based post-surgical rehabilitation." },
    ],
    consultationTemplate: {
      id: "tpl-physiotherapy",
      name: "Physiotherapy assessment",
      specialty: "physiotherapy",
      sections: [
        {
          title: "Pain assessment",
          fields: [scale("painScale", "Pain scale (NRS)"), text("painLocation", "Pain location"), select("painType", "Pain type", ["Sharp", "Dull / aching", "Burning", "Radiating", "Throbbing"])],
        },
        {
          title: "Musculoskeletal examination",
          fields: [
            text("rom", "Range of motion", true, "e.g. Lumbar flexion limited to 60%"),
            text("muscleStrength", "Muscle strength (MMT)", true),
            text("specialTests", "Special tests", true),
            text("functionalAssessment", "Functional assessment", true, "ADLs, gait, balance, outcome scores"),
          ],
        },
      ],
    },
    serviceRecordFields: [scale("painBefore", "Pain before session"), scale("painAfter", "Pain after session")],
  },
  dental: {
    id: "dental",
    name: "Dental",
    description: "General, restorative and cosmetic dentistry.",
    terminology: {
      ...BASE_TERMS,
      provider: "Dentist",
      providers: "Dentists",
      service: "Procedure",
      services: "Procedures",
      serviceRecord: "Procedure",
      serviceRecords: "Procedures",
      area: "Tooth / quadrant",
    },
    appointmentTypes: ["New Consultation", "Follow-up", "Procedure", "Cleaning", "Emergency"],
    serviceCategories: ["Preventive", "Restorative", "Endodontics", "Surgery", "Cosmetic", "Orthodontics"],
    defaultServices: [
      { name: "Scaling & Polishing", category: "Preventive", durationMinutes: 30, price: 1200, taxRate: 0, description: "Professional teeth cleaning." },
      { name: "Composite Filling", category: "Restorative", durationMinutes: 45, price: 1500, taxRate: 0, description: "Tooth-coloured restoration." },
      { name: "Root Canal Treatment", category: "Endodontics", durationMinutes: 60, price: 6500, taxRate: 0, description: "Single-sitting or multi-visit RCT." },
      { name: "Tooth Extraction", category: "Surgery", durationMinutes: 30, price: 1200, taxRate: 0, description: "Simple extraction." },
      { name: "Teeth Whitening", category: "Cosmetic", durationMinutes: 60, price: 8000, taxRate: 18, description: "In-office bleaching." },
      { name: "Dental Crown (PFM)", category: "Restorative", durationMinutes: 45, price: 7000, taxRate: 0, description: "Porcelain-fused-to-metal crown." },
    ],
    consultationTemplate: {
      id: "tpl-dental",
      name: "Dental examination",
      specialty: "dental",
      sections: [
        {
          title: "Dental examination",
          fields: [
            text("teethInvolved", "Teeth involved (FDI)", false, "e.g. 36, 37"),
            select("oralHygiene", "Oral hygiene", ["Good", "Fair", "Poor"]),
            select("gingivalStatus", "Gingival status", ["Healthy", "Gingivitis", "Periodontitis"]),
            text("cariesFindings", "Caries / restorations", true),
            text("occlusion", "Occlusion"),
            text("radiographs", "Radiographic findings", true),
          ],
        },
      ],
    },
    serviceRecordFields: [text("toothNumber", "Tooth number(s)"), text("materialUsed", "Material used")],
  },
  dermatology: {
    id: "dermatology",
    name: "Dermatology & Skin Care",
    description: "Medical dermatology, aesthetics and skin procedures.",
    terminology: { ...BASE_TERMS, provider: "Dermatologist", providers: "Dermatologists", service: "Skin Procedure", services: "Skin Procedures", serviceRecord: "Procedure", serviceRecords: "Procedures", area: "Treatment area" },
    appointmentTypes: ["New Consultation", "Follow-up", "Procedure", "Laser Session"],
    serviceCategories: ["Consultation", "Peels", "Laser", "Injectables", "Hair"],
    defaultServices: [
      { name: "Chemical Peel", category: "Peels", durationMinutes: 45, price: 2500, taxRate: 18, description: "Superficial peel for pigmentation and acne." },
      { name: "Laser Hair Reduction (Session)", category: "Laser", durationMinutes: 30, price: 3000, taxRate: 18, description: "Diode laser session." },
      { name: "Acne Scar Treatment", category: "Laser", durationMinutes: 45, price: 4500, taxRate: 18, description: "Fractional laser / microneedling." },
      { name: "PRP for Hair", category: "Hair", durationMinutes: 60, price: 5000, taxRate: 18, description: "Platelet-rich plasma therapy." },
    ],
    consultationTemplate: {
      id: "tpl-dermatology",
      name: "Skin examination",
      specialty: "dermatology",
      sections: [
        {
          title: "Skin findings",
          fields: [
            select("skinType", "Skin type (Fitzpatrick)", ["I", "II", "III", "IV", "V", "VI"]),
            text("lesionType", "Lesion type / morphology"),
            text("lesionSite", "Site & distribution"),
            text("lesionSize", "Size"),
            text("skinFindings", "Other skin findings", true),
          ],
        },
      ],
    },
    serviceRecordFields: [text("settings", "Device settings / strength")],
  },
  general_physician: {
    id: "general_physician",
    name: "General Physician",
    description: "Primary care and family medicine.",
    terminology: { ...BASE_TERMS },
    appointmentTypes: [...BASE_APPOINTMENT_TYPES, "Procedure", "Home Visit"],
    serviceCategories: ["Consultation", "Procedure", "Injection", "Diagnostics"],
    defaultServices: [
      { name: "General Consultation", category: "Consultation", durationMinutes: 15, price: 500, taxRate: 0, description: "OPD consultation." },
      { name: "Injection Administration", category: "Injection", durationMinutes: 10, price: 150, taxRate: 0, description: "IM / IV injection." },
      { name: "Dressing", category: "Procedure", durationMinutes: 15, price: 300, taxRate: 0, description: "Wound dressing." },
      { name: "ECG", category: "Diagnostics", durationMinutes: 15, price: 400, taxRate: 0, description: "12-lead ECG." },
    ],
    consultationTemplate: {
      id: "tpl-general",
      name: "General examination",
      specialty: "general_physician",
      sections: [
        {
          title: "Systemic examination",
          fields: [text("cvs", "Cardiovascular"), text("rs", "Respiratory"), text("abdomen", "Abdomen"), text("cns", "CNS")],
        },
      ],
    },
    serviceRecordFields: [],
  },
  homeopathy: {
    id: "homeopathy",
    name: "Homeopathy (BHMS)",
    description: "Classical and constitutional homeopathy.",
    terminology: { ...BASE_TERMS, service: "Treatment", services: "Treatments", serviceRecord: "Treatment", serviceRecords: "Treatments" },
    appointmentTypes: ["New Case Taking", "Follow-up", "Review"],
    serviceCategories: ["Consultation", "Medicine"],
    defaultServices: [
      { name: "Detailed Case Taking", category: "Consultation", durationMinutes: 60, price: 1000, taxRate: 0, description: "First constitutional case taking." },
      { name: "Follow-up with Medicines (15 days)", category: "Medicine", durationMinutes: 15, price: 600, taxRate: 0, description: "Follow-up including dispensed medicines." },
    ],
    consultationTemplate: {
      id: "tpl-homeopathy",
      name: "Homeopathic case taking",
      specialty: "homeopathy",
      sections: [
        {
          title: "Constitutional assessment",
          fields: [
            text("mentalGenerals", "Mental generals", true),
            text("physicalGenerals", "Physical generals (thermal, thirst, appetite)", true),
            text("modalities", "Modalities"),
            text("remedy", "Remedy & potency"),
          ],
        },
      ],
    },
    serviceRecordFields: [text("remedy", "Remedy dispensed")],
  },
  ayurveda: {
    id: "ayurveda",
    name: "Ayurveda",
    description: "Ayurvedic consultation and Panchakarma therapies.",
    terminology: { ...BASE_TERMS, provider: "Vaidya", providers: "Vaidyas", service: "Therapy", services: "Therapies", serviceRecord: "Therapy Session", serviceRecords: "Therapy Sessions" },
    appointmentTypes: ["New Consultation", "Follow-up", "Therapy Session", "Panchakarma"],
    serviceCategories: ["Consultation", "Panchakarma", "Therapy"],
    defaultServices: [
      { name: "Abhyanga", category: "Therapy", durationMinutes: 60, price: 1500, taxRate: 0, description: "Full-body oil massage." },
      { name: "Shirodhara", category: "Therapy", durationMinutes: 45, price: 2000, taxRate: 0, description: "Continuous oil pouring on forehead." },
      { name: "Basti", category: "Panchakarma", durationMinutes: 45, price: 1800, taxRate: 0, description: "Medicated enema therapy." },
      { name: "Nasya", category: "Panchakarma", durationMinutes: 30, price: 800, taxRate: 0, description: "Nasal administration of medicine." },
    ],
    consultationTemplate: {
      id: "tpl-ayurveda",
      name: "Ayurvedic assessment",
      specialty: "ayurveda",
      sections: [
        {
          title: "Ayurvedic assessment",
          fields: [
            select("prakriti", "Prakriti", ["Vata", "Pitta", "Kapha", "Vata-Pitta", "Pitta-Kapha", "Vata-Kapha", "Tridoshic"]),
            select("vikriti", "Vikriti (imbalance)", ["Vata", "Pitta", "Kapha", "Mixed"]),
            text("nadi", "Nadi pariksha"),
            select("agni", "Agni", ["Sama", "Vishama", "Tikshna", "Manda"]),
            text("ashtavidha", "Ashtavidha pariksha notes", true),
          ],
        },
      ],
    },
    serviceRecordFields: [text("oilUsed", "Oil / medicine used")],
  },
  ophthalmology: {
    id: "ophthalmology",
    name: "Ophthalmology / Eye Care",
    description: "Comprehensive eye examination and procedures.",
    terminology: { ...BASE_TERMS, provider: "Ophthalmologist", providers: "Ophthalmologists", service: "Eye Service", services: "Eye Services", serviceRecord: "Procedure", serviceRecords: "Procedures", area: "Eye (OD/OS)" },
    appointmentTypes: ["New Consultation", "Follow-up", "Refraction", "Procedure"],
    serviceCategories: ["Examination", "Diagnostics", "Procedure"],
    defaultServices: [
      { name: "Comprehensive Eye Exam", category: "Examination", durationMinutes: 30, price: 800, taxRate: 0, description: "Vision, refraction and fundus." },
      { name: "OCT Scan", category: "Diagnostics", durationMinutes: 20, price: 2500, taxRate: 0, description: "Optical coherence tomography." },
      { name: "YAG Laser Capsulotomy", category: "Procedure", durationMinutes: 30, price: 6000, taxRate: 0, description: "Posterior capsule opacification treatment." },
    ],
    consultationTemplate: {
      id: "tpl-ophthalmology",
      name: "Eye examination",
      specialty: "ophthalmology",
      sections: [
        {
          title: "Vision",
          fields: [text("vaRight", "Visual acuity – OD"), text("vaLeft", "Visual acuity – OS"), number("iopRight", "IOP – OD", "mmHg"), number("iopLeft", "IOP – OS", "mmHg")],
        },
        { title: "Eye examination", fields: [text("anteriorSegment", "Anterior segment", true), text("fundus", "Fundus", true)] },
      ],
    },
    serviceRecordFields: [select("eye", "Eye", ["Right (OD)", "Left (OS)", "Both (OU)"])],
  },
  ent: {
    id: "ent",
    name: "ENT",
    description: "Ear, nose and throat care.",
    terminology: { ...BASE_TERMS, provider: "ENT Surgeon", providers: "ENT Surgeons", service: "Procedure", services: "Procedures", serviceRecord: "Procedure", serviceRecords: "Procedures" },
    appointmentTypes: [...BASE_APPOINTMENT_TYPES, "Procedure"],
    serviceCategories: ["Examination", "Diagnostics", "Procedure"],
    defaultServices: [
      { name: "Diagnostic Nasal Endoscopy", category: "Diagnostics", durationMinutes: 20, price: 1500, taxRate: 0, description: "Rigid nasal endoscopy." },
      { name: "Ear Wax Removal", category: "Procedure", durationMinutes: 15, price: 500, taxRate: 0, description: "Microsuction / syringing." },
      { name: "Pure Tone Audiometry", category: "Diagnostics", durationMinutes: 30, price: 800, taxRate: 0, description: "Hearing assessment." },
    ],
    consultationTemplate: {
      id: "tpl-ent",
      name: "ENT examination",
      specialty: "ent",
      sections: [{ title: "ENT examination", fields: [text("ear", "Ear", true), text("nose", "Nose", true), text("throat", "Throat", true)] }],
    },
    serviceRecordFields: [],
  },
  orthopedics: {
    id: "orthopedics",
    name: "Orthopaedics",
    description: "Bone, joint and spine care.",
    terminology: { ...BASE_TERMS, provider: "Orthopaedic Surgeon", providers: "Orthopaedic Surgeons", service: "Procedure", services: "Procedures", serviceRecord: "Procedure", serviceRecords: "Procedures", area: "Joint / region" },
    appointmentTypes: [...BASE_APPOINTMENT_TYPES, "Procedure", "Plaster Check"],
    serviceCategories: ["Consultation", "Procedure", "Injection"],
    defaultServices: [
      { name: "Plaster / Cast Application", category: "Procedure", durationMinutes: 30, price: 1500, taxRate: 0, description: "POP or fibreglass cast." },
      { name: "Intra-articular Injection", category: "Injection", durationMinutes: 20, price: 2500, taxRate: 0, description: "Joint injection." },
    ],
    consultationTemplate: {
      id: "tpl-orthopedics",
      name: "Orthopaedic examination",
      specialty: "orthopedics",
      sections: [{ title: "Orthopaedic examination", fields: [text("inspection", "Inspection"), text("palpation", "Palpation"), text("movements", "Movements", true), text("imaging", "Imaging findings", true)] }],
    },
    serviceRecordFields: [],
  },
  chiropractic: {
    id: "chiropractic",
    name: "Chiropractic",
    description: "Spinal adjustment and manipulation.",
    terminology: { ...BASE_TERMS, provider: "Chiropractor", providers: "Chiropractors", service: "Adjustment", services: "Adjustments", serviceRecord: "Adjustment Session", serviceRecords: "Adjustment Sessions", area: "Spinal segment" },
    appointmentTypes: ["New Consultation", "Follow-up", "Adjustment"],
    serviceCategories: ["Assessment", "Adjustment"],
    defaultServices: [{ name: "Spinal Adjustment", category: "Adjustment", durationMinutes: 30, price: 1500, taxRate: 0, description: "Chiropractic manipulation." }],
    consultationTemplate: {
      id: "tpl-chiropractic",
      name: "Chiropractic assessment",
      specialty: "chiropractic",
      sections: [{ title: "Spinal assessment", fields: [scale("painScale", "Pain scale"), text("subluxations", "Subluxation findings", true), text("posture", "Posture analysis", true)] }],
    },
    serviceRecordFields: [text("segments", "Segments adjusted")],
  },
  nutrition: {
    id: "nutrition",
    name: "Nutrition & Dietetics",
    description: "Diet planning and weight management.",
    terminology: { ...BASE_TERMS, provider: "Dietitian", providers: "Dietitians", service: "Program", services: "Programs", serviceRecord: "Session", serviceRecords: "Sessions", prescription: "Diet Plan" },
    appointmentTypes: ["New Consultation", "Follow-up", "Diet Review", "Online Session"],
    serviceCategories: ["Consultation", "Program"],
    defaultServices: [
      { name: "Diet Consultation", category: "Consultation", durationMinutes: 45, price: 1200, taxRate: 18, description: "Assessment and personalised diet plan." },
      { name: "Weight Management Program (1 month)", category: "Program", durationMinutes: 30, price: 4500, taxRate: 18, description: "Weekly reviews and plan updates." },
    ],
    consultationTemplate: {
      id: "tpl-nutrition",
      name: "Nutrition assessment",
      specialty: "nutrition",
      sections: [{ title: "Diet assessment", fields: [number("waist", "Waist circumference", "cm"), text("dietRecall", "24-hour diet recall", true), select("activityLevel", "Activity level", ["Sedentary", "Light", "Moderate", "Active"]), text("goal", "Goal")] }],
    },
    serviceRecordFields: [number("weightToday", "Weight today", "kg")],
  },
  psychology: {
    id: "psychology",
    name: "Psychology & Counselling",
    description: "Therapy and counselling sessions.",
    terminology: { ...BASE_TERMS, provider: "Counsellor", providers: "Counsellors", consultation: "Intake", consultations: "Intakes", service: "Therapy", services: "Therapies", serviceRecord: "Therapy Session", serviceRecords: "Therapy Sessions", prescription: "Recommendations" },
    appointmentTypes: ["Intake Session", "Therapy Session", "Follow-up", "Online Session"],
    serviceCategories: ["Assessment", "Therapy"],
    defaultServices: [
      { name: "Individual Therapy (50 min)", category: "Therapy", durationMinutes: 50, price: 2000, taxRate: 0, description: "One-to-one psychotherapy." },
      { name: "Couples Counselling", category: "Therapy", durationMinutes: 60, price: 3000, taxRate: 0, description: "Joint session." },
    ],
    consultationTemplate: {
      id: "tpl-psychology",
      name: "Intake assessment",
      specialty: "psychology",
      sections: [{ title: "Mental status", fields: [text("presentingConcerns", "Presenting concerns", true), select("mood", "Mood", ["Euthymic", "Low", "Anxious", "Irritable", "Elevated"]), scale("distress", "Distress level"), select("riskAssessment", "Risk assessment", ["No risk identified", "Low", "Moderate", "High"])] }],
    },
    serviceRecordFields: [text("modality", "Therapy modality")],
  },
  multispecialty: {
    id: "multispecialty",
    name: "Multi-specialty",
    description: "Clinics offering several specialties.",
    terminology: { ...BASE_TERMS },
    appointmentTypes: [...BASE_APPOINTMENT_TYPES, "Procedure"],
    serviceCategories: ["Consultation", "Procedure", "Diagnostics", "Therapy"],
    defaultServices: [{ name: "Specialist Consultation", category: "Consultation", durationMinutes: 20, price: 800, taxRate: 0, description: "Specialist OPD consultation." }],
    consultationTemplate: { id: "tpl-multispecialty", name: "General clinical notes", specialty: "multispecialty", sections: [] },
    serviceRecordFields: [],
  },
};

export const SPECIALTY_OPTIONS = Object.values(SPECIALTIES).map((config) => ({ value: config.id, label: config.name }));

export function getSpecialty(id: SpecialtyId | "" | undefined): SpecialtyConfig {
  return SPECIALTIES[id && id in SPECIALTIES ? id : "multispecialty"];
}

export function getTemplate(templateId: string) {
  return Object.values(SPECIALTIES).find((config) => config.consultationTemplate.id === templateId)?.consultationTemplate ?? null;
}

/** All appointment types offered by the clinic's specialties, de-duplicated. */
export function appointmentTypesFor(specialties: SpecialtyId[]): string[] {
  return Array.from(new Set(specialties.flatMap((id) => getSpecialty(id).appointmentTypes)));
}

/** Specialty-agnostic appointment types treated as "new patient" visits. */
export function isConsultationType(type: string): boolean {
  return /consult|intake|case taking|assessment|review|follow/i.test(type);
}

import type { BloodGroup, Gender, ReferralSource } from "@/types";

import type { Random } from "@/lib/random";

/** Demographic profile used to build a patient record. */
export interface PatientProfile {
  firstName: string;
  lastName: string;
  gender: Gender;
  conditionKey?: string;
  age?: number;
}

/**
 * Patients that also appeared in the original prototype. They keep their IDs
 * (PT-0001 … PT-0005) and core details everywhere in the app.
 */
export const FEATURED_PATIENTS: PatientProfile[] = [
  { firstName: "Rajesh", lastName: "Patel", gender: "Male", conditionKey: "lbp", age: 42 },
  { firstName: "Meena", lastName: "Shah", gender: "Female", conditionKey: "neck", age: 35 },
  { firstName: "Amit", lastName: "Patel", gender: "Male", conditionKey: "acl", age: 29 },
  { firstName: "Priya", lastName: "Shah", gender: "Female", conditionKey: "rotator", age: 31 },
  { firstName: "Karan", lastName: "Joshi", gender: "Male", conditionKey: "neck", age: 48 },
];

const MALE_NAMES = [
  "Arjun", "Vikram", "Harsh", "Nikhil", "Rohan", "Sanjay", "Mahesh", "Dinesh", "Kunal", "Parth",
  "Jignesh", "Bhavesh", "Hitesh", "Manish", "Suresh", "Ramesh", "Ankit", "Yash", "Deep", "Chirag",
  "Tushar", "Pranav", "Rahul", "Mehul", "Kishore", "Naresh", "Vivek", "Gaurav", "Hardik", "Darshan",
];

const FEMALE_NAMES = [
  "Anjali", "Pooja", "Kavita", "Nisha", "Hetal", "Riya", "Komal", "Sneha", "Bhavna", "Jyoti",
  "Neha", "Dipti", "Asha", "Sunita", "Rekha", "Krupa", "Payal", "Mansi", "Shruti", "Janki",
  "Falguni", "Urvi", "Divya", "Hiral", "Nidhi", "Ritu", "Swati", "Kinjal", "Leena", "Varsha",
];

const SURNAMES = [
  "Patel", "Shah", "Mehta", "Desai", "Joshi", "Trivedi", "Pandya", "Bhatt", "Parikh", "Modi",
  "Vyas", "Thakkar", "Chauhan", "Rana", "Solanki", "Dave", "Gandhi", "Kapadia", "Amin", "Raval",
  "Sheth", "Brahmbhatt", "Nair", "Iyer", "Sharma", "Gupta", "Agarwal", "Kulkarni", "Rathod", "Prajapati",
];

export const AREAS = [
  { line: "Satellite Road", pincode: "380015" },
  { line: "Navrangpura", pincode: "380009" },
  { line: "Bopal", pincode: "380058" },
  { line: "Vastrapur", pincode: "380054" },
  { line: "Maninagar", pincode: "380008" },
  { line: "Prahlad Nagar", pincode: "380015" },
  { line: "Thaltej", pincode: "380059" },
  { line: "Chandkheda", pincode: "382424" },
  { line: "Gota", pincode: "382481" },
  { line: "Bodakdev", pincode: "380054" },
  { line: "Paldi", pincode: "380007" },
  { line: "Naranpura", pincode: "380013" },
];

export const SOCIETIES = [
  "Shivam Residency", "Sundaram Apartments", "Gokul Flats", "Shanti Kunj", "Aaryan Heights",
  "Sun Paradise", "Parshwanath Society", "Swagat Bungalows", "Orchid Greens", "Sterling Towers",
];

export const OCCUPATIONS = [
  "Software Engineer", "Teacher", "Business Owner", "Homemaker", "Accountant", "Retired",
  "Student", "Bank Officer", "Sales Executive", "Doctor", "Architect", "Shop Owner",
];

/** Referral source, free-text detail and relative weight. */
export const REFERRALS: (readonly [ReferralSource, string, number])[] = [
  ["Walk-in", "", 14],
  ["Google", "Google Maps listing", 22],
  ["Instagram", "", 10],
  ["Facebook", "", 5],
  ["Doctor referral", "Dr. Shailesh Amin (Orthopaedic)", 18],
  ["Doctor referral", "Dr. Neeta Rao (Neurologist)", 6],
  ["Patient referral", "Existing patient", 15],
  ["Website", "omhealthcare.in", 7],
  ["Other", "Sterling Hospital camp", 3],
];

export const BLOOD_GROUP_WEIGHTS: (readonly [BloodGroup, number])[] = [
  ["B+", 32], ["O+", 30], ["A+", 20], ["AB+", 8], ["O-", 3], ["B-", 3], ["A-", 2], ["AB-", 2],
];

export const RELATIONS_BY_GENDER: Record<Gender, string[]> = {
  Male: ["Wife", "Brother", "Father", "Son"],
  Female: ["Husband", "Sister", "Mother", "Daughter"],
  Other: ["Sibling", "Friend"],
};

/** Builds a list of unique patient profiles, featured patients first. */
export function buildPatientProfiles(count: number, random: Random): PatientProfile[] {
  const profiles = [...FEATURED_PATIENTS];
  const usedNames = new Set(profiles.map((profile) => `${profile.firstName} ${profile.lastName}`));

  while (profiles.length < count) {
    const gender: Gender = random.chance(0.5) ? "Male" : "Female";
    const firstName = random.pick(gender === "Male" ? MALE_NAMES : FEMALE_NAMES);
    const lastName = random.pick(SURNAMES);
    const fullName = `${firstName} ${lastName}`;
    if (usedNames.has(fullName)) continue;
    usedNames.add(fullName);
    profiles.push({ firstName, lastName, gender });
  }

  return profiles;
}

export function randomPhone(random: Random): string {
  const prefix = random.pick(["98", "99", "97", "94", "90", "88", "70", "63"]);
  return `+91 ${prefix}${random.int(100, 999)} ${random.int(10000, 99999)}`;
}

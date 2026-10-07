import type { Vitals } from "@/types";

export function calculateBmi(vitals: Pick<Vitals, "weight" | "height">): number | null {
  if (!vitals.weight || !vitals.height) return null;
  return Math.round((vitals.weight / (vitals.height / 100) ** 2) * 10) / 10;
}

export function bmiCategory(bmi: number | null): string {
  if (bmi === null) return "";
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

/** Display pairs used by the consultation screen, print and PDF. */
export function vitalsSummary(vitals: Vitals): [string, string][] {
  const bmi = calculateBmi(vitals);
  return [
    ["BP", vitals.bpSystolic && vitals.bpDiastolic ? `${vitals.bpSystolic}/${vitals.bpDiastolic} mmHg` : "—"],
    ["Pulse", vitals.pulse ? `${vitals.pulse} bpm` : "—"],
    ["Temp", vitals.temperature ? `${vitals.temperature} °F` : "—"],
    ["SpO2", vitals.spo2 ? `${vitals.spo2}%` : "—"],
    ["Resp. rate", vitals.respiratoryRate ? `${vitals.respiratoryRate}/min` : "—"],
    ["Weight", vitals.weight ? `${vitals.weight} kg` : "—"],
    ["Height", vitals.height ? `${vitals.height} cm` : "—"],
    ["BMI", bmi ? `${bmi} (${bmiCategory(bmi)})` : "—"],
  ];
}

import { Metadata } from "next";
import { RiskAssessmentTester } from "./RiskAssessmentTester";

export const metadata: Metadata = {
  title: "Risk Assessment Tester",
  description: "Test the AI model with manual vitals input",
};

export default function RiskTesterPage() {
  return <RiskAssessmentTester />;
}

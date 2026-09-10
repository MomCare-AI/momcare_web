"use client";

import { useState } from "react";

interface VitalsInput {
  age: string;
  systolic_bp: string;
  diastolic_bp: string;
  body_temp_f: string;
  heart_rate: string;
  hemoglobin: string;
  blood_glucose: string;
  stress_score: string;
  phys_activity_score: string;
  source: "device" | "manual";
  pregnancy_id: string;
}

interface RiskResult {
  risk_level: string;
  final_risk_level: string;
  confidence: number;
  bp_category: string;
  heart_rate_category: string;
  temperature_category: string;
  glucose_category: string;
  hemoglobin_category: string;
  flagged_for_review: boolean;
}

export function RiskAssessmentTester() {
  const [vitals, setVitals] = useState<VitalsInput>({
    age: "",
    systolic_bp: "",
    diastolic_bp: "",
    body_temp_f: "",
    heart_rate: "",
    hemoglobin: "",
    blood_glucose: "",
    stress_score: "",
    phys_activity_score: "",
    source: "manual",
    pregnancy_id: "",
  });

  const [result, setResult] = useState<RiskResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setVitals((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const pregnancyId = vitals.pregnancy_id || "test-pregnancy-demo";

      if (!pregnancyId.trim()) {
        setError("Please enter a pregnancy ID or test with demo");
        setLoading(false);
        return;
      }

      // Prepare vitals for API (filter out empty values and pregnancy_id)
      const vitalsData: {
        source: string;
        recorded_at: string;
        age?: number;
        systolic_bp?: number;
        diastolic_bp?: number;
        body_temp_f?: number;
        heart_rate?: number;
        hemoglobin?: number;
        blood_glucose?: number;
        stress_score?: number;
        phys_activity_score?: number;
      } = {
        source: vitals.source,
        recorded_at: new Date().toISOString(),
      };

      // Add vitals that have values
      if (vitals.age) vitalsData.age = parseFloat(vitals.age);
      if (vitals.systolic_bp)
        vitalsData.systolic_bp = parseFloat(vitals.systolic_bp);
      if (vitals.diastolic_bp)
        vitalsData.diastolic_bp = parseFloat(vitals.diastolic_bp);
      if (vitals.body_temp_f)
        vitalsData.body_temp_f = parseFloat(vitals.body_temp_f);
      if (vitals.heart_rate)
        vitalsData.heart_rate = parseFloat(vitals.heart_rate);
      if (vitals.hemoglobin)
        vitalsData.hemoglobin = parseFloat(vitals.hemoglobin);
      if (vitals.blood_glucose)
        vitalsData.blood_glucose = parseFloat(vitals.blood_glucose);
      if (vitals.stress_score)
        vitalsData.stress_score = parseFloat(vitals.stress_score);
      if (vitals.phys_activity_score)
        vitalsData.phys_activity_score = parseFloat(vitals.phys_activity_score);

      // Call the API
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/pregnancies/${pregnancyId}/readings/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          body: JSON.stringify(vitalsData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.detail || "Failed to record reading");
        setLoading(false);
        return;
      }

      await response.json();

      // Now fetch the full risk assessment
      const riskResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/pregnancies/${pregnancyId}/risk/`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );

      if (riskResponse.ok) {
        const riskData = await riskResponse.json();
        const current = riskData.current;
        setResult({
          risk_level: current.risk_level || "N/A",
          final_risk_level: current.final_risk_level || "N/A",
          confidence: current.confidence || 0,
          bp_category: current.bp_category || "Not recorded",
          heart_rate_category: current.heart_rate_category || "Not recorded",
          temperature_category: current.temperature_category || "Not recorded",
          glucose_category: current.glucose_category || "Not recorded",
          hemoglobin_category: current.hemoglobin_category || "Not recorded",
          flagged_for_review: current.flagged_for_review || false,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Risk Assessment Tester
          </h1>
          <p className="text-gray-600">
            Manually input vitals to test the AI risk prediction model
          </p>
          <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-800">
              ⚠️ <strong>Testing Only:</strong> This is for model verification
              purposes only. Results are not for clinical decisions.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Input Vitals
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Pregnancy ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pregnancy ID (optional for testing)
                </label>
                <input
                  type="text"
                  name="pregnancy_id"
                  value={vitals.pregnancy_id}
                  onChange={handleInputChange}
                  placeholder="Leave empty to test with demo patient"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>

              {/* Source */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Source <span className="text-red-500">*</span>
                </label>
                <select
                  name="source"
                  value={vitals.source}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="manual">Manual</option>
                  <option value="device">Device</option>
                </select>
              </div>

              {/* Vitals Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={vitals.age}
                    onChange={handleInputChange}
                    placeholder="Years"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Systolic BP
                  </label>
                  <input
                    type="number"
                    name="systolic_bp"
                    value={vitals.systolic_bp}
                    onChange={handleInputChange}
                    placeholder="mmHg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Diastolic BP
                  </label>
                  <input
                    type="number"
                    name="diastolic_bp"
                    value={vitals.diastolic_bp}
                    onChange={handleInputChange}
                    placeholder="mmHg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Temperature (°F)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="body_temp_f"
                    value={vitals.body_temp_f}
                    onChange={handleInputChange}
                    placeholder="Fahrenheit"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Heart Rate
                  </label>
                  <input
                    type="number"
                    name="heart_rate"
                    value={vitals.heart_rate}
                    onChange={handleInputChange}
                    placeholder="BPM"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hemoglobin
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="hemoglobin"
                    value={vitals.hemoglobin}
                    onChange={handleInputChange}
                    placeholder="g/dL"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Blood Glucose
                  </label>
                  <input
                    type="number"
                    name="blood_glucose"
                    value={vitals.blood_glucose}
                    onChange={handleInputChange}
                    placeholder="mg/dL"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stress Score
                  </label>
                  <input
                    type="number"
                    name="stress_score"
                    value={vitals.stress_score}
                    onChange={handleInputChange}
                    placeholder="0-10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Physical Activity Score
                  </label>
                  <input
                    type="number"
                    name="phys_activity_score"
                    value={vitals.phys_activity_score}
                    onChange={handleInputChange}
                    placeholder="0-10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-medium disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Testing..." : "Run Risk Assessment"}
              </button>
            </form>
          </div>

          {/* Results */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Results
            </h2>

            {result ? (
              <div className="space-y-4">
                {/* Main Risk Level */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">
                    AI Model Prediction
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">
                        Raw Model Output
                      </p>
                      <div
                        className={`mt-2 px-3 py-2 rounded-md font-semibold text-center ${getRiskColor(result.risk_level)}`}
                      >
                        {result.risk_level}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">
                        Final Risk Level
                      </p>
                      <div
                        className={`mt-2 px-3 py-2 rounded-md font-semibold text-center ${getRiskColor(result.final_risk_level)}`}
                      >
                        {result.final_risk_level}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Confidence */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Model Confidence</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${(result.confidence || 0) * 100}%` }}
                      />
                    </div>
                    <span className="text-lg font-bold text-gray-900 w-16">
                      {((result.confidence || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Review Flag */}
                {result.flagged_for_review && (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded">
                    <p className="text-sm text-orange-800">
                      ⚠️ <strong>Flagged for Review:</strong> Confidence below
                      threshold - clinician review recommended
                    </p>
                  </div>
                )}

                {/* Clinical Categories */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-xs text-gray-600 uppercase mb-1">
                      BP Category
                    </p>
                    <p className="font-semibold">{result.bp_category || "—"}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-xs text-gray-600 uppercase mb-1">
                      Heart Rate
                    </p>
                    <p className="font-semibold">
                      {result.heart_rate_category || "—"}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-xs text-gray-600 uppercase mb-1">
                      Temperature
                    </p>
                    <p className="font-semibold">
                      {result.temperature_category || "—"}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-xs text-gray-600 uppercase mb-1">
                      Glucose
                    </p>
                    <p className="font-semibold">
                      {result.glucose_category || "—"}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded col-span-2">
                    <p className="text-xs text-gray-600 uppercase mb-1">
                      Hemoglobin
                    </p>
                    <p className="font-semibold">
                      {result.hemoglobin_category || "—"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>Submit vitals to see AI model predictions</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

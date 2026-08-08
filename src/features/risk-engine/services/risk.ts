export function getRiskColor(risk: "low" | "medium" | "high") {
  return {
    low: "green",
    medium: "amber",
    high: "red",
  }[risk]
}

export function getRiskLabel(risk: "low" | "medium" | "high") {
  return {
    low: "Low Risk",
    medium: "Medium Risk",
    high: "High Risk",
  }[risk]
}

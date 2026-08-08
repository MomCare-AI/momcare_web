export interface InventoryItem {
  id: string
  bandSerialNumber: string
  assignedPatientId: string | null
  zone: string
  status: "active" | "unassigned" | "returned"
}

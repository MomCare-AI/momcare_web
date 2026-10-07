/** The landing page FAQ, shared by the visible carousel and the FAQPage
 *  structured data so the two can never disagree. */
export const FAQS = [
  {
    id: "faq-1",
    question: "How is patient data kept scoped to one hospital?",
    answer:
      "Every request is scoped to your hospital in application code before it ever reaches a query. A database-level second layer — Postgres row-level security — is enforced in production, so even a missed check in application code returns no other hospital's rows. We don't claim HIPAA or ISO 27001 certification; neither has been audited.",
  },
  {
    id: "faq-2",
    question:
      "Can MomCare integrate with our existing EMR or clinic workflows?",
    answer:
      "Not yet. MomCare is a REST API and web portal that a hospital's own staff use directly — there's no EMR/EHR integration built, and it isn't on the near-term roadmap.",
  },
  {
    id: "faq-3",
    question: "Does MomCare cover postpartum care, or only pregnancy?",
    answer:
      "Pregnancy monitoring only, today — vitals, risk scoring, and escalation through delivery. Postpartum monitoring isn't built yet.",
  },
  {
    id: "faq-4",
    question: "How are emergency escalations handled by the platform?",
    answer:
      "An abnormal reading is sorted into a risk tier the moment it arrives and reaches the assigned clinician first. If nobody responds inside that tier's deadline, it escalates to the hospital's admin next — every step written to an append-only audit trail, checked by a scheduled job every minute.",
  },
  {
    id: "faq-5",
    question: "Does MomCare require special hardware?",
    answer:
      "No shipped hardware kit. A reading comes from a wearable or monitoring device your hospital already has, or is entered directly by staff — either way, it's scored the moment it arrives.",
  },
];

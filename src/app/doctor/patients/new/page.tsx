import PatientRegistrationWizard from '@/components/clinical/PatientRegistrationWizard'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Register Patient | MomCare Clinical Portal',
}

export default function NewPatientPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/doctor"
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors duration-150 hover:text-pine"
      >
        <ArrowLeft size={15} />
        Back to Dashboard
      </Link>

      <PatientRegistrationWizard />
    </div>
  )
}

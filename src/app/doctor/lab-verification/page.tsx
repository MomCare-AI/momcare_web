import LabVerificationSplitView from '@/components/clinical/LabVerificationSplitView'

export const metadata = {
  title: 'Lab Verification | MomCare Clinical Portal',
}

export default function LabVerificationPage() {
  return (
    // Removing the default page padding to let the split view take full height
    <div className="-m-6 h-[calc(100vh-64px)]">
      <LabVerificationSplitView reportId="mock-report-123" />
    </div>
  )
}

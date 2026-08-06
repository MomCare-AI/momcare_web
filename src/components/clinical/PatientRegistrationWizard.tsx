'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  User,
  MapPin,
  FileText,
  Activity,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Check,
  CloudUpload,
  Eye,
  EyeOff,
} from 'lucide-react'
import { useToast } from '@/components/ui/useToast'

// Zod Schema mapping directly to the legacy RPM fields requested by user
const registrationSchema = z
  .object({
    // Step 1: Account
    firstName: z.string().min(2, 'First name is required'),
    lastName: z.string().min(2, 'Last name is required'),
    username: z.string().min(4, 'Username is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    gender: z.enum(['Male', 'Female', 'Other']),
    primaryPhone: z.string().min(10, 'Valid phone number is required'),

    // Step 2: Additional
    address1: z.string().min(5, 'Address is required'),
    address2: z.string().optional(),
    city: z.string().min(2, 'City is required'),
    postalCode: z.string().min(4, 'Postal code is required'),
    state: z.string().min(2, 'State is required'),
    provider: z.string().min(2, 'Provider is required'),
    secondaryProvider: z.string().optional(),
    nurse: z.string().optional(),
    rpmDiagnosis: z.string().optional(),

    // Step 3: Consents
    consentFormCheck: z.boolean().default(false),
    doctorNotesCheck: z.boolean().default(false),

    rpmConsent1: z
      .boolean()
      .refine((val) => val === true, { message: 'Must acknowledge device receipt' }),
    rpmConsent2: z
      .boolean()
      .refine((val) => val === true, { message: 'Must acknowledge property terms' }),
    rpmConsent3: z
      .boolean()
      .refine((val) => val === true, { message: 'Must agree to monthly check-in' }),
    rpmConsent4: z
      .boolean()
      .refine((val) => val === true, { message: 'Must acknowledge non-emergency' }),
    verbalConsent: z
      .boolean()
      .refine((val) => val === true, { message: 'Verbal consent required' }),

    // Step 4: Bounds
    glucoseMin: z.coerce.number().min(50).max(100),
    glucoseMax: z.coerce.number().min(100).max(300),
    sysMin: z.coerce.number().min(70).max(120),
    sysMax: z.coerce.number().min(100).max(180),
    diaMin: z.coerce.number().min(40).max(80),
    diaMax: z.coerce.number().min(70).max(120),
    hrMin: z.coerce.number().min(40).max(80),
    hrMax: z.coerce.number().min(80).max(150),

    // Initial Baselines
    initialSys: z.string().optional(),
    initialDia: z.string().optional(),
    initialHr: z.string().optional(),
    initialWeight: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type RegistrationFormData = z.infer<typeof registrationSchema>

const STEPS = [
  { id: 1, title: 'Patient Account', subtitle: 'Basic Information', icon: User },
  { id: 2, title: 'Additional Details', subtitle: 'Location & Providers', icon: MapPin },
  { id: 3, title: 'Consents', subtitle: 'RPM Agreements', icon: FileText },
  { id: 4, title: 'Data Bounds', subtitle: 'Patient Thresholds', icon: Activity },
]

export default function PatientRegistrationWizard() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // UI states
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    formState: { errors },
  } = useForm<RegistrationFormData>({
    // zod v4's resolver output and react-hook-form's expected Resolver
    // type disagree specifically on z.coerce.number().optional() fields
    // (resolver infers `unknown`, react-hook-form expects
    // `number | undefined`) - a known cross-library generic mismatch,
    // not something fixable by typing this call site more precisely.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(registrationSchema) as any,
    mode: 'onChange',
    defaultValues: {
      gender: 'Male',
      glucoseMin: 70,
      glucoseMax: 130,
      sysMin: 95,
      sysMax: 170,
      diaMin: 45,
      diaMax: 105,
      hrMin: 50,
      hrMax: 100,
      consentFormCheck: true,
    },
  })

  // Watchers for custom UI logic
  const rpm1 = watch('rpmConsent1')
  const rpm2 = watch('rpmConsent2')
  const rpm3 = watch('rpmConsent3')
  const rpm4 = watch('rpmConsent4')
  const rpmVerbal = watch('verbalConsent')
  const consentFormCheck = watch('consentFormCheck')
  const doctorNotesCheck = watch('doctorNotesCheck')

  async function onNextStep() {
    let fieldsToValidate: (keyof RegistrationFormData)[] = []

    if (currentStep === 1) {
      fieldsToValidate = [
        'firstName',
        'lastName',
        'username',
        'email',
        'password',
        'confirmPassword',
        'gender',
        'primaryPhone',
      ]
    } else if (currentStep === 2) {
      fieldsToValidate = [
        'address1',
        'address2',
        'city',
        'postalCode',
        'state',
        'provider',
        'secondaryProvider',
        'nurse',
        'rpmDiagnosis',
      ]
    } else if (currentStep === 3) {
      fieldsToValidate = [
        'rpmConsent1',
        'rpmConsent2',
        'rpmConsent3',
        'rpmConsent4',
        'verbalConsent',
      ]
    }

    const isValid = await trigger(fieldsToValidate)
    if (isValid) {
      setCurrentStep((s) => Math.min(s + 1, 4))
    }
  }

  function onPrevStep() {
    setCurrentStep((s) => Math.max(s - 1, 1))
  }

  const [createdPatientId, setCreatedPatientId] = useState<string | null>(null)

  async function onSubmit(data: RegistrationFormData) {
    if (currentStep < 4) {
      onNextStep()
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          phone_number: data.primaryPhone,
          full_name: `${data.firstName} ${data.lastName}`,
          age: null, // Add to form if needed
          city: data.city,
          blood_group: null, // Add to form if needed
          gestational_week: null, // Add to form if needed
          address1: data.address1,
          address2: data.address2,
          state: data.state,
          postal_code: data.postalCode,
          provider_name: data.provider,
          secondary_provider: data.secondaryProvider,
          nurse_name: data.nurse,
          rpm_diagnosis: data.rpmDiagnosis,
          rpm_consents: {
            consentFormCheck: data.consentFormCheck,
            doctorNotesCheck: data.doctorNotesCheck,
            rpmConsent1: data.rpmConsent1,
            rpmConsent2: data.rpmConsent2,
            rpmConsent3: data.rpmConsent3,
            rpmConsent4: data.rpmConsent4,
            verbalConsent: data.verbalConsent,
          },
          glucose_min: data.glucoseMin,
          glucose_max: data.glucoseMax,
          sys_min: data.sysMin,
          sys_max: data.sysMax,
          dia_min: data.diaMin,
          dia_max: data.diaMax,
          hr_min: data.hrMin,
          hr_max: data.hrMax,
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to create patient')
      }

      const patientData = await response.json()
      setCreatedPatientId(patientData.id)
      setCurrentStep(5) // Move to success screen
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      toast({
        title: 'Registration Failed',
        description: message,
        type: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (currentStep < 4) {
        onNextStep()
      }
    }
  }

  // Helper for styling inputs uniformly
  const inputClass =
    'w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-ink outline-none transition-all duration-200 placeholder:text-ink-muted/50 hover:border-pine/50 focus:border-pine focus:ring-4 focus:ring-pine-wash/50'

  return (
    <div className="flex min-h-[700px] w-full overflow-hidden rounded-2xl border border-line bg-surface shadow-sm lg:flex-row flex-col">
      {/* Left Sidebar - Progress */}
      <div className="flex w-full flex-col bg-[var(--color-pine-deep)] p-8 lg:w-72 lg:p-12 relative overflow-hidden">
        {/* Decorative circle */}
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-surface/5 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <h2 className="mb-10 font-display text-2xl font-bold text-surface tracking-wide">
            New Patient
          </h2>

          <div className="space-y-6">
            {STEPS.map((step) => {
              const isCompleted = currentStep > step.id
              const isCurrent = currentStep === step.id
              const Icon = step.icon

              return (
                <div key={step.id} className="group relative flex items-start gap-4">
                  {step.id !== STEPS.length && (
                    <div
                      className={`absolute left-[19px] top-10 h-full w-px transition-colors duration-500 ${
                        isCompleted ? 'bg-[var(--color-sage)]' : 'bg-surface/10'
                      }`}
                    />
                  )}

                  <div
                    className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-500 ${
                      isCompleted
                        ? 'border-[var(--color-sage)] bg-[var(--color-sage)] text-pine-deep'
                        : isCurrent
                          ? 'border-surface bg-transparent text-surface shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                          : 'border-surface/20 bg-transparent text-surface/40'
                    }`}
                  >
                    {isCompleted ? (
                      <Check size={18} strokeWidth={3} className="animate-in zoom-in" />
                    ) : (
                      <Icon size={18} strokeWidth={isCurrent ? 2.5 : 2} />
                    )}
                  </div>

                  <div className="pt-2">
                    <h3
                      className={`text-sm font-bold tracking-wide transition-colors duration-300 ${
                        isCurrent || isCompleted ? 'text-surface' : 'text-surface/40'
                      }`}
                    >
                      {step.title}
                    </h3>
                    <p
                      className={`text-xs transition-colors duration-300 ${
                        isCurrent ? 'text-surface/70' : 'text-surface/30'
                      }`}
                    >
                      {step.subtitle}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Right Content - Form */}
      <div className="flex flex-1 flex-col bg-panel relative">
        <form
          onSubmit={handleSubmit(onSubmit)}
          onKeyDown={handleKeyDown}
          className="flex h-full flex-col"
        >
          <div className="flex-1 overflow-y-auto p-8 lg:p-12">
            {/* STEP 1: ACCOUNT INFORMATION */}
            {currentStep === 1 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500 fill-mode-both">
                <div className="mb-8">
                  <h3 className="font-display text-2xl font-semibold text-pine">
                    Basic Patient Information
                  </h3>
                  <p className="mt-1 text-sm text-ink-muted">
                    Create the patient&apos;s account credentials and profile.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-pine">
                        First Name
                      </label>
                      <input
                        {...register('firstName')}
                        className={inputClass}
                        placeholder="First Name"
                      />
                      {errors.firstName && (
                        <p className="mt-1.5 text-xs text-[var(--color-clay)]">
                          {errors.firstName.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-pine">
                        Last Name
                      </label>
                      <input
                        {...register('lastName')}
                        className={inputClass}
                        placeholder="Last Name"
                      />
                      {errors.lastName && (
                        <p className="mt-1.5 text-xs text-[var(--color-clay)]">
                          {errors.lastName.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-pine">
                        Username
                      </label>
                      <input
                        {...register('username')}
                        className={inputClass}
                        placeholder="Username"
                      />
                      {errors.username && (
                        <p className="mt-1.5 text-xs text-[var(--color-clay)]">
                          {errors.username.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-pine">Email</label>
                      <input
                        type="email"
                        {...register('email')}
                        className={inputClass}
                        placeholder="user@example.com"
                      />
                      {errors.email && (
                        <p className="mt-1.5 text-xs text-[var(--color-clay)]">
                          {errors.email.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-pine">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          {...register('password')}
                          className={inputClass}
                          placeholder="Enter your password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-2.5 text-ink-muted hover:text-pine"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      <p className="mt-1.5 text-xs text-ink-muted">
                        Must be at least 8 characters long
                      </p>
                      {errors.password && (
                        <p className="mt-1 text-xs text-[var(--color-clay)]">
                          {errors.password.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-pine">Gender</label>
                      <select {...register('gender')} className={inputClass}>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-pine">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          {...register('confirmPassword')}
                          className={inputClass}
                          placeholder="Enter your password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-2.5 text-ink-muted hover:text-pine"
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="mt-1 text-xs text-[var(--color-clay)]">
                          {errors.confirmPassword.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-pine">
                        Primary Phone
                      </label>
                      <input
                        {...register('primaryPhone')}
                        maxLength={15}
                        className={inputClass}
                        placeholder="+1234567890"
                      />
                      {errors.primaryPhone && (
                        <p className="mt-1.5 text-xs text-[var(--color-clay)]">
                          {errors.primaryPhone.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: ADDITIONAL INFORMATION */}
            {currentStep === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500 fill-mode-both">
                <div className="mb-8">
                  <h3 className="font-display text-2xl font-semibold text-pine">
                    Additional Patient Information
                  </h3>
                  <p className="mt-1 text-sm text-ink-muted">Address and provider assignments.</p>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-pine">
                        Address Line 1
                      </label>
                      <input
                        {...register('address1')}
                        className={inputClass}
                        placeholder="Address Line 1"
                      />
                      {errors.address1 && (
                        <p className="mt-1.5 text-xs text-[var(--color-clay)]">
                          {errors.address1.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-pine">
                        Address Line 2
                      </label>
                      <input
                        {...register('address2')}
                        className={inputClass}
                        placeholder="Address Line 2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-pine">City</label>
                      <input {...register('city')} className={inputClass} placeholder="City" />
                      {errors.city && (
                        <p className="mt-1.5 text-xs text-[var(--color-clay)]">
                          {errors.city.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-pine">
                        Postal Code
                      </label>
                      <input
                        {...register('postalCode')}
                        className={inputClass}
                        placeholder="72000"
                      />
                      {errors.postalCode && (
                        <p className="mt-1.5 text-xs text-[var(--color-clay)]">
                          {errors.postalCode.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-pine">State</label>
                      <select {...register('state')} className={inputClass}>
                        <option value="">Select a state</option>
                        <option value="NY">New York</option>
                        <option value="CA">California</option>
                        <option value="TX">Texas</option>
                      </select>
                      {errors.state && (
                        <p className="mt-1.5 text-xs text-[var(--color-clay)]">
                          {errors.state.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-pine">
                        Provider
                      </label>
                      <select {...register('provider')} className={inputClass}>
                        <option value="">Select provider</option>
                        <option value="dr_smith">Dr. Smith</option>
                        <option value="dr_doe">Dr. Doe</option>
                      </select>
                      {errors.provider && (
                        <p className="mt-1.5 text-xs text-[var(--color-clay)]">
                          {errors.provider.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-pine">
                        Secondary Provider
                      </label>
                      <input
                        {...register('secondaryProvider')}
                        className={inputClass}
                        placeholder="Secondary Provider"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-pine">Nurse</label>
                      <select {...register('nurse')} className={inputClass}>
                        <option value="">Select Nurse</option>
                        <option value="jane">Nurse Jane</option>
                        <option value="john">Nurse John</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-pine">
                      RPM Diagnosis Codes
                    </label>
                    <input
                      {...register('rpmDiagnosis')}
                      className={inputClass}
                      placeholder="Search and select Chronic Conditions..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: CONSENTS */}
            {currentStep === 3 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500 fill-mode-both">
                <div className="mb-8">
                  <h3 className="font-display text-2xl font-semibold text-pine">
                    Consents & Documents
                  </h3>
                </div>

                <div className="mb-8 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-line bg-surface/50 p-10 hover:border-pine/50 transition-colors cursor-pointer">
                  <CloudUpload size={48} className="text-pine/40 mb-4" />
                  <p className="text-sm font-semibold text-pine mb-2">Drop File here</p>
                  <p className="text-xs text-ink-muted mb-4">(Pdf)</p>
                  <p className="text-xs text-ink-muted mb-4 text-center">Or</p>
                  <button
                    type="button"
                    className="rounded-full bg-pine-deep px-6 py-2 text-xs font-bold text-surface hover:bg-pine"
                  >
                    Browse
                  </button>
                </div>

                <div className="mb-8 flex items-center justify-center gap-12">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('consentFormCheck')}
                      className="h-4 w-4 rounded border-line text-pine accent-pine"
                    />
                    <span className="text-sm text-pine">Consent Form</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('doctorNotesCheck')}
                      className="h-4 w-4 rounded border-line text-pine accent-pine"
                    />
                    <span className="text-sm text-pine">Doctor Notes</span>
                  </label>
                </div>

                <div className="space-y-4 rounded-xl border border-line bg-surface p-6 shadow-sm">
                  {(
                    [
                      {
                        id: 'rpmConsent1',
                        text: 'I acknowledge that I am receiving at no charge the monitoring device listed below so that I can participate in the remote monitoring and/or chronic care management program.',
                      },
                      {
                        id: 'rpmConsent2',
                        text: 'The device is the property of the Doctor and is free for me to use while I participate in the program. If I discontinue participation in this program, it is my responsibility to return the device in working order. I will not intentionally tamper with any RPM device or technology used.',
                      },
                      {
                        id: 'rpmConsent3',
                        text: 'I agree to participate in at least one monthly check-in with my care manager to discuss improving my health. I agree that I will receive text messages and emails.',
                      },
                      {
                        id: 'rpmConsent4',
                        text: 'RPM services are NOT emergency services and your data WILL NOT BE MONITORED 24/7. If you think you are experiencing a medical emergency, CALL 911 IMMEDIATELY.',
                      },
                      { id: 'verbalConsent', text: 'Verbal Consent' },
                    ] satisfies { id: keyof RegistrationFormData; text: string }[]
                  ).map((consent) => (
                    <div key={consent.id}>
                      <label className="flex items-start gap-4 cursor-pointer hover:bg-surface/50 p-2 -m-2 rounded-lg transition-colors">
                        <input
                          type="checkbox"
                          {...register(consent.id)}
                          className="mt-1 h-4 w-4 shrink-0 rounded border-line text-pine accent-pine"
                        />
                        <span className="text-sm text-ink-muted leading-relaxed">
                          {consent.text}
                        </span>
                      </label>
                      {errors[consent.id] && (
                        <p className="ml-8 mt-1 text-xs text-[var(--color-clay)]">
                          {errors[consent.id]?.message}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 4: DATA BOUNDS & BASELINES */}
            {currentStep === 4 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500 fill-mode-both">
                <div className="mb-8">
                  <h3 className="font-display text-2xl font-semibold text-pine">
                    Patient Thresholds
                  </h3>
                </div>

                <div className="mb-6 grid grid-cols-2 gap-4">
                  <div className="text-center font-bold text-pine uppercase text-sm tracking-widest">
                    Low
                  </div>
                  <div className="text-center font-bold text-pine uppercase text-sm tracking-widest">
                    High
                  </div>
                </div>

                <div className="space-y-6">
                  {(
                    [
                      { label: 'Glucose', min: 'glucoseMin', max: 'glucoseMax' },
                      { label: 'Systolic', min: 'sysMin', max: 'sysMax' },
                      { label: 'Diastolic', min: 'diaMin', max: 'diaMax' },
                      { label: 'Heart Rate', min: 'hrMin', max: 'hrMax' },
                    ] satisfies {
                      label: string
                      min: keyof RegistrationFormData
                      max: keyof RegistrationFormData
                    }[]
                  ).map((item) => (
                    <div key={item.label} className="grid grid-cols-2 gap-8 relative items-center">
                      <div className="absolute -left-24 text-sm font-semibold text-pine w-20 text-right">
                        {item.label}:
                      </div>
                      <div>
                        <input type="number" {...register(item.min)} className={inputClass} />
                      </div>
                      <div>
                        <input type="number" {...register(item.max)} className={inputClass} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-12 rounded-2xl border border-line bg-surface p-6 shadow-sm">
                  <h4 className="mb-4 text-sm font-semibold text-pine">
                    Initial Baseline Reading (Optional)
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="group col-span-2 md:col-span-1">
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-pine">
                        Blood Pressure
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          {...register('initialSys')}
                          maxLength={3}
                          placeholder="Sys"
                          className={inputClass}
                        />
                        <span className="text-line">/</span>
                        <input
                          {...register('initialDia')}
                          maxLength={3}
                          placeholder="Dia"
                          className={inputClass}
                        />
                      </div>
                    </div>
                    <div className="group">
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-pine">
                        Heart Rate
                      </label>
                      <input
                        {...register('initialHr')}
                        maxLength={3}
                        placeholder="bpm"
                        className={inputClass}
                      />
                    </div>
                    <div className="group">
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-pine">
                        Weight (kg)
                      </label>
                      <input
                        {...register('initialWeight')}
                        maxLength={4}
                        placeholder="kg"
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: SUCCESS STATE */}
            {currentStep === 5 && (
              <div className="flex h-full flex-col items-center justify-center text-center animate-in zoom-in-95 fade-in duration-500 fill-mode-both py-20">
                <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[var(--color-sage)]/10 text-[var(--color-sage)]">
                  <CheckCircle2 size={48} />
                </div>
                <h3 className="mb-2 font-display text-3xl font-semibold text-pine">
                  Registration Complete!
                </h3>
                <p className="mb-8 max-w-sm text-sm leading-relaxed text-ink-muted">
                  The patient account and RPM plan have been created. An SMS with a secure download
                  link and login instructions has been sent.
                </p>

                <div className="flex flex-col gap-3 w-full max-w-xs">
                  <button
                    type="button"
                    onClick={() => router.push(`/doctor/patients/${createdPatientId}`)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-pine px-6 py-3 text-sm font-semibold text-surface shadow-md transition-all hover:bg-[var(--color-pine-deep)] hover:shadow-lg"
                  >
                    View Patient Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push('/doctor')}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-surface px-6 py-3 text-sm font-medium text-ink-muted transition-all hover:border-pine/50 hover:text-pine"
                  >
                    Return to Dashboard
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Wizard Footer (Hidden on Success Step) */}
          {currentStep < 5 && (
            <div className="flex items-center justify-between border-t border-line bg-surface/50 px-8 py-5 backdrop-blur mt-auto">
              <button
                type="button"
                onClick={onPrevStep}
                disabled={currentStep === 1 || isSubmitting}
                className="flex items-center gap-2 rounded-xl border border-line bg-surface px-5 py-2.5 text-sm font-medium text-ink-muted transition-all hover:border-pine/50 hover:text-pine disabled:opacity-30"
              >
                <ArrowLeft size={16} />
                Back
              </button>

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={onNextStep}
                  className="flex items-center gap-2 rounded-xl bg-pine px-6 py-2.5 text-sm font-medium text-surface shadow-md transition-all hover:bg-[var(--color-pine-deep)] hover:shadow-lg disabled:opacity-50 disabled:hover:shadow-none"
                >
                  Continue
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group flex items-center gap-2 rounded-xl bg-[var(--color-marigold)] px-6 py-2.5 text-sm font-bold text-pine-deep shadow-md transition-all hover:bg-[#e6a832] hover:shadow-lg disabled:opacity-50 disabled:hover:shadow-none"
                >
                  {isSubmitting ? 'Registering...' : 'Complete Registration'}
                  {!isSubmitting && (
                    <CheckCircle2
                      size={18}
                      className="transition-transform group-hover:scale-110"
                    />
                  )}
                </button>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

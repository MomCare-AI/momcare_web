'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useToast } from '@/components/ui/useToast'
import { useQueryClient } from '@tanstack/react-query'
import type { Patient } from '@/lib/types'

const updateSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  primaryPhone: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  address1: z.string().optional(),
  address2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  provider: z.string().optional(),
  nurse: z.string().optional(),
  glucoseMin: z.coerce.number().optional(),
  glucoseMax: z.coerce.number().optional(),
  sysMin: z.coerce.number().optional(),
  sysMax: z.coerce.number().optional(),
  diaMin: z.coerce.number().optional(),
  diaMax: z.coerce.number().optional(),
  hrMin: z.coerce.number().optional(),
  hrMax: z.coerce.number().optional(),
})

type UpdateFormData = z.infer<typeof updateSchema>

export default function PatientSettingsForm({ patient }: { patient: Patient }) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fullNameParts = patient.user?.full_name?.split(' ') || ['', '']
  const initialFirstName = fullNameParts[0] || ''
  const initialLastName = fullNameParts.slice(1).join(' ') || ''

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateFormData>({
    // Same known zod v4 / react-hook-form resolver mismatch as
    // PatientRegistrationWizard.tsx - see the comment there.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(updateSchema) as any,
    defaultValues: {
      firstName: initialFirstName,
      lastName: initialLastName,
      primaryPhone: patient.user?.phone_number || '',
      gender: 'Female', // As MomCare defaults to Female
      address1: patient.address1 || '',
      address2: patient.address2 || '',
      city: patient.city || '',
      state: patient.state || '',
      postalCode: patient.postal_code || '',
      provider: patient.provider_name || '',
      nurse: patient.nurse_name || '',
      glucoseMin: patient.glucose_min || 70,
      glucoseMax: patient.glucose_max || 130,
      sysMin: patient.sys_min || 95,
      sysMax: patient.sys_max || 170,
      diaMin: patient.dia_min || 45,
      diaMax: patient.dia_max || 105,
      hrMin: patient.hr_min || 50,
      hrMax: patient.hr_max || 100,
    },
  })

  async function onSubmit(data: UpdateFormData) {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/patients/${patient.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: `${data.firstName} ${data.lastName}`,
          phone_number: data.primaryPhone,
          address1: data.address1,
          address2: data.address2,
          city: data.city,
          state: data.state,
          postal_code: data.postalCode,
          provider_name: data.provider,
          nurse_name: data.nurse,
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
        throw new Error(err.error || 'Failed to update patient')
      }

      queryClient.invalidateQueries({ queryKey: ['patient', patient.id] })

      toast({
        title: 'Settings Updated',
        description: 'Patient information has been successfully updated.',
        type: 'success',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      toast({
        title: 'Update Failed',
        description: message,
        type: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputClass =
    'w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-ink outline-none transition-all duration-200 placeholder:text-ink-muted/50 hover:border-pine/50 focus:border-pine focus:ring-4 focus:ring-pine-wash/50'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* 1 Patient */}
      <div className="rounded-[10px] border border-line bg-panel p-6">
        <h3 className="mb-4 font-display text-lg font-semibold text-pine border-b border-line pb-2">
          1 Patient
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink-muted">First Name</label>
            <input type="text" {...register('firstName')} className={inputClass} />
            {errors.firstName && (
              <span className="text-xs text-[var(--color-clay)]">{errors.firstName.message}</span>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink-muted">Last Name</label>
            <input type="text" {...register('lastName')} className={inputClass} />
            {errors.lastName && (
              <span className="text-xs text-[var(--color-clay)]">{errors.lastName.message}</span>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink-muted">Phone Number</label>
            <input type="tel" {...register('primaryPhone')} className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink-muted">Gender</label>
            <select {...register('gender')} className={inputClass}>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="rounded-[10px] border border-line bg-panel p-6">
        <h3 className="mb-4 font-display text-lg font-semibold text-pine border-b border-line pb-2">
          Location & Care
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="col-span-1 sm:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold text-ink-muted">Address Line 1</label>
            <input type="text" {...register('address1')} className={inputClass} />
          </div>
          <div className="col-span-1 sm:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold text-ink-muted">Address Line 2</label>
            <input type="text" {...register('address2')} className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink-muted">City</label>
            <input type="text" {...register('city')} className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink-muted">State</label>
            <input type="text" {...register('state')} className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink-muted">Provider</label>
            <input type="text" {...register('provider')} className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink-muted">Nurse / Case Manager</label>
            <input type="text" {...register('nurse')} className={inputClass} />
          </div>
        </div>
      </div>

      {/* Thresholds */}
      <div className="rounded-[10px] border border-line bg-panel p-6">
        <h3 className="mb-4 font-display text-lg font-semibold text-pine border-b border-line pb-2">
          Vitals Thresholds
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink-muted">Sys Min</label>
            <input type="number" {...register('sysMin')} className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink-muted">Sys Max</label>
            <input type="number" {...register('sysMax')} className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink-muted">Dia Min</label>
            <input type="number" {...register('diaMin')} className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink-muted">Dia Max</label>
            <input type="number" {...register('diaMax')} className={inputClass} />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-pine px-8 py-3 text-sm font-semibold text-surface transition-colors hover:bg-pine-deep disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </form>
  )
}

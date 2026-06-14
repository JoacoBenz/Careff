'use client';

import { useState } from 'react';
import type { CarpoolPlanResult } from '@/lib/carpool';
import type { ApiErrorBody } from '@/types';

export interface PlanResponse {
  plan: CarpoolPlanResult;
  saved: boolean;
  shareToken?: string;
}

export interface CarpoolPayload {
  title: string;
  destination: string;
  drivers: { name: string; address: string; capacity: number }[];
  passengers: { name: string; address: string }[];
  coords?: Record<string, { lat: number; lon: number }>;
  country?: string;
  provincia?: string;
}

/**
 * Owns the POST /api/carpool round-trip and its loading/error/result state,
 * shared by the standalone planner and the group planner so the fetch + error
 * parsing live in one place.
 */
export function useCarpoolPlan() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PlanResponse | null>(null);

  async function submit(payload: CarpoolPayload): Promise<void> {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch('/api/carpool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body: unknown = await response.json();
      if (!response.ok) {
        setError((body as ApiErrorBody).error.message);
        return;
      }
      setResult(body as PlanResponse);
    } catch {
      setError('No se pudo calcular el plan. Revisá tu conexión e intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return { loading, error, result, submit };
}

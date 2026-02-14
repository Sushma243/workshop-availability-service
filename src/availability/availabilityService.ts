/**
 * Availability calculation: finds all slots where requested services/repairs
 * can be scheduled within 60 days, respecting business rules.
 */

import type {
  WorkshopConfig,
  Workshop,
  ScheduledJob,
  AvailableSlot,
  WorkshopAvailabilityResult,
  AvailabilityRequest,
  AvailabilityResponse,
  DayOfWeek,
} from '../domain/types';

const QUERY_DAYS = 60;

/** Build ordered list of jobs to schedule: dependencies first (services, then repairs with deps satisfied) */
function buildJobOrder(
  config: WorkshopConfig,
  requestedServiceIds: string[],
  requestedRepairIds: string[]
): Array<{ type: 'service' | 'repair'; id: string; name: string; durationHours: number }> {
  const jobs: Array<{ type: 'service' | 'repair'; id: string; name: string; durationHours: number }> = [];
  const serviceMap = new Map(config.services.map((s) => [s.id, s]));
  const repairMap = new Map(config.repairs.map((r) => [r.id, r]));

  const added = new Set<string>();

  function addService(id: string) {
    if (added.has(id)) return;
    const s = serviceMap.get(id);
    if (s) {
      jobs.push({ type: 'service', id: s.id, name: s.name, durationHours: s.durationHours });
      added.add(id);
    }
  }

  function addRepair(id: string) {
    if (added.has(id)) return;
    const r = repairMap.get(id);
    if (!r) return;
    if (r.dependency) addService(r.dependency);
    jobs.push({ type: 'repair', id: r.id, name: r.name, durationHours: r.durationHours });
    added.add(id);
  }

  requestedServiceIds.forEach(addService);
  requestedRepairIds.forEach(addRepair);
  return jobs;
}

/** Check if workshop can perform all requested services/repairs (at least one bay supports each) */
function canWorkshopFulfill(
  workshop: Workshop,
  config: WorkshopConfig,
  requestedServiceIds: string[],
  requestedRepairIds: string[]
): { canFulfill: boolean; missing: string[] } {
  const supportedServices = new Set<string>();
  const supportedRepairs = new Set<string>();
  for (const bay of workshop.bays) {
    for (const cap of bay.capabilities) {
      if (cap.type === 'service') supportedServices.add(cap.id);
      else supportedRepairs.add(cap.id);
    }
  }
  const missing: string[] = [];
  for (const id of requestedServiceIds) {
    if (!supportedServices.has(id)) {
      const s = config.services.find((x) => x.id === id);
      missing.push(s?.name ?? id);
    }
  }
  for (const id of requestedRepairIds) {
    if (!supportedRepairs.has(id)) {
      const r = config.repairs.find((x) => x.id === id);
      missing.push(r?.name ?? id);
    }
  }
  return { canFulfill: missing.length === 0, missing };
}

/** Get day of week (0-6) for a date string YYYY-MM-DD */
function getDayOfWeek(dateStr: string): DayOfWeek {
  const d = new Date(dateStr + 'T12:00:00Z');
  return d.getUTCDay() as DayOfWeek;
}

/** Try to place all jobs sequentially from (date, startHour). Jobs may use different bays; each bay has at most one job at a time; next job starts after previous ends. Returns schedule or null. */
function tryScheduleInOneBay(
  workshop: Workshop,
  config: WorkshopConfig,
  jobOrder: Array<{ type: 'service' | 'repair'; id: string; name: string; durationHours: number }>,
  startDateStr: string,
  startHour: number
): ScheduledJob[] | null {
  const schedule: ScheduledJob[] = [];
  let currentDate = new Date(startDateStr + 'T12:00:00Z');
  let currentHour = startHour;
  const endHour = workshop.workingHours.endHour;

  for (const job of jobOrder) {
    let placed = false;
    for (let dayOffset = 0; dayOffset < QUERY_DAYS && !placed; dayOffset++) {
      const dateStr = currentDate.toISOString().slice(0, 10);
      const day = getDayOfWeek(dateStr);
      if (!workshop.workingDays.includes(day)) {
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        currentHour = workshop.workingHours.startHour;
        continue;
      }
      for (const bay of workshop.bays) {
        const cap = bay.capabilities.find(
          (c) => c.type === job.type && c.id === job.id && c.days.includes(day)
        );
        if (!cap) continue;
        const jobStart = dayOffset === 0 ? currentHour : workshop.workingHours.startHour;
        if (jobStart + job.durationHours > endHour) continue;
        schedule.push({
          jobName: job.name,
          jobType: job.type,
          bayId: bay.id,
          date: dateStr,
          startHour: jobStart,
          endHour: jobStart + job.durationHours,
          duration: job.durationHours,
        });
        currentDate = new Date(dateStr + 'T12:00:00Z');
        currentHour = jobStart + job.durationHours;
        if (currentHour >= endHour) {
          currentDate.setUTCDate(currentDate.getUTCDate() + 1);
          currentHour = workshop.workingHours.startHour;
        }
        placed = true;
        break;
      }
      if (!placed) {
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        currentHour = workshop.workingHours.startHour;
      }
    }
    if (!placed) return null;
  }
  return schedule;
}

/** Generate all possible start dates in the 60-day window for a workshop's working days */
function* iterStartDates(startDate: Date, workshop: Workshop): Generator<string> {
  const end = new Date(startDate);
  end.setDate(end.getDate() + QUERY_DAYS);
  const d = new Date(startDate);
  while (d < end) {
    const day = d.getUTCDay() as DayOfWeek;
    if (workshop.workingDays.includes(day)) {
      yield d.toISOString().slice(0, 10);
    }
    d.setUTCDate(d.getUTCDate() + 1);
  }
}

/** Build slot from schedule: checkIn = first job start, checkOut = last job end, totalDays span */
function scheduleToSlot(
  schedule: ScheduledJob[],
  _workshop: Workshop
): AvailableSlot {
  if (schedule.length === 0) {
    throw new Error('Empty schedule');
  }
  const first = schedule[0];
  const last = schedule[schedule.length - 1];
  const checkIn = `${first.date}T${String(first.startHour).padStart(2, '0')}:00`;
  const checkOut = `${last.date}T${String(last.endHour).padStart(2, '0')}:00`;
  const totalWorkHours = schedule.reduce((s, j) => s + j.duration, 0);
  const firstD = new Date(first.date + 'T00:00:00Z');
  const lastD = new Date(last.date + 'T00:00:00Z');
  const totalDays = Math.max(1, Math.round((lastD.getTime() - firstD.getTime()) / (24 * 60 * 60 * 1000)) + 1);
  return {
    checkIn,
    checkOut,
    totalWorkHours,
    totalDays,
    schedule,
  };
}

/** Compute all available slots for one workshop */
function computeWorkshopSlots(
  workshop: Workshop,
  config: WorkshopConfig,
  jobOrder: Array<{ type: 'service' | 'repair'; id: string; name: string; durationHours: number }>,
  periodStart: Date
): AvailableSlot[] {
  const slots: AvailableSlot[] = [];
  const seen = new Set<string>(); // dedupe by checkIn+checkOut or by schedule fingerprint

  for (const startDateStr of iterStartDates(periodStart, workshop)) {
    const startHour = workshop.workingHours.startHour;
    const schedule = tryScheduleInOneBay(workshop, config, jobOrder, startDateStr, startHour);
    if (!schedule) continue;
    const slot = scheduleToSlot(schedule, workshop);
    const key = slot.checkIn + '|' + slot.checkOut;
    if (seen.has(key)) continue;
    seen.add(key);
    slots.push(slot);
  }

  return slots;
}

export function computeAvailability(
  config: WorkshopConfig,
  request: AvailabilityRequest,
  periodStart: Date = new Date()
): AvailabilityResponse {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const startDate = new Date(periodStart);
  startDate.setUTCHours(0, 0, 0, 0);
  // If periodStart is in the past, start from today so we don't return past slots
  if (startDate.getTime() < today.getTime()) {
    startDate.setTime(today.getTime());
  }
  const endDate = new Date(startDate);
  endDate.setUTCDate(endDate.getUTCDate() + QUERY_DAYS - 1); // 60-day period: day 0..59

  const services = request.services ?? [];
  const repairs = request.repairs ?? [];
  const jobOrder = buildJobOrder(config, services, repairs);
  const totalRequestedHours = jobOrder.reduce((s, j) => s + j.durationHours, 0);

  const results: WorkshopAvailabilityResult[] = [];

  for (const workshop of config.workshops) {
    const { canFulfill, missing } = canWorkshopFulfill(
      workshop,
      config,
      services,
      repairs
    );
    const availableSlots = canFulfill
      ? computeWorkshopSlots(workshop, config, jobOrder, startDate)
      : [];
    results.push({
      workshopId: workshop.id,
      workshopName: workshop.name,
      canFulfillRequest: canFulfill,
      ...(missing.length > 0 && { missingServicesOrRepairs: missing }),
      availableSlots,
    });
  }

  return {
    success: true,
    request: {
      services,
      repairs,
      totalRequestedHours,
      startDate: startDate.toISOString().slice(0, 10),
      endDate: endDate.toISOString().slice(0, 10),
    },
    results,
  };
}

/**
 * Domain types for the Workshop Availability Service.
 * Reflects real-world fleet maintenance concepts.
 */

/** Day of week: 0 = Sunday, 1 = Monday, ... 6 = Saturday */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface ServiceDef {
  id: string;
  name: string;
  durationHours: number;
}

export interface RepairDef {
  id: string;
  name: string;
  durationHours: number;
  /** Service id that must be completed before this repair (optional) */
  dependency: string | null;
}

export interface BayCapability {
  type: 'service' | 'repair';
  id: string;
  /** Days of week when this bay can perform this job (0-6) */
  days: DayOfWeek[];
}

export interface Bay {
  id: string;
  capabilities: BayCapability[];
}

export interface WorkingHours {
  startHour: number;
  endHour: number;
}

export interface Workshop {
  id: string;
  name: string;
  workingHours: WorkingHours;
  workingDays: DayOfWeek[];
  bays: Bay[];
}

export interface WorkshopConfig {
  services: ServiceDef[];
  repairs: RepairDef[];
  workshops: Workshop[];
}

/** A single job in a schedule (service or repair) */
export interface ScheduledJob {
  jobName: string;
  jobType: 'service' | 'repair';
  bayId: string;
  date: string; // YYYY-MM-DD
  startHour: number;
  endHour: number;
  duration: number;
}

/** An available slot: one way to fulfill the request at a workshop */
export interface AvailableSlot {
  checkIn: string;  // ISO datetime
  checkOut: string; // ISO datetime
  totalWorkHours: number;
  totalDays: number;
  schedule: ScheduledJob[];
}

/** Result for one workshop */
export interface WorkshopAvailabilityResult {
  workshopId: string;
  workshopName: string;
  canFulfillRequest: boolean;
  missingServicesOrRepairs?: string[];
  availableSlots: AvailableSlot[];
}

/** Request body for availability query */
export interface AvailabilityRequest {
  services: string[];
  repairs: string[];
}

/** Request summary in the API response */
export interface RequestSummary {
  services: string[];
  repairs: string[];
  totalRequestedHours: number;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

/** Full availability API response */
export interface AvailabilityResponse {
  success: true;
  request: RequestSummary;
  results: WorkshopAvailabilityResult[];
}

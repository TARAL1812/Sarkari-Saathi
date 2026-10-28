import { z } from 'zod';
import { isHttpUrl } from '../utils/validation.js';

const text = (max, label) =>
  z.string().trim().max(max, `${label} must be ${max} characters or fewer.`).optional().default('');

const webUrl = (label) =>
  z.string().trim().max(500, `${label} is too long.`)
    .refine((value) => value === '' || isHttpUrl(value), `${label} must start with http:// or https://`)
    .optional()
    .default('');

function isRealDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function notAfterTomorrow(value) {
  const limit = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return value <= limit;
}

const isoDate = z.string().trim()
  .refine((value) => value === '' || isRealDate(value), 'Use a valid date (YYYY-MM-DD).')
  .refine((value) => !isRealDate(value) || notAfterTomorrow(value), 'Last verified date cannot be in the future.')
  .optional()
  .default('');

const stringList = (label) =>
  z.preprocess(
    (value) => (Array.isArray(value)
      ? value.map((item) => (typeof item === 'string' ? item.trim() : item)).filter((item) => item !== '')
      : value),
    z.array(z.string().max(200, `Each ${label} must be 200 characters or fewer.`))
      .max(30, `Add at most 30 ${label} entries per step.`)
      .optional()
      .default([]),
  );

const branchSchema = z.object({
  question: z.string().trim().min(1, 'Decision question is required.').max(300, 'Question is too long.'),
  yes: text(300, 'YES path'),
  no: text(300, 'NO path'),
});

export const stepSchema = z.object({
  id: z.string().max(80).optional(),
  title: z.string({ required_error: 'Step title is required.' }).trim().min(1, 'Step title is required.').max(150),
  description: text(2000, 'Description'),
  requiredDocuments: stringList('document'),
  location: text(200, 'Location'),
  responsibleOrganization: text(200, 'Responsible organization'),
  estimatedTime: z.string().trim().max(100).optional().default('Not provided'),
  possibleFee: z.string().trim().max(200).optional().default('Not provided'),
  whatHappensNext: text(1000, 'What happens next'),
  commonProblems: stringList('problem'),
  officialSource: webUrl('Official source'),
  branch: branchSchema.nullable().optional().default(null),
});

const stepsField = z.array(stepSchema, { required_error: 'Add at least one step.' })
  .min(1, 'Add at least one step.')
  .max(50, 'A journey can have at most 50 steps.');

export const officialJourneySchema = z.object({
  title: z.string({ required_error: 'Journey name is required.' }).trim().min(3).max(150),
  category: z.string({ required_error: 'Choose a category.' }).trim().min(1).max(80),
  country: text(80, 'Country'),
  region: text(100, 'Region'),
  description: text(2000, 'Description'),
  targetUser: text(200, 'Target user'),
  organizationName: text(200, 'Organization name'),
  department: text(200, 'Department'),
  officialWebsite: webUrl('Official website'),
  sourceUrl: webUrl('Source URL'),
  verificationStatus: z.enum(['demo', 'unverified', 'pending', 'verified']).optional().default('unverified'),
  lastVerified: isoDate,
  location: text(200, 'Location'),
  steps: stepsField,
}).superRefine((journey, ctx) => {
  if (journey.verificationStatus === 'verified') {
    if (!journey.lastVerified) {
      ctx.addIssue({ code: 'custom', path: ['lastVerified'], message: 'A verified journey needs the date it was last verified.' });
    }
    if (!journey.sourceUrl && !journey.officialWebsite) {
      ctx.addIssue({ code: 'custom', path: ['sourceUrl'], message: 'A verified journey needs a source URL or official website.' });
    }
  }
});

export const personalJourneySchema = z.object({
  title: z.string({ required_error: 'Journey name is required.' }).trim().min(3).max(150),
  category: z.string({ required_error: 'Choose a category.' }).trim().min(1).max(80),
  country: text(80, 'Country'),
  region: text(100, 'Region'),
  description: text(2000, 'Description'),
  targetUser: text(200, 'Target user'),
  organizationName: text(200, 'Organization name'),
  department: text(200, 'Department'),
  officialWebsite: webUrl('Official website'),
  sourceUrl: webUrl('Source URL'),
  location: text(200, 'Location'),
  steps: stepsField,
});

export const cloneJourneySchema = z.object({
  sourceJourneyId: z.string().min(1),
}).strict();

export const createPersonalSchema = z.union([cloneJourneySchema, personalJourneySchema]);

export const statusSchema = z.object({
  status: z.enum(['draft', 'published', 'archived'], { errorMap: () => ({ message: 'Status must be draft, published, or archived.' }) }),
});

export const categorySchema = z.object({
  id: z.string({ required_error: 'Category name is required.' }).trim()
    .min(2).max(40)
    .regex(/^[\p{L}\p{N}][\p{L}\p{N} &/-]*$/u, 'Use letters, numbers, spaces, & / or - only.'),
  description: z.string().trim().max(200).optional().default('Custom category'),
});

export const categoryUpdateSchema = z.object({
  description: z.string().trim().min(1).max(200),
});

export const catalogQuerySchema = z.object({
  q: z.string().trim().max(120).optional().default(''),
  category: z.string().trim().max(80).optional().default(''),
});

export const progressSchema = z.object({
  stepId: z.string().min(1).optional(),
  completed: z.boolean().optional(),
  completedSteps: z.array(z.string().min(1)).optional(),
}).refine((value) => value.stepId || value.completedSteps, {
  message: 'Provide stepId or completedSteps.',
});

export const checklistSchema = z.object({
  documentName: z.string().trim().min(1).max(200).optional(),
  completed: z.boolean().optional(),
  items: z.array(z.object({
    name: z.string().trim().min(1).max(200),
    completed: z.boolean(),
  })).optional(),
}).refine((value) => value.documentName || value.items, {
  message: 'Provide documentName or items.',
});

export const requestSchema = z.object({
  title: z.string({ required_error: 'Title is required.' }).trim().min(3).max(150),
  description: z.string({ required_error: 'Description is required.' }).trim().min(10).max(2000),
  category: z.string().trim().max(80).optional().nullable(),
  relatedJourneyId: z.string().trim().max(80).optional().nullable(),
});

export const requestStatusSchema = z.object({
  status: z.enum(['submitted', 'under_review', 'accepted', 'rejected', 'closed']),
  note: z.string().trim().max(1000).optional().default(''),
});

export const abroadSchema = z.object({
  mode: z.boolean(),
  tasks: z.array(z.object({
    id: z.string().trim().min(1).max(40),
    title: z.string().trim().min(1).max(200),
    progress: z.number().int().min(0).max(100),
  })).max(20),
});

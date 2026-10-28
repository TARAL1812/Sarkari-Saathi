const bool = (value) => Boolean(value);

function mapStep(step) {
  return {
    id: step.id,
    title: step.title,
    description: step.description || '',
    requiredDocuments: step.requiredDocuments || [],
    location: step.location || '',
    responsibleOrganization: step.responsible_organization || step.responsibleOrganization || '',
    estimatedTime: step.estimated_time || step.estimatedTime || 'Not provided',
    possibleFee: step.possible_fee || step.possibleFee || 'Not provided',
    whatHappensNext: step.what_happens_next || step.whatHappensNext || '',
    commonProblems: step.commonProblems || [],
    officialSource: step.official_source || step.officialSource || '',
    ...(step.branch ? { branch: step.branch } : {}),
  };
}

export function mapOfficialJourney(row, { admin = false } = {}) {
  const steps = (row.steps || []).map(mapStep);
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    country: row.country || '',
    region: row.region || '',
    description: row.description || '',
    targetUser: row.target_user || '',
    organizationName: row.organization_name || '',
    department: row.department || '',
    officialWebsite: row.official_website || '',
    sourceUrl: row.source_url || '',
    verificationStatus: row.verification_status,
    lastVerified: row.last_verified || '',
    location: row.location || '',
    isDemo: bool(row.is_demo),
    status: row.status,
    archivedAt: row.archived_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(admin ? { createdBy: row.created_by } : {}),
    steps,
  };
}

export function mapOfficialSummary(row) {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    country: row.country || '',
    region: row.region || '',
    description: row.description || '',
    organizationName: row.organization_name || '',
    verificationStatus: row.verification_status,
    lastVerified: row.last_verified || '',
    isDemo: bool(row.is_demo),
    status: row.status,
    updatedAt: row.updated_at,
  };
}

export function mapCategory(row) {
  return {
    id: row.id,
    description: row.description,
    isBuiltin: bool(row.is_builtin),
  };
}

export function mapPersonalJourney(row) {
  const steps = (row.steps || []).map(mapStep);
  const documents = [...new Set(steps.flatMap((step) => step.requiredDocuments).filter(Boolean))];
  const checklist = documents.map((name) => {
    const saved = (row.checklist || []).find((item) => item.document_name === name);
    return { name, completed: Boolean(saved?.completed) };
  });
  return {
    id: row.id,
    userId: row.user_id,
    sourceJourneyId: row.source_journey_id,
    title: row.title,
    category: row.category,
    country: row.country || '',
    region: row.region || '',
    description: row.description || '',
    targetUser: row.target_user || '',
    organizationName: row.organization_name || '',
    department: row.department || '',
    officialWebsite: row.official_website || '',
    sourceUrl: row.source_url || '',
    location: row.location || '',
    progress: row.progress,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    steps,
    completedSteps: row.completedSteps || [],
    checklist,
  };
}

export function mapRequest(row) {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    category: row.category,
    relatedJourneyId: row.related_journey_id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    history: (row.history || []).map((item) => ({
      fromStatus: item.from_status,
      toStatus: item.to_status,
      actorId: item.actor_id,
      note: item.note || '',
      createdAt: item.created_at,
    })),
  };
}

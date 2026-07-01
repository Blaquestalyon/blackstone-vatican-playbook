/**
 * Airtable adapter — thin wrapper around the Airtable REST API.
 *
 * Two tables:
 *   TaskState  · one row per WBS id, holds current status + notes + who/when
 *   AuditLog   · append-only log of every change, for auditability
 *
 * TaskState is upserted by the WBS field (Airtable's native performUpsert).
 */

const API = 'https://api.airtable.com/v0';

function cfg() {
  const token   = process.env.AIRTABLE_TOKEN;
  const baseId  = process.env.AIRTABLE_BASE_ID;
  const state   = process.env.AIRTABLE_TASK_STATE_TABLE   || 'TaskState';
  const audit   = process.env.AIRTABLE_AUDIT_LOG_TABLE    || 'AuditLog';
  const deps    = process.env.AIRTABLE_DEPENDENCIES_TABLE || 'Dependencies';
  const actions = process.env.AIRTABLE_TASK_ACTIONS_TABLE  || 'TaskActions';
  if (!token || !baseId) throw new Error('Airtable not configured (AIRTABLE_TOKEN / AIRTABLE_BASE_ID)');
  return { token, baseId, state, audit, deps, actions };
}

async function airtableFetch(pathPart, opts = {}) {
  const { token } = cfg();
  const url = `${API}${pathPart}`;
  const res = await fetch(url, {
    ...opts,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {})
    }
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Airtable ${res.status}: ${body.slice(0, 400)}`);
  }
  return res.json();
}

async function listTaskState() {
  const { baseId, state } = cfg();
  const table = encodeURIComponent(state);
  const rows = [];
  let offset;
  do {
    const qs = new URLSearchParams({ pageSize: '100' });
    if (offset) qs.set('offset', offset);
    const data = await airtableFetch(`/${baseId}/${table}?${qs.toString()}`);
    rows.push(...(data.records || []));
    offset = data.offset;
  } while (offset);
  return rows;
}

/**
 * Upsert one TaskState row by WBS.
 * Uses Airtable's performUpsert with `fieldsToMergeOn: ['WBS']`.
 */
async function upsertTaskState(wbs, fields) {
  const { baseId, state } = cfg();
  const table = encodeURIComponent(state);
  const body = {
    performUpsert: { fieldsToMergeOn: ['WBS'] },
    records: [{ fields: { WBS: wbs, ...fields } }],
    typecast: true
  };
  const data = await airtableFetch(`/${baseId}/${table}`, {
    method: 'PATCH',
    body: JSON.stringify(body)
  });
  return data.records[0];
}

async function appendAudit(fields) {
  const { baseId, audit } = cfg();
  const table = encodeURIComponent(audit);
  const body = { records: [{ fields }], typecast: true };
  return airtableFetch(`/${baseId}/${table}`, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

async function listDependencies() {
  const { baseId, deps } = cfg();
  const table = encodeURIComponent(deps);
  const rows = [];
  let offset;
  try{
    do {
      const qs = new URLSearchParams({ pageSize: '100' });
      if (offset) qs.set('offset', offset);
      const data = await airtableFetch(`/${baseId}/${table}?${qs.toString()}`);
      rows.push(...(data.records || []));
      offset = data.offset;
    } while (offset);
  }catch(e){
    // Dependencies table is optional — if it doesn't exist yet, return empty.
    if(String(e.message).includes('404') || String(e.message).includes('NOT_FOUND') || String(e.message).includes('Could not find')){
      return [];
    }
    throw e;
  }
  return rows;
}

// List every row in the TaskActions table. Returns [] gracefully if the table
// doesn't exist yet (e.g. teammate hasn't created it via Airtable AI yet) so the
// rest of the app still works — the playbook then renders original Actions only.
async function listTaskActions() {
  const { baseId, actions } = cfg();
  const table = encodeURIComponent(actions);
  const rows = [];
  let offset;
  try{
    do {
      const qs = new URLSearchParams({ pageSize: '100' });
      if (offset) qs.set('offset', offset);
      const data = await airtableFetch(`/${baseId}/${table}?${qs.toString()}`);
      rows.push(...(data.records || []));
      offset = data.offset;
    } while (offset);
  }catch(e){
    if(String(e.message).includes('404') || String(e.message).includes('NOT_FOUND') || String(e.message).includes('Could not find')){
      return [];
    }
    throw e;
  }
  return rows;
}

module.exports = { listTaskState, upsertTaskState, appendAudit, listDependencies, listTaskActions };

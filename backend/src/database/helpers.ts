import { supabase } from './supabase';

// User operations
export const findUserByPhone = async (phone: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('phone', phone)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
    throw error;
  }

  return data;
};

export const findUserById = async (id: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data;
};

export const createUser = async (userData: { phone: string; role: string }) => {
  const { data, error } = await supabase
    .from('users')
    .insert([userData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateUser = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// OTP operations
export const findOtpByPhone = async (phone: string) => {
  const { data, error } = await supabase
    .from('otp_verifications')
    .select('*, users(*)')
    .eq('phone', phone)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data;
};

export const upsertOtp = async (otpData: {
  phone: string;
  otp: string;
  purpose: string;
  expiresAt: Date;
  verified?: boolean;
  attempts?: number;
}) => {
  const { data, error } = await supabase
    .from('otp_verifications')
    .upsert([otpData], { onConflict: 'phone' })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateOtp = async (phone: string, updates: any) => {
  const { data, error } = await supabase
    .from('otp_verifications')
    .update(updates)
    .eq('phone', phone)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Worker profile operations
export const findWorkerProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('worker_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data;
};

export const createWorkerProfile = async (profileData: any) => {
  const { data, error } = await supabase
    .from('worker_profiles')
    .insert([profileData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateWorkerProfile = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('worker_profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Platform operations
export const findPlatformsByWorker = async (workerId: string) => {
  const { data, error } = await supabase
    .from('platforms')
    .select('*')
    .eq('worker_id', workerId);

  if (error) throw error;
  return data;
};

export const createPlatform = async (platformData: any) => {
  const { data, error } = await supabase
    .from('platforms')
    .insert([platformData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Credential operations
export const findCredentialsByWorker = async (workerId: string) => {
  const { data, error } = await supabase
    .from('credentials')
    .select('*')
    .eq('worker_id', workerId);

  if (error) throw error;
  return data;
};

export const createCredential = async (credentialData: any) => {
  const { data, error } = await supabase
    .from('credentials')
    .insert([credentialData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Income operations
export const findIncomeByWorker = async (workerId: string) => {
  const { data, error } = await supabase
    .from('income_records')
    .select('*')
    .eq('worker_id', workerId);

  if (error) throw error;
  return data;
};

export const createIncomeRecord = async (incomeData: any) => {
  const { data, error } = await supabase
    .from('income_records')
    .insert([incomeData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateIncomeRecord = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('income_records')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Lender operations
export const findLenderProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('lender_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data;
};

export const createLenderProfile = async (profileData: any) => {
  const { data, error } = await supabase
    .from('lender_profiles')
    .insert([profileData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Access request operations
export const findAccessRequestsByLender = async (lenderId: string) => {
  const { data, error } = await supabase
    .from('access_requests')
    .select(`
      *,
      worker:worker_profiles(*, user:users(*)),
      lender:lender_profiles(*, user:users(*))
    `)
    .eq('lender_id', lenderId);

  if (error) throw error;
  return data;
};

export const findAccessRequestsByWorker = async (workerId: string) => {
  const { data, error } = await supabase
    .from('access_requests')
    .select(`
      *,
      worker:worker_profiles(*, user:users(*)),
      lender:lender_profiles(*, user:users(*))
    `)
    .eq('worker_id', workerId);

  if (error) throw error;
  return data;
};

export const createAccessRequest = async (requestData: any) => {
  const { data, error } = await supabase
    .from('access_requests')
    .insert([requestData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateAccessRequest = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('access_requests')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Peer attestation operations
export const findAttestationsBySubject = async (subjectId: string) => {
  const { data, error } = await supabase
    .from('peer_attestations')
    .select(`
      *,
      attester:worker_profiles(*, user:users(*))
    `)
    .eq('subject_id', subjectId);

  if (error) throw error;
  return data;
};

export const findAttestationsByAttester = async (attesterId: string) => {
  const { data, error } = await supabase
    .from('peer_attestations')
    .select(`
      *,
      subject:worker_profiles(*, user:users(*))
    `)
    .eq('attester_id', attesterId);

  if (error) throw error;
  return data;
};

export const createPeerAttestation = async (attestationData: any) => {
  const { data, error } = await supabase
    .from('peer_attestations')
    .insert([attestationData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Consent log operations
export const createConsentLog = async (logData: any) => {
  const { data, error } = await supabase
    .from('consent_logs')
    .insert([logData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// WhatsApp log operations
export const createWhatsAppLog = async (logData: any) => {
  const { data, error } = await supabase
    .from('whatsapp_logs')
    .insert([logData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const findPlatformById = async (id: string) => {
  const { data, error } = await supabase
    .from('platforms')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

export const updatePlatform = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('platforms')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const findCredentialById = async (id: string) => {
  const { data, error } = await supabase
    .from('credentials')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

export const updateCredential = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('credentials')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const findIncomeRecordById = async (id: string) => {
  const { data, error } = await supabase
    .from('income_records')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

export const deleteIncomeRecord = async (id: string) => {
  const { data, error } = await supabase
    .from('income_records')
    .delete()
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const findLenderProfileById = async (id: string) => {
  const { data, error } = await supabase
    .from('lender_profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

export const updateLenderProfile = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('lender_profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteLenderProfile = async (id: string) => {
  const { data, error } = await supabase
    .from('lender_profiles')
    .delete()
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const findAccessRequestById = async (id: string) => {
  const { data, error } = await supabase
    .from('access_requests')
    .select(`*, worker:worker_profiles(*), lender:lender_profiles(*)`)
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

export const findAccessRequestByToken = async (token: string) => {
  const { data, error } = await supabase
    .from('access_requests')
    .select(`*, worker:worker_profiles(*, user:users(*)), lender:lender_profiles(*)`)
    .eq('token', token)
    .eq('status', 'APPROVED')
    .gt('expires_at', new Date())
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

export const findConsentLogs = async (filter: any) => {
  const query = supabase.from('consent_logs').select(`*, worker:users(id, phone)`);

  if (filter.workerId) query.eq('worker_id', filter.workerId);
  if (filter.actorId) query.eq('actor_id', filter.actorId);
  if (filter.startDate) query.gte('timestamp', new Date(filter.startDate));
  if (filter.endDate) query.lte('timestamp', new Date(filter.endDate));
  if (filter.take) query.order('timestamp', { ascending: false }).limit(filter.take);

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

export const countRecords = async (table: string, filter: any = {}) => {
  const query = supabase.from(table).select('*', { count: 'exact', head: true });
  Object.keys(filter).forEach(key => {
    if (filter[key] !== undefined) query.eq(key, filter[key]);
  });
  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
};

export const deleteFromTable = async (table: string, filter: any = {}) => {
  const query = supabase.from(table).delete();
  Object.keys(filter).forEach(key => {
    if (filter[key] !== undefined) query.eq(key, filter[key]);
  });
  const { data, error } = await query;
  if (error) throw error;
  return data;
};
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFromTable = exports.countRecords = exports.findConsentLogs = exports.findAccessRequestByToken = exports.findAccessRequestById = exports.deleteLenderProfile = exports.updateLenderProfile = exports.findLenderProfileById = exports.deleteIncomeRecord = exports.findIncomeRecordById = exports.updateCredential = exports.findCredentialById = exports.updatePlatform = exports.findPlatformById = exports.createWhatsAppLog = exports.createConsentLog = exports.createPeerAttestation = exports.findAttestationsByAttester = exports.findAttestationsBySubject = exports.updateAccessRequest = exports.createAccessRequest = exports.findAccessRequestsByWorker = exports.findAccessRequestsByLender = exports.createLenderProfile = exports.findLenderProfile = exports.updateIncomeRecord = exports.createIncomeRecord = exports.findIncomeByWorker = exports.createCredential = exports.findCredentialsByWorker = exports.createPlatform = exports.findPlatformsByWorker = exports.updateWorkerProfile = exports.createWorkerProfile = exports.findWorkerProfile = exports.updateOtp = exports.upsertOtp = exports.findOtpByPhone = exports.updateUser = exports.createUser = exports.findUserById = exports.findUserByPhone = void 0;
const supabase_1 = require("./supabase");
// User operations
const findUserByPhone = async (phone) => {
    const { data, error } = await supabase_1.supabase
        .from('users')
        .select('*')
        .eq('phone', phone)
        .single();
    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw error;
    }
    return data;
};
exports.findUserByPhone = findUserByPhone;
const findUserById = async (id) => {
    const { data, error } = await supabase_1.supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
    if (error && error.code !== 'PGRST116') {
        throw error;
    }
    return data;
};
exports.findUserById = findUserById;
const createUser = async (userData) => {
    const { data, error } = await supabase_1.supabase
        .from('users')
        .insert([userData])
        .select()
        .single();
    if (error)
        throw error;
    return data;
};
exports.createUser = createUser;
const updateUser = async (id, updates) => {
    const { data, error } = await supabase_1.supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error)
        throw error;
    return data;
};
exports.updateUser = updateUser;
// OTP operations
const findOtpByPhone = async (phone) => {
    const { data, error } = await supabase_1.supabase
        .from('otp_verifications')
        .select('*, users(*)')
        .eq('phone', phone)
        .single();
    if (error && error.code !== 'PGRST116') {
        throw error;
    }
    return data;
};
exports.findOtpByPhone = findOtpByPhone;
const upsertOtp = async (otpData) => {
    const { data, error } = await supabase_1.supabase
        .from('otp_verifications')
        .upsert([otpData], { onConflict: 'phone' })
        .select()
        .single();
    if (error)
        throw error;
    return data;
};
exports.upsertOtp = upsertOtp;
const updateOtp = async (phone, updates) => {
    const { data, error } = await supabase_1.supabase
        .from('otp_verifications')
        .update(updates)
        .eq('phone', phone)
        .select()
        .single();
    if (error)
        throw error;
    return data;
};
exports.updateOtp = updateOtp;
// Worker profile operations
const findWorkerProfile = async (userId) => {
    const { data, error } = await supabase_1.supabase
        .from('worker_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
    if (error && error.code !== 'PGRST116') {
        throw error;
    }
    return data;
};
exports.findWorkerProfile = findWorkerProfile;
const createWorkerProfile = async (profileData) => {
    const { data, error } = await supabase_1.supabase
        .from('worker_profiles')
        .insert([profileData])
        .select()
        .single();
    if (error)
        throw error;
    return data;
};
exports.createWorkerProfile = createWorkerProfile;
const updateWorkerProfile = async (id, updates) => {
    const { data, error } = await supabase_1.supabase
        .from('worker_profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error)
        throw error;
    return data;
};
exports.updateWorkerProfile = updateWorkerProfile;
// Platform operations
const findPlatformsByWorker = async (workerId) => {
    const { data, error } = await supabase_1.supabase
        .from('platforms')
        .select('*')
        .eq('worker_id', workerId);
    if (error)
        throw error;
    return data;
};
exports.findPlatformsByWorker = findPlatformsByWorker;
const createPlatform = async (platformData) => {
    const { data, error } = await supabase_1.supabase
        .from('platforms')
        .insert([platformData])
        .select()
        .single();
    if (error)
        throw error;
    return data;
};
exports.createPlatform = createPlatform;
// Credential operations
const findCredentialsByWorker = async (workerId) => {
    const { data, error } = await supabase_1.supabase
        .from('credentials')
        .select('*')
        .eq('worker_id', workerId);
    if (error)
        throw error;
    return data;
};
exports.findCredentialsByWorker = findCredentialsByWorker;
const createCredential = async (credentialData) => {
    const { data, error } = await supabase_1.supabase
        .from('credentials')
        .insert([credentialData])
        .select()
        .single();
    if (error)
        throw error;
    return data;
};
exports.createCredential = createCredential;
// Income operations
const findIncomeByWorker = async (workerId) => {
    const { data, error } = await supabase_1.supabase
        .from('income_records')
        .select('*')
        .eq('worker_id', workerId);
    if (error)
        throw error;
    return data;
};
exports.findIncomeByWorker = findIncomeByWorker;
const createIncomeRecord = async (incomeData) => {
    const { data, error } = await supabase_1.supabase
        .from('income_records')
        .insert([incomeData])
        .select()
        .single();
    if (error)
        throw error;
    return data;
};
exports.createIncomeRecord = createIncomeRecord;
const updateIncomeRecord = async (id, updates) => {
    const { data, error } = await supabase_1.supabase
        .from('income_records')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error)
        throw error;
    return data;
};
exports.updateIncomeRecord = updateIncomeRecord;
// Lender operations
const findLenderProfile = async (userId) => {
    const { data, error } = await supabase_1.supabase
        .from('lender_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
    if (error && error.code !== 'PGRST116') {
        throw error;
    }
    return data;
};
exports.findLenderProfile = findLenderProfile;
const createLenderProfile = async (profileData) => {
    const { data, error } = await supabase_1.supabase
        .from('lender_profiles')
        .insert([profileData])
        .select()
        .single();
    if (error)
        throw error;
    return data;
};
exports.createLenderProfile = createLenderProfile;
// Access request operations
const findAccessRequestsByLender = async (lenderId) => {
    const { data, error } = await supabase_1.supabase
        .from('access_requests')
        .select(`
      *,
      worker:worker_profiles(*, user:users(*)),
      lender:lender_profiles(*, user:users(*))
    `)
        .eq('lender_id', lenderId);
    if (error)
        throw error;
    return data;
};
exports.findAccessRequestsByLender = findAccessRequestsByLender;
const findAccessRequestsByWorker = async (workerId) => {
    const { data, error } = await supabase_1.supabase
        .from('access_requests')
        .select(`
      *,
      worker:worker_profiles(*, user:users(*)),
      lender:lender_profiles(*, user:users(*))
    `)
        .eq('worker_id', workerId);
    if (error)
        throw error;
    return data;
};
exports.findAccessRequestsByWorker = findAccessRequestsByWorker;
const createAccessRequest = async (requestData) => {
    const { data, error } = await supabase_1.supabase
        .from('access_requests')
        .insert([requestData])
        .select()
        .single();
    if (error)
        throw error;
    return data;
};
exports.createAccessRequest = createAccessRequest;
const updateAccessRequest = async (id, updates) => {
    const { data, error } = await supabase_1.supabase
        .from('access_requests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error)
        throw error;
    return data;
};
exports.updateAccessRequest = updateAccessRequest;
// Peer attestation operations
const findAttestationsBySubject = async (subjectId) => {
    const { data, error } = await supabase_1.supabase
        .from('peer_attestations')
        .select(`
      *,
      attester:worker_profiles(*, user:users(*))
    `)
        .eq('subject_id', subjectId);
    if (error)
        throw error;
    return data;
};
exports.findAttestationsBySubject = findAttestationsBySubject;
const findAttestationsByAttester = async (attesterId) => {
    const { data, error } = await supabase_1.supabase
        .from('peer_attestations')
        .select(`
      *,
      subject:worker_profiles(*, user:users(*))
    `)
        .eq('attester_id', attesterId);
    if (error)
        throw error;
    return data;
};
exports.findAttestationsByAttester = findAttestationsByAttester;
const createPeerAttestation = async (attestationData) => {
    const { data, error } = await supabase_1.supabase
        .from('peer_attestations')
        .insert([attestationData])
        .select()
        .single();
    if (error)
        throw error;
    return data;
};
exports.createPeerAttestation = createPeerAttestation;
// Consent log operations
const createConsentLog = async (logData) => {
    const { data, error } = await supabase_1.supabase
        .from('consent_logs')
        .insert([logData])
        .select()
        .single();
    if (error)
        throw error;
    return data;
};
exports.createConsentLog = createConsentLog;
// WhatsApp log operations
const createWhatsAppLog = async (logData) => {
    const { data, error } = await supabase_1.supabase
        .from('whatsapp_logs')
        .insert([logData])
        .select()
        .single();
    if (error)
        throw error;
    return data;
};
exports.createWhatsAppLog = createWhatsAppLog;
const findPlatformById = async (id) => {
    const { data, error } = await supabase_1.supabase
        .from('platforms')
        .select('*')
        .eq('id', id)
        .single();
    if (error && error.code !== 'PGRST116')
        throw error;
    return data;
};
exports.findPlatformById = findPlatformById;
const updatePlatform = async (id, updates) => {
    const { data, error } = await supabase_1.supabase
        .from('platforms')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error)
        throw error;
    return data;
};
exports.updatePlatform = updatePlatform;
const findCredentialById = async (id) => {
    const { data, error } = await supabase_1.supabase
        .from('credentials')
        .select('*')
        .eq('id', id)
        .single();
    if (error && error.code !== 'PGRST116')
        throw error;
    return data;
};
exports.findCredentialById = findCredentialById;
const updateCredential = async (id, updates) => {
    const { data, error } = await supabase_1.supabase
        .from('credentials')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error)
        throw error;
    return data;
};
exports.updateCredential = updateCredential;
const findIncomeRecordById = async (id) => {
    const { data, error } = await supabase_1.supabase
        .from('income_records')
        .select('*')
        .eq('id', id)
        .single();
    if (error && error.code !== 'PGRST116')
        throw error;
    return data;
};
exports.findIncomeRecordById = findIncomeRecordById;
const deleteIncomeRecord = async (id) => {
    const { data, error } = await supabase_1.supabase
        .from('income_records')
        .delete()
        .eq('id', id)
        .select()
        .single();
    if (error)
        throw error;
    return data;
};
exports.deleteIncomeRecord = deleteIncomeRecord;
const findLenderProfileById = async (id) => {
    const { data, error } = await supabase_1.supabase
        .from('lender_profiles')
        .select('*')
        .eq('id', id)
        .single();
    if (error && error.code !== 'PGRST116')
        throw error;
    return data;
};
exports.findLenderProfileById = findLenderProfileById;
const updateLenderProfile = async (id, updates) => {
    const { data, error } = await supabase_1.supabase
        .from('lender_profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error)
        throw error;
    return data;
};
exports.updateLenderProfile = updateLenderProfile;
const deleteLenderProfile = async (id) => {
    const { data, error } = await supabase_1.supabase
        .from('lender_profiles')
        .delete()
        .eq('id', id)
        .select()
        .single();
    if (error)
        throw error;
    return data;
};
exports.deleteLenderProfile = deleteLenderProfile;
const findAccessRequestById = async (id) => {
    const { data, error } = await supabase_1.supabase
        .from('access_requests')
        .select(`*, worker:worker_profiles(*), lender:lender_profiles(*)`)
        .eq('id', id)
        .single();
    if (error && error.code !== 'PGRST116')
        throw error;
    return data;
};
exports.findAccessRequestById = findAccessRequestById;
const findAccessRequestByToken = async (token) => {
    const { data, error } = await supabase_1.supabase
        .from('access_requests')
        .select(`*, worker:worker_profiles(*, user:users(*)), lender:lender_profiles(*)`)
        .eq('token', token)
        .eq('status', 'APPROVED')
        .gt('expires_at', new Date())
        .single();
    if (error && error.code !== 'PGRST116')
        throw error;
    return data;
};
exports.findAccessRequestByToken = findAccessRequestByToken;
const findConsentLogs = async (filter) => {
    const query = supabase_1.supabase.from('consent_logs').select(`*, worker:users(id, phone)`);
    if (filter.workerId)
        query.eq('worker_id', filter.workerId);
    if (filter.actorId)
        query.eq('actor_id', filter.actorId);
    if (filter.startDate)
        query.gte('timestamp', new Date(filter.startDate));
    if (filter.endDate)
        query.lte('timestamp', new Date(filter.endDate));
    if (filter.take)
        query.order('timestamp', { ascending: false }).limit(filter.take);
    const { data, error } = await query;
    if (error)
        throw error;
    return data;
};
exports.findConsentLogs = findConsentLogs;
const countRecords = async (table, filter = {}) => {
    const query = supabase_1.supabase.from(table).select('*', { count: 'exact', head: true });
    Object.keys(filter).forEach(key => {
        if (filter[key] !== undefined)
            query.eq(key, filter[key]);
    });
    const { count, error } = await query;
    if (error)
        throw error;
    return count || 0;
};
exports.countRecords = countRecords;
const deleteFromTable = async (table, filter = {}) => {
    const query = supabase_1.supabase.from(table).delete();
    Object.keys(filter).forEach(key => {
        if (filter[key] !== undefined)
            query.eq(key, filter[key]);
    });
    const { data, error } = await query;
    if (error)
        throw error;
    return data;
};
exports.deleteFromTable = deleteFromTable;
//# sourceMappingURL=helpers.js.map
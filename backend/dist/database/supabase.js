"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabaseClient = exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const config_1 = require("../config");
exports.supabase = (0, supabase_js_1.createClient)(config_1.config.supabase.url, config_1.config.supabase.serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
// For client-side operations (if needed)
exports.supabaseClient = (0, supabase_js_1.createClient)(config_1.config.supabase.url, config_1.config.supabase.anonKey);
//# sourceMappingURL=supabase.js.map
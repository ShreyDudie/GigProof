"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const config_1 = require("./config");
const auth_1 = __importDefault(require("./routes/auth"));
const kyc_1 = __importDefault(require("./routes/kyc"));
const whatsapp_1 = __importDefault(require("./routes/whatsapp"));
const platforms_1 = __importDefault(require("./routes/platforms"));
const credentials_1 = __importDefault(require("./routes/credentials"));
const income_1 = __importDefault(require("./routes/income"));
const access_1 = __importDefault(require("./routes/access"));
const attestations_1 = __importDefault(require("./routes/attestations"));
const verify_1 = __importDefault(require("./routes/verify"));
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: config_1.config.cors.allowedOrigins,
    credentials: true,
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
// Routes
app.use('/api/v1/auth', auth_1.default);
app.use('/api/v1/kyc', kyc_1.default);
app.use('/api/v1/whatsapp', whatsapp_1.default);
app.use('/api/v1/platforms', platforms_1.default);
app.use('/api/v1/credentials', credentials_1.default);
app.use('/api/v1/income', income_1.default);
app.use('/api/v1/access', access_1.default);
app.use('/api/v1/attestations', attestations_1.default);
app.use('/api/v1/verify', verify_1.default);
// Routes will be added here
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    });
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
    });
});
app.listen(config_1.config.port, () => {
    console.log(`Server running on port ${config_1.config.port}`);
});
//# sourceMappingURL=index.js.map
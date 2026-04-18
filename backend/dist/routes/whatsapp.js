"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const crypto_1 = __importDefault(require("crypto"));
const helpers_1 = require("../database/helpers");
const router = express_1.default.Router();
function isValidWebhookSignature(payload, headerSignature) {
    const appSecret = process.env.WHATSAPP_APP_SECRET;
    if (!appSecret || !headerSignature) {
        return true;
    }
    const digest = crypto_1.default
        .createHmac('sha256', appSecret)
        .update(JSON.stringify(payload))
        .digest('hex');
    const expected = `sha256=${digest}`;
    return crypto_1.default.timingSafeEqual(Buffer.from(expected), Buffer.from(headerSignature));
}
// Mock WhatsApp Business API webhook
router.post('/webhook', async (req, res) => {
    try {
        const signature = req.header('x-hub-signature-256');
        if (!isValidWebhookSignature(req.body, signature)) {
            return res.status(401).send('Invalid signature');
        }
        const { entry } = req.body;
        if (!entry || !entry[0]?.changes?.[0]?.value?.messages) {
            return res.status(200).send('OK'); // WhatsApp expects 200
        }
        const messages = entry[0].changes[0].value.messages;
        for (const message of messages) {
            await processMessage(message);
        }
        res.status(200).send('OK');
    }
    catch (error) {
        console.error('WhatsApp webhook error:', error);
        res.status(500).send('Internal server error');
    }
});
router.get('/webhook/test', async (_req, res) => {
    await (0, helpers_1.createWhatsAppLog)({
        from: 'system',
        message: 'Webhook deployment test ping',
        direction: 'INBOUND',
        timestamp: new Date(),
    });
    res.json({
        success: true,
        message: 'WhatsApp webhook route is live',
        timestamp: new Date().toISOString(),
    });
});
// WhatsApp webhook verification
router.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
        res.status(200).send(challenge);
    }
    else {
        res.status(403).send('Forbidden');
    }
});
async function processMessage(message) {
    const from = message.from;
    const text = message.text?.body?.toLowerCase();
    if (!text)
        return;
    let response = '';
    // Log incoming message
    await (0, helpers_1.createWhatsAppLog)({
        from,
        message: message.text?.body || '',
        direction: 'INBOUND',
        timestamp: new Date(),
    });
    // Process commands
    if (text.includes('register') || text.includes('शुरू करें')) {
        response = `Welcome to GigProof! 🇮🇳

Reply with your 10-digit mobile number to create your identity.

Example: 9876543210`;
    }
    else if (/^\d{10}$/.test(text.replace(/\s/g, ''))) {
        const phone = text.replace(/\s/g, '');
        response = `Great! We've sent an OTP to +91${phone}.

Enter the 6-digit OTP to continue.`;
    }
    else if (/^\d{6}$/.test(text.replace(/\s/g, ''))) {
        const otp = text.replace(/\s/g, '');
        // Mock OTP verification
        if (otp === '123456') {
            response = `✅ Verified!

Your GigProof ID is created. Download the app at [link] to complete your profile, or reply SCORE to see your estimated score.`;
        }
        else {
            response = `❌ Invalid OTP. Please try again.`;
        }
    }
    else if (text.includes('score') || text.includes('स्कोर')) {
        // Mock score
        const score = Math.floor(Math.random() * 40) + 60; // 60-100
        response = `📊 Your current GigProof score is ${score}/100.

Connect more platforms in the app to improve it!`;
    }
    else if (text.includes('share') || text.includes('शेयर करें')) {
        response = `📤 Reply with the lender's name or license number to generate a 24-hour access token for them.

Example: HDFC Bank`;
    }
    else if (text.includes('help') || text.includes('मदद')) {
        response = `🤖 GigProof WhatsApp Commands:

• REGISTER/शुरू करें - Start registration
• [10-digit number] - Enter phone number
• [6-digit OTP] - Verify OTP
• SCORE/स्कोर - Check your score
• SHARE/शेयर करें - Share credentials
• HELP/मदद - Show this menu

Need more help? Visit our website!`;
    }
    else {
        response = `🤔 I didn't understand that.

Reply HELP or मदद for available commands.`;
    }
    // Send response (mock - in production, use WhatsApp API)
    console.log(`WhatsApp response to ${from}: ${response}`);
    // Log outgoing message
    await (0, helpers_1.createWhatsAppLog)({
        from,
        message: response,
        direction: 'OUTBOUND',
        timestamp: new Date(),
    });
}
exports.default = router;
//# sourceMappingURL=whatsapp.js.map
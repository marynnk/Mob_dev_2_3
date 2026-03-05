"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendDueNotifications = void 0;
const admin = __importStar(require("firebase-admin"));
const scheduler_1 = require("firebase-functions/v2/scheduler");
const params_1 = require("firebase-functions/params");
const ONESIGNAL_REST_API_KEY = (0, params_1.defineSecret)('ONESIGNAL_REST_API_KEY');
const ONESIGNAL_APP_ID_SECRET = (0, params_1.defineSecret)('ONESIGNAL_APP_ID');
admin.initializeApp();
const db = admin.firestore();
exports.sendDueNotifications = (0, scheduler_1.onSchedule)({
    schedule: 'every 1 minutes',
    secrets: [ONESIGNAL_REST_API_KEY, ONESIGNAL_APP_ID_SECRET],
}, async () => {
    var _a, _b;
    const now = Date.now();
    const snap = await db.collection('tasks')
        .where('notifyAt', '<=', now)
        .where('notificationSent', '==', false)
        .get();
    if (snap.empty) {
        console.log('[sendDueNotifications] No pending notifications.');
        return;
    }
    console.log(`[sendDueNotifications] Found ${snap.size} task(s) to notify.`);
    const restApiKey = ONESIGNAL_REST_API_KEY.value();
    const appId = ONESIGNAL_APP_ID_SECRET.value();
    for (const taskDoc of snap.docs) {
        const task = taskDoc.data();
        if (!task['userId']) {
            console.warn(`[sendDueNotifications] Task ${taskDoc.id} has no userId, skipping.`);
            await taskDoc.ref.update({ notificationSent: true });
            continue;
        }
        const userDoc = await db.doc(`users/${task['userId']}`).get();
        const oneSignalIds = userDoc.exists
            ? ((_b = (_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a['oneSignalIds']) !== null && _b !== void 0 ? _b : [])
            : [];
        if (oneSignalIds.length === 0) {
            console.log(`[sendDueNotifications] User ${task['userId']} has no OneSignal IDs.`);
            await taskDoc.ref.update({ notificationSent: true });
            continue;
        }
        try {
            const body = {
                app_id: appId,
                include_subscription_ids: oneSignalIds,
                headings: {
                    en: `Task "${task['title']}" is due soon`,
                    uk: `Завдання "${task['title']}" скоро закінчується`,
                },
                contents: {
                    en: task['description'] || 'Check your task list',
                    uk: task['description'] || 'Перегляньте список завдань',
                },
                data: { taskId: taskDoc.id },
            };
            const response = await fetch('https://onesignal.com/api/v1/notifications', {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${restApiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });
            const result = await response.json();
            if (result.id) {
                console.log(`[sendDueNotifications] Push sent for task ${taskDoc.id}, oneSignal id: ${result.id}`);
            }
            else {
                console.error(`[sendDueNotifications] OneSignal error for task ${taskDoc.id}:`, result.errors);
            }
        }
        catch (err) {
            console.error(`[sendDueNotifications] Fetch failed for task ${taskDoc.id}:`, err);
        }
        await taskDoc.ref.update({ notificationSent: true });
    }
});
//# sourceMappingURL=index.js.map
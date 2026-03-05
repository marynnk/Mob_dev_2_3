import * as admin from 'firebase-admin';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { defineSecret } from 'firebase-functions/params';

const ONESIGNAL_REST_API_KEY = defineSecret('ONESIGNAL_REST_API_KEY');
const ONESIGNAL_APP_ID_SECRET = defineSecret('ONESIGNAL_APP_ID');

admin.initializeApp();
const db = admin.firestore();

export const sendDueNotifications = onSchedule(
    {
        schedule: 'every 1 minutes',
        secrets: [ONESIGNAL_REST_API_KEY, ONESIGNAL_APP_ID_SECRET],
    },
    async () => {
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

            const userDoc = await db.doc(`users/${task['userId'] as string}`).get();
            const oneSignalIds: string[] = userDoc.exists
                ? (userDoc.data()?.['oneSignalIds'] as string[] ?? [])
                : [];

            if (oneSignalIds.length === 0) {
                console.log(`[sendDueNotifications] User ${task['userId'] as string} has no OneSignal IDs.`);
                await taskDoc.ref.update({ notificationSent: true });
                continue;
            }

            try {
                const body = {
                    app_id: appId,
                    include_subscription_ids: oneSignalIds,
                    headings: {
                        en: `Task "${task['title'] as string}" is due soon`,
                        uk: `Завдання "${task['title'] as string}" скоро закінчується`,
                    },
                    contents: {
                        en: (task['description'] as string | undefined) || 'Check your task list',
                        uk: (task['description'] as string | undefined) || 'Перегляньте список завдань',
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

                const result = await response.json() as { id?: string; errors?: unknown };
                if (result.id) {
                    console.log(`[sendDueNotifications] Push sent for task ${taskDoc.id}, oneSignal id: ${result.id}`);
                } else {
                    console.error(`[sendDueNotifications] OneSignal error for task ${taskDoc.id}:`, result.errors);
                }
            } catch (err) {
                console.error(`[sendDueNotifications] Fetch failed for task ${taskDoc.id}:`, err);
            }

            await taskDoc.ref.update({ notificationSent: true });
        }
    }
);

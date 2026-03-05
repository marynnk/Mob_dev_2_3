import { LocationPoint } from './map.model';

export type TaskType = 'home' | 'work' | 'study' | 'other';

export const TASK_TYPES: TaskType[] = ['home', 'work', 'study', 'other'];

export interface TaskPhoto {
    url: string;
    uploadedAt: string;
    storagePath: string;
}

export type NotifyBefore = 30 | 60 | 120 | 480 | 1440;
export const NOTIFY_BEFORE_OPTIONS: Array<NotifyBefore | null> = [null, 30, 60, 120, 480, 1440];

export interface Task {
    id: number;
    title: string;
    dueDate?: Date;
    userId: string;
    description?: string;
    completed?: boolean;
    createdAt: unknown;
    photos?: TaskPhoto[];
    type?: TaskType;
    location?: LocationPoint;
    notifyBefore?: NotifyBefore | null;
    notifyAt?: number | null;
    notificationSent?: boolean;
}

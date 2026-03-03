import { LocationPoint } from './map.model';

export type TaskType = 'home' | 'work' | 'study' | 'other';

export const TASK_TYPES: TaskType[] = ['home', 'work', 'study', 'other'];

export interface TaskPhoto {
    url: string;
    uploadedAt: string;
    storagePath: string;
}

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
    location?: LocationPoint
}

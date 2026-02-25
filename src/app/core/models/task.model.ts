export interface Task {
    id: number;
    title: string;
    userId: string;
    description?: string;
    completed?: boolean;
    createdAt: unknown;
}

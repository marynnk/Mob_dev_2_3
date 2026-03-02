export interface Task {
    id: number;
    title: string;
    dueDate?: Date;
    userId: string;
    description?: string;
    completed?: boolean;
    createdAt: unknown;
}

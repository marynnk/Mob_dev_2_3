import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Task } from '../../core/models/task.model';
import { IonIcon, IonItem, IonItemOption, IonItemOptions, IonItemSliding, IonLabel } from '@ionic/angular/standalone';
import { DatePipe } from '@angular/common';
import { addIcons } from 'ionicons';
import { checkmarkCircle, createOutline, radioButtonOff, trashOutline } from 'ionicons/icons';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'app-task-item',
    templateUrl: './task-item.component.html',
    imports: [
        IonItemOptions,
        IonItemOption,
        IonIcon,
        IonItem,
        IonLabel,
        DatePipe,
        IonItemSliding,
        TranslatePipe,
    ],
    styleUrls: ['./task-item.component.scss']
})

export class TaskItemComponent {
    @Input() item: Task = {} as Task;

    @Output() toggleTask = new EventEmitter<Task>();
    @Output() editTask = new EventEmitter<Task>();
    @Output() deleteTask = new EventEmitter<Task>();

    constructor() {
        addIcons({ checkmarkCircle, radioButtonOff, createOutline, trashOutline });
    }

    protected handleToggleTask(item: Task, slider: IonItemSliding) {
        void slider.close();
        this.toggleTask.emit(item);
    }

    protected handleEditTask(item: Task) {
        this.editTask.emit(item);
    }

    protected handleDeleteTask(item: Task, slider: IonItemSliding) {
        void slider.close();
        this.deleteTask.emit(item);
    }

    protected isOverdue(item: Task) {
        return item.dueDate && new Date(item.dueDate) < new Date();
    }
}

import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class SettingsService {

    constructor() { }

    private setItem(key: string, value: any): void {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('Error saving to localStorage', error);
        }
    }

    private getItem(key: string): any {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Error getting from localStorage', error);
            return null;
        }
    }

    public getLanguage(): string {
        return this.getItem('language') || 'uk';
    }

    public setLanguage(language: string): void {
        this.setItem('language', language);
    }
}

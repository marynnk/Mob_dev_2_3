export interface LatLng {
    lat: number;
    lng: number;
}

export interface LocationPoint extends LatLng {
    address?: string;
}

export type MapMarkerType = 'home' | 'work' | 'study' | 'other';

export interface MapPoint {
    location: LatLng;
    type?: MapMarkerType;
    title?: string;
    description?: string;
    dueDate?: string;
}

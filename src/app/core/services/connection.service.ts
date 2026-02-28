import { Injectable } from '@angular/core';
import { from, map, Observable, startWith, switchMap, take } from 'rxjs';
import { Network, ConnectionStatus } from '@capacitor/network';
import { PluginListenerHandle } from '@capacitor/core';
import { shareReplay } from 'rxjs/operators';

@Injectable({
    providedIn: 'root',
})
export class ConnectionService {
    readonly isOnline$ = from(Network.getStatus()).pipe(
        switchMap((initial) =>
            this.networkStatus$().pipe(startWith(initial))
        ),
        map((status) => status.connected),
        shareReplay({ bufferSize: 1, refCount: false }),
    );

    private networkStatus$(): Observable<ConnectionStatus> {
        return new Observable((subscriber) => {
            let handle: PluginListenerHandle | undefined;

            Network.addListener('networkStatusChange', (status) => {
                subscriber.next(status);
            }).then((h) => {
                handle = h;
            });

            return () => void handle?.remove();
        });
    }
}

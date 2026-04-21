import { Injectable } from '@angular/core';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Observable } from 'rxjs';
import { db } from '../firebase';
import { UserProfile } from '../models/swag.model';

@Injectable({ providedIn: 'root' })
export class LeaderboardService {
  getTopClaimers(top = 10): Observable<UserProfile[]> {
    const q = query(
      collection(db, 'users'),
      orderBy('claimedCount', 'desc'),
      limit(top),
    );
    return new Observable((observer) => {
      const unsub = onSnapshot(
        q,
        (snap) => observer.next(snap.docs.map((d) => d.data() as UserProfile)),
        (err) => observer.error(err),
      );
      return () => unsub();
    });
  }

  getTopCreators(top = 10): Observable<UserProfile[]> {
    const q = query(
      collection(db, 'users'),
      orderBy('createdCount', 'desc'),
      limit(top),
    );
    return new Observable((observer) => {
      const unsub = onSnapshot(
        q,
        (snap) => observer.next(snap.docs.map((d) => d.data() as UserProfile)),
        (err) => observer.error(err),
      );
      return () => unsub();
    });
  }
}

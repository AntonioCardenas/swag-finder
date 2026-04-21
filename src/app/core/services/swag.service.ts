import { Injectable, inject } from '@angular/core';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
  increment,
  Timestamp,
  getDoc,
  onSnapshot,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Observable } from 'rxjs';
import { db, storage } from '../firebase';
import { SwagItem } from '../models/swag.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class SwagService {
  private readonly auth = inject(AuthService);
  private readonly EVENT_NAME = 'next26';

  getSwagList(): Observable<SwagItem[]> {
    const q = query(collection(db, this.EVENT_NAME), orderBy('createdAt', 'desc'));
    return new Observable((observer) => {
      const unsub = onSnapshot(
        q,
        (snap) => {
          const items = snap.docs.map((d) => this.docToSwag(d.id, d.data()));
          observer.next(items);
        },
        (err) => observer.error(err),
      );
      return () => unsub();
    });
  }

  async createSwag(data: {
    title: string;
    description: string;
    location: string;
    imageFile: File;
  }): Promise<void> {
    const uid = this.auth.uid()!;
    const displayName = this.auth.displayName();

    const imageUrl = await this.uploadImage(data.imageFile, uid);

    await addDoc(collection(db, this.EVENT_NAME), {
      title: data.title,
      description: data.description,
      imageUrl,
      location: data.location,
      claimed: false,
      claimedBy: null,
      claimedByName: null,
      claimedAt: null,
      createdBy: uid,
      createdByName: displayName,
      createdAt: serverTimestamp(),
    });

    await updateDoc(doc(db, 'users', uid), { createdCount: increment(1) });
  }

  async claimSwag(swagId: string): Promise<void> {
    const uid = this.auth.uid()!;
    const displayName = this.auth.displayName();

    const swagRef = doc(db, this.EVENT_NAME, swagId);
    const snap = await getDoc(swagRef);
    if (!snap.exists() || snap.data()['claimed']) return;

    await updateDoc(swagRef, {
      claimed: true,
      claimedBy: uid,
      claimedByName: displayName,
      claimedAt: serverTimestamp(),
    });

    await updateDoc(doc(db, 'users', uid), { claimedCount: increment(1) });
  }

  async expireSwag(swagId: string): Promise<void> {
    await updateDoc(doc(db, this.EVENT_NAME, swagId), { expired: true });
  }

  private async uploadImage(file: File, uid: string): Promise<string> {
    const path = `swag/${uid}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  }

  private docToSwag(id: string, data: Record<string, unknown>): SwagItem {
    const toDate = (v: unknown): Date | null =>
      v instanceof Timestamp ? v.toDate() : null;
    return {
      id,
      title: data['title'] as string,
      description: data['description'] as string,
      imageUrl: data['imageUrl'] as string,
      location: data['location'] as string,
      claimed: data['claimed'] as boolean,
      claimedBy: (data['claimedBy'] as string) ?? null,
      claimedByName: (data['claimedByName'] as string) ?? null,
      claimedAt: toDate(data['claimedAt']),
      createdBy: data['createdBy'] as string,
      createdByName: data['createdByName'] as string,
      createdAt: toDate(data['createdAt']) ?? new Date(),
      expired: (data['expired'] as boolean) ?? false,
    };
  }
}

import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);
  private readonly _user = signal<User | null>(null);
  private readonly _guestMode = signal(false);

  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null || this._guestMode());
  readonly isAnonymous = computed(() => this._guestMode() || (this._user()?.isAnonymous ?? true));
  readonly uid = computed(() => this._user()?.uid ?? null);
  readonly displayName = computed(() => this._user()?.displayName ?? 'Guest');

  constructor() {
    onAuthStateChanged(auth, (user) => {
      this._user.set(user);
      if (user) this._guestMode.set(false);
    });
  }

  async browseAsGuest(): Promise<void> {
    this._guestMode.set(true);
    await this.router.navigate(['/swag']);
  }

  async signInWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    await this.upsertUserProfile(result.user);
    await this.router.navigate(['/swag']);
  }

  async signOut(): Promise<void> {
    this._guestMode.set(false);
    if (this._user()) await signOut(auth);
    await this.router.navigate(['/login']);
  }

  private async upsertUserProfile(user: User): Promise<void> {
    const ref = doc(db, 'users', user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        uid: user.uid,
        displayName: user.displayName ?? 'Anonymous',
        email: user.email ?? '',
        photoURL: user.photoURL ?? null,
        claimedCount: 0,
        createdCount: 0,
        createdAt: serverTimestamp(),
      });
    }
  }
}

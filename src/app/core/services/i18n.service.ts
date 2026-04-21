import { Injectable, signal, computed } from '@angular/core';

export type Lang = 'en' | 'es';

const EN = {
  login: {
    subtitle: 'Find, claim, and collect swag at events',
    signInGoogle: 'Continue with Google',
    browseGuest: 'Browse as Guest',
    guestNote: 'Read-only · no claiming or leaderboard',
  },
  swag: {
    title: 'Swag Board',
    addAriaLabel: 'Add new swag',
    guestBanner: 'Browsing as guest —',
    guestSignIn: 'Sign in to claim & create',
    filterAll: 'All',
    filterAvailable: 'Available',
    filterClaimed: 'Claimed',
    loadingAriaLabel: 'Loading swag...',
    empty: 'No swag here yet.',
    addButton: 'Add New Swag',
    claimedBadge: 'Claimed',
    expiredBadge: 'Expired',
    claimedBy: 'Claimed by',
    signInToClaim: 'Sign in to claim',
    claimNow: 'Claim Now',
    claiming: 'Claiming…',
    markUnavailable: 'No longer available',
  },
  create: {
    title: 'Add Swag',
    backAriaLabel: 'Back',
    titleLabel: 'Title',
    titlePlaceholder: 'e.g. Anthropic hoodie',
    titleRequired: 'Title is required',
    descriptionLabel: 'Description',
    descriptionPlaceholder: 'What is this swag? Any size restrictions?',
    descriptionRequired: 'Description is required',
    locationLabel: 'Booth Number',
    locationPlaceholder: '42',
    locationPrefix: 'Booth',
    locationRequired: 'Location is required',
    photoLabel: 'Photo',
    photoAriaLabel: 'Add swag photo',
    camera: 'Take Photo',
    gallery: 'From Gallery',
    retake: 'Retake',
    imageError: 'Please select an image file.',
    submitError: 'Failed to post swag. Please try again.',
    uploading: 'Uploading…',
    submit: 'Post Swag',
  },
  leaderboard: {
    title: 'Leaderboard',
    subtitle: 'The ultimate swag rankings',
    mostClaimed: 'Most Claimed',
    mostCreated: 'Most Created',
    loadingAriaLabel: 'Loading leaderboard...',
    empty: 'No one on the board yet — start the hunt!',
    swagClaimed: 'swag claimed',
    swagCreated: 'swag created',
    you: 'You',
  },
  nav: {
    swagAriaLabel: 'Swag board',
    swag: 'Swag',
    leaderboardAriaLabel: 'Leaderboard',
    scores: 'Scores',
    signInAriaLabel: 'Sign in',
    signIn: 'Sign In',
    signOutAriaLabel: 'Sign out',
  },
};

type Translations = typeof EN;

const ES: Translations = {
  login: {
    subtitle: 'Encuentra, reclama y colecciona swag en eventos',
    signInGoogle: 'Continuar con Google',
    browseGuest: 'Explorar como invitado',
    guestNote: 'Solo lectura · sin reclamar ni marcador',
  },
  swag: {
    title: 'Tablero de Swag',
    addAriaLabel: 'Agregar nuevo swag',
    guestBanner: 'Explorando como invitado —',
    guestSignIn: 'Inicia sesión para reclamar y crear',
    filterAll: 'Todo',
    filterAvailable: 'Disponible',
    filterClaimed: 'Reclamado',
    loadingAriaLabel: 'Cargando swag...',
    empty: 'Aún no hay swag aquí.',
    addButton: 'Agregar Swag',
    claimedBadge: 'Reclamado',
    expiredBadge: 'Expirado',
    claimedBy: 'Reclamado por',
    signInToClaim: 'Inicia sesión para reclamar',
    claimNow: 'Reclamar',
    claiming: 'Reclamando…',
    markUnavailable: 'Ya no disponible',
  },
  create: {
    title: 'Agregar Swag',
    backAriaLabel: 'Atrás',
    titleLabel: 'Título',
    titlePlaceholder: 'ej. Sudadera Anthropic',
    titleRequired: 'El título es obligatorio',
    descriptionLabel: 'Descripción',
    descriptionPlaceholder: '¿Qué es este swag? ¿Hay restricciones de talla?',
    descriptionRequired: 'La descripción es obligatoria',
    locationLabel: 'Número de Stand',
    locationPlaceholder: '42',
    locationPrefix: 'Stand',
    locationRequired: 'La ubicación es obligatoria',
    photoLabel: 'Foto',
    photoAriaLabel: 'Agregar foto del swag',
    camera: 'Tomar Foto',
    gallery: 'De la Galería',
    retake: 'Volver a Tomar',
    imageError: 'Por favor selecciona un archivo de imagen.',
    submitError: 'Error al publicar el swag. Intenta de nuevo.',
    uploading: 'Subiendo…',
    submit: 'Publicar Swag',
  },
  leaderboard: {
    title: 'Marcador',
    subtitle: 'El ranking definitivo de swag',
    mostClaimed: 'Más Reclamado',
    mostCreated: 'Más Creado',
    loadingAriaLabel: 'Cargando marcador...',
    empty: 'Nadie en el marcador aún — ¡empieza la caza!',
    swagClaimed: 'swag reclamado',
    swagCreated: 'swag creado',
    you: 'Tú',
  },
  nav: {
    swagAriaLabel: 'Tablero de swag',
    swag: 'Swag',
    leaderboardAriaLabel: 'Marcador',
    scores: 'Puntos',
    signInAriaLabel: 'Iniciar sesión',
    signIn: 'Entrar',
    signOutAriaLabel: 'Cerrar sesión',
  },
};

const DICT: Record<Lang, Translations> = { en: EN, es: ES };

@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly lang = signal<Lang>((localStorage.getItem('lang') as Lang) ?? 'en');
  readonly t = computed(() => DICT[this.lang()]);

  toggle(): void {
    const next = this.lang() === 'en' ? 'es' : 'en';
    this.lang.set(next);
    localStorage.setItem('lang', next);
  }
}

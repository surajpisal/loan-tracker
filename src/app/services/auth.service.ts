import { Injectable, signal } from '@angular/core';

export interface UserProfile {
  email: string;
  name: string;
  picture: string;
  sub: string;
}

const AUTH_STORAGE_KEY = 'loan_tracker_user_session';

// Allowed logins whitelist
export const ALLOWED_EMAILS: string[] = [
  'your-email@gmail.com',     // <-- Replace with your primary Google email
  'vrushali-email@gmail.com'  // <-- Replace with Vrushali's Google email
];

declare const google: any;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Replace with your Google OAuth Web Client ID from Google Cloud Console
  readonly GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';

  currentUser = signal<UserProfile | null>(this.getStoredUser());
  authError = signal<string | null>(null);

  constructor() {
    this.initGoogleAuth();
  }

  private getStoredUser(): UserProfile | null {
    try {
      const data = localStorage.getItem(AUTH_STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  initGoogleAuth() {
    if (typeof window === 'undefined') return;

    const interval = setInterval(() => {
      if (typeof google !== 'undefined' && google.accounts?.id) {
        clearInterval(interval);
        google.accounts.id.initialize({
          client_id: this.GOOGLE_CLIENT_ID,
          callback: (response: any) => this.handleCredentialResponse(response),
          auto_select: false,
          cancel_on_tap_outside: true
        });
      }
    }, 100);
  }

  renderSignInButton(element: HTMLElement) {
    if (typeof google !== 'undefined' && google.accounts?.id) {
      google.accounts.id.renderButton(element, {
        theme: 'filled_blue',
        size: 'large',
        shape: 'pill',
        text: 'signin_with',
        width: 250
      });
    }
  }

  private handleCredentialResponse(response: any) {
    if (!response || !response.credential) {
      this.authError.set('Authentication failed. No credential received.');
      return;
    }

    try {
      const payload = this.decodeJwt(response.credential);
      const email = (payload.email || '').toLowerCase().trim();

      // Check against allowed email list
      const isAllowed = ALLOWED_EMAILS.some(e => e.toLowerCase().trim() === email);

      if (!isAllowed) {
        this.authError.set(`Access Denied: ${email} is not authorized to access this private loan portfolio.`);
        this.logout();
        return;
      }

      const user: UserProfile = {
        email,
        name: payload.name || email,
        picture: payload.picture || '',
        sub: payload.sub
      };

      this.currentUser.set(user);
      this.authError.set(null);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem('google_id_token', response.credential);

    } catch (err) {
      console.error('Failed to parse Google credentials', err);
      this.authError.set('Error validating Google session.');
    }
  }

  private decodeJwt(token: string): any {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  }

  logout() {
    this.currentUser.set(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem('google_id_token');
    if (typeof google !== 'undefined' && google.accounts?.id) {
      google.accounts.id.disableAutoSelect();
    }
  }

  isLoggedIn(): boolean {
    return !!this.currentUser();
  }
}

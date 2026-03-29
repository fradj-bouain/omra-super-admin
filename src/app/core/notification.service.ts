import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private snack = inject(MatSnackBar);

  success(message: string): void {
    this.snack.open(message, 'OK', { duration: 3500 });
  }

  error(message: string): void {
    this.snack.open(message, 'Fermer', { duration: 6000, panelClass: ['admin-snack-error'] });
  }
}

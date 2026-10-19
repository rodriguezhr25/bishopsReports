import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AsistenciaService } from '../services/asistencia.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private asistenciaService: AsistenciaService, private router: Router) {}

  async canActivate(): Promise<boolean> {
    const usuario = await this.asistenciaService.getUsuarioActual();
    if (usuario) {
      return true;
    } else {
      this.router.navigate(['/login']);
      return false;
    }
  }
}
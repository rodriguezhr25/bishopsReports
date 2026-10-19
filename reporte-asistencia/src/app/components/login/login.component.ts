import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AsistenciaService } from '../../services/asistencia.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email = '';
  password = '';
  errorMensaje = '';
  cargando = false;

  constructor(private asistenciaService: AsistenciaService, private router: Router) {}

  async onSubmit() {
    this.cargando = true;
    this.errorMensaje = '';
    try {
      await this.asistenciaService.login(this.email, this.password);
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      this.errorMensaje = 'Credenciales inválidas. Verifica tu correo y contraseña.';
    } finally {
      this.cargando = false;
    }
  }
}
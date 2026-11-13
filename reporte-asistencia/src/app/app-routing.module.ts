import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AdminFormComponent } from './components/admin-form/admin-form.component';
import { DashboardTrimestralComponent } from './components/dashboard-trimestral/dashboard-trimestral.component';
import { LoginComponent } from './components/login/login.component';
import { AuthGuard } from './guards/auth.guard';
import { SeguimientoComponent } from './components/seguimiento/seguimiento.component';
import { DashboardSeguimientoComponent } from './components/dashboard-seguimiento/dashboard-seguimiento.component';
import { EntrevistaObispoComponent } from './components/entrevista-obispo/entrevista-obispo.component';
import { ResumenObispoComponent } from './components/resumen-obispo/resumen-obispo.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'dashboard-trimestral', component: DashboardTrimestralComponent, canActivate: [AuthGuard] },
  { path: 'admin', component: AdminFormComponent, canActivate: [AuthGuard] },
  { path: 'dashboard-seguimiento', component: DashboardSeguimientoComponent, canActivate: [AuthGuard] },
  { path: 'seguimiento', component: SeguimientoComponent, canActivate: [AuthGuard] },
  { path: 'entrevista-obispo', component: EntrevistaObispoComponent, canActivate: [AuthGuard] },
  { path: 'resumen-obispo', component: ResumenObispoComponent, canActivate: [AuthGuard] },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
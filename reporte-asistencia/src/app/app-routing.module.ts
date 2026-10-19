import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AdminFormComponent } from './components/admin-form/admin-form.component';
import { DashboardTrimestralComponent } from './components/dashboard-trimestral/dashboard-trimestral.component';

const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'admin', component: AdminFormComponent },
  { path: 'trimestral', component: DashboardTrimestralComponent }, // 👈 Nueva ruta
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
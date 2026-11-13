import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AdminFormComponent } from './components/admin-form/admin-form.component';
import { DashboardTrimestralComponent } from './components/dashboard-trimestral/dashboard-trimestral.component';
import { LoginComponent } from './components/login/login.component'; // 👈 Importar
import { SeguimientoComponent } from './components/seguimiento/seguimiento.component';
import { DashboardSeguimientoComponent } from './components/dashboard-seguimiento/dashboard-seguimiento.component';
import { EntrevistaObispoComponent } from './components/entrevista-obispo/entrevista-obispo.component';
import { ResumenObispoComponent } from './components/resumen-obispo/resumen-obispo.component';

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    AdminFormComponent,
    DashboardTrimestralComponent,
    LoginComponent,
    SeguimientoComponent,
    DashboardSeguimientoComponent,
    EntrevistaObispoComponent,
    ResumenObispoComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
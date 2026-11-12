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

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    AdminFormComponent,
    DashboardTrimestralComponent,
    LoginComponent,
    SeguimientoComponent,
    DashboardSeguimientoComponent
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
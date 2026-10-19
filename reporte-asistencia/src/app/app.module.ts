import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AdminFormComponent } from './components/admin-form/admin-form.component';
import { DashboardTrimestralComponent } from './components/dashboard-trimestral/dashboard-trimestral.component'; // 👈 Importar

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    AdminFormComponent,
    DashboardTrimestralComponent 
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
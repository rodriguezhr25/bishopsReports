import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardSeguimientoComponent } from './dashboard-seguimiento.component';

describe('DashboardSeguimientoComponent', () => {
  let component: DashboardSeguimientoComponent;
  let fixture: ComponentFixture<DashboardSeguimientoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DashboardSeguimientoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardSeguimientoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

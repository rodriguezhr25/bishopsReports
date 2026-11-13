import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResumenObispoComponent } from './resumen-obispo.component';

describe('ResumenObispoComponent', () => {
  let component: ResumenObispoComponent;
  let fixture: ComponentFixture<ResumenObispoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ResumenObispoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ResumenObispoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

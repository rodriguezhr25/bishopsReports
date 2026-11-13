import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntrevistaObispoComponent } from './entrevista-obispo.component';

describe('EntrevistaObispoComponent', () => {
  let component: EntrevistaObispoComponent;
  let fixture: ComponentFixture<EntrevistaObispoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EntrevistaObispoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EntrevistaObispoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

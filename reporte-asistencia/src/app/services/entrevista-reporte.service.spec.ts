import { TestBed } from '@angular/core/testing';

import { EntrevistaReporteService } from './entrevista-reporte.service';

describe('EntrevistaReporteService', () => {
  let service: EntrevistaReporteService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EntrevistaReporteService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

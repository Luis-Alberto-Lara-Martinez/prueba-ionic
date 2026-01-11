import { TestBed } from '@angular/core/testing';

import { TestBackendService } from './test-backend.service';

describe('TestBackendService', () => {
    let service: TestBackendService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(TestBackendService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});

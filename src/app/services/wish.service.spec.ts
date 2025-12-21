import { TestBed } from '@angular/core/testing';
import { WishService } from './wish.service';
import { DataLoaderService } from './data-loader.service';
import { of } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';
import { DOCUMENT } from '@angular/common';

describe('WishService', () => {
    let service: WishService;
    let dataLoaderSpy: jasmine.SpyObj<DataLoaderService>;
    let routerSpy: jasmine.SpyObj<Router>;

    beforeEach(() => {
        const dataSpy = jasmine.createSpyObj('DataLoaderService', ['startLoading']);
        dataSpy.startLoading.and.returnValue(of({ UI: {} })); // Default mock for constructor
        const rSpy = jasmine.createSpyObj('Router', ['navigate']);

        TestBed.configureTestingModule({
            providers: [
                WishService,
                { provide: DataLoaderService, useValue: dataSpy },
                { provide: Router, useValue: rSpy },
                { provide: DOCUMENT, useValue: document },
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: { queryParams: {} }
                    }
                }
            ]
        });
        service = TestBed.inject(WishService);
        dataLoaderSpy = TestBed.inject(DataLoaderService) as jasmine.SpyObj<DataLoaderService>;
        routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should set mode correctly', () => {
        // Mock the data loading triggered by selectMode
        dataLoaderSpy.startLoading.and.returnValue(of({
            Oracle: { '1': 'Wish Text' }
        }));

        service.selectMode('Oracle');
        expect(service.mode()).toBe('Oracle');

        service.selectMode('MaxFrei');
        expect(service.mode()).toBe('MaxFrei');
    });

    it('should generate a wish when mode is selected', () => {
        const mockData = {
            Oracle: { '1': 'Test Wish' }
        };
        dataLoaderSpy.startLoading.and.returnValue(of(mockData));

        service.selectMode('Oracle');

        expect(service.generatedWish()).toBeTruthy();
        expect(service.generatedWish()?.text).toContain('Test Wish');
        expect(service.hasWish()).toBeTrue();
    });
});

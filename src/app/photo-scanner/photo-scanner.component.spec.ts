import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PhotoScannerComponent } from './photo-scanner.component';

describe('PhotoScannerComponent', () => {
  let component: PhotoScannerComponent;
  let fixture: ComponentFixture<PhotoScannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PhotoScannerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PhotoScannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

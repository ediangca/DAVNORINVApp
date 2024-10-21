import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RrspComponent } from './rrsp.component';

describe('RrspComponent', () => {
  let component: RrspComponent;
  let fixture: ComponentFixture<RrspComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RrspComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RrspComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

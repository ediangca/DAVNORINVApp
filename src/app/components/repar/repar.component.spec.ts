import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReparComponent } from './repar.component';

describe('ReparComponent', () => {
  let component: ReparComponent;
  let fixture: ComponentFixture<ReparComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReparComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReparComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

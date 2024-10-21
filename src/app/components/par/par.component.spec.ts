import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParComponent } from './par.component';

describe('ParComponent', () => {
  let component: ParComponent;
  let fixture: ComponentFixture<ParComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ParComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

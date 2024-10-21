import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrsComponent } from './prs.component';

describe('PrsComponent', () => {
  let component: PrsComponent;
  let fixture: ComponentFixture<PrsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

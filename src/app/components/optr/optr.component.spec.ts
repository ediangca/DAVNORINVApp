import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OptrComponent } from './optr.component';

describe('OptrComponent', () => {
  let component: OptrComponent;
  let fixture: ComponentFixture<OptrComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OptrComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OptrComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

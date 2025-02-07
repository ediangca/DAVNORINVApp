import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OprrComponent } from './oprr.component';

describe('OprrComponent', () => {
  let component: OprrComponent;
  let fixture: ComponentFixture<OprrComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OprrComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OprrComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

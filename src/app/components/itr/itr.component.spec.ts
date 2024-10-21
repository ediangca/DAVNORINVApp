import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItrComponent } from './itr.component';

describe('ItrComponent', () => {
  let component: ItrComponent;
  let fixture: ComponentFixture<ItrComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItrComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ItrComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

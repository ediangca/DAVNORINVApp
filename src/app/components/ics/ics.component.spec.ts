import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IcsComponent } from './ics.component';

describe('IcsComponent', () => {
  let component: IcsComponent;
  let fixture: ComponentFixture<IcsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IcsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IcsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

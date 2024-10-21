import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsergroupComponent } from './usergroup.component';

describe('UsergroupComponent', () => {
  let component: UsergroupComponent;
  let fixture: ComponentFixture<UsergroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsergroupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UsergroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

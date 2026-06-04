import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SetingThreeContainer } from './seting-three-container';

describe('SetingThreeContainer', () => {
  let component: SetingThreeContainer;
  let fixture: ComponentFixture<SetingThreeContainer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SetingThreeContainer],
    }).compileComponents();

    fixture = TestBed.createComponent(SetingThreeContainer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

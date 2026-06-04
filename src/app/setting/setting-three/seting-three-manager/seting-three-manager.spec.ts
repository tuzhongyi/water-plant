import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SetingThreeManager } from './seting-three-manager';

describe('SetingThreeManager', () => {
  let component: SetingThreeManager;
  let fixture: ComponentFixture<SetingThreeManager>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SetingThreeManager],
    }).compileComponents();

    fixture = TestBed.createComponent(SetingThreeManager);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

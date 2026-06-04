import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SystemMainThreeManager } from './system-main-three-manager';

describe('SystemMainThreeManager', () => {
  let component: SystemMainThreeManager;
  let fixture: ComponentFixture<SystemMainThreeManager>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SystemMainThreeManager],
    }).compileComponents();

    fixture = TestBed.createComponent(SystemMainThreeManager);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

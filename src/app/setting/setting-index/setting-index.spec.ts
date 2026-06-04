import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingIndex } from './setting-index';

describe('SettingIndex', () => {
  let component: SettingIndex;
  let fixture: ComponentFixture<SettingIndex>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingIndex],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingIndex);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

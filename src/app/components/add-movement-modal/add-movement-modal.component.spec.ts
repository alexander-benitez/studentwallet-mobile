import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddMovementModalComponent } from './add-movement-modal.component';

describe('AddMovementModalComponent', () => {
  let component: AddMovementModalComponent;
  let fixture: ComponentFixture<AddMovementModalComponent>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AddMovementModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

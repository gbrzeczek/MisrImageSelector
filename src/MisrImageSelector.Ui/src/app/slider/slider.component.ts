import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-slider',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './slider.component.html',
  styleUrl: './slider.component.scss'
})
export class SliderComponent implements OnInit {
  @Input({required: true}) reset$!: Observable<void>;
  @Input() set disabled(value: boolean) {
    this._disabled = value;
  }

  @Output() valueChange = new EventEmitter<number>();

  value: number = 50;

  private _disabled = false;

  get disabled(): boolean {
    return this._disabled;
  }

  ngOnInit() {
    this.reset$.subscribe(() => {
      this.value = 50;
    });
  }

  onInput() {
    this.valueChange.emit(this.value);
  }
}

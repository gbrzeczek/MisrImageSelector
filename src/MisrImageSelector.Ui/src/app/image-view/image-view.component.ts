import {
  AfterContentChecked,
  Component,
  ElementRef,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { SliderComponent } from '../slider/slider.component';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-image-view',
  standalone: true,
  imports: [SliderComponent],
  templateUrl: './image-view.component.html',
  styleUrl: './image-view.component.scss',
})
export class ImageViewComponent implements OnInit, AfterContentChecked {
  @Input({required: true}) src!: string;
  @Input({required: true}) backgroundPosition$!: Subject<string>;
  @Input({required: true}) mouseOff$!: Subject<void>;
  @ViewChild('image', { static: true })  imageElement!: ElementRef<HTMLImageElement>;

  isZoomed = false;

  zoomTop = 0;
  zoomLeft = 0;

  zoomWidth = 0;
  zoomHeight = 0;

  backgroundPosition = '0% 0%';

  private _isHovered = false;

  ngOnInit(): void {
    this.mouseOff$.subscribe(() => {
      if (!this._isHovered) {
        this.isZoomed = false;
      }
    });

    this.backgroundPosition$.subscribe((backgroundPosition) => {
      if (!this._isHovered) {
        this.backgroundPosition = backgroundPosition;
        this.isZoomed = true;
      }
    });
  }

  ngAfterContentChecked(): void {
    const rect = this.imageElement.nativeElement.getBoundingClientRect();

    const imageWidth = this.imageElement.nativeElement.width;
    const imageHeight = this.imageElement.nativeElement.height;

    const sizeProportion = 0.7;
    this.zoomWidth = imageWidth * sizeProportion;
    this.zoomHeight = imageHeight * sizeProportion;

    const xOffset = (rect.width - this.zoomWidth) / 2;
    const yOffset = (rect.height - this.zoomHeight) / 2;

    this.zoomLeft = rect.left + xOffset;
    this.zoomTop = rect.top + yOffset;
  }

  onMouseMove(event: MouseEvent) {
    this.isZoomed = true;
    this._isHovered = true;

    const percentShown = 0.2;
    const mouseOffset = percentShown / 2;

    const rect = this.imageElement.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const minX = rect.width * mouseOffset;
    const minY = rect.height * mouseOffset;
    const maxX = rect.width - rect.width * mouseOffset;
    const maxY = rect.height - rect.height * mouseOffset

    const xInBounds = Math.min(Math.max(x, minX), maxX);
    const yInBounds = Math.min(Math.max(y, minY), maxY);

    const bgX = ((xInBounds - minX) / (maxX - minX)) * 100;
    const bgY = ((yInBounds - minY) / (maxY - minY)) * 100;

    this.backgroundPosition = `${bgX}% ${bgY}%`;
    this.backgroundPosition$.next(this.backgroundPosition);
  }

  onMouseLeave() {
    this.isZoomed = false;
    this._isHovered = false;

    this.mouseOff$.next();
  }
}

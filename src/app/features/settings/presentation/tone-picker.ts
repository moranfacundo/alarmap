import { Component, DestroyRef, inject, model } from '@angular/core';
import { AlarmEngineService } from '../../../core/native/alarm-engine.service.ts';
import { View } from '@ng-native/components';
import { Chip } from '../../../shared/components/chip.ts';
import { TONES } from '../domain/tones.ts';

/**
 * Selector de tono entre los tonos empaquetados.
 * Al elegir un tono se previsualiza con el motor nativo (una pasada, volumen de alarma del sistema).
 */
@Component({
  selector: 'app-tone-picker',
  imports: [Chip, View],
  template: `
    <view class="row">
      @for (t of tones; track t.id) {
        <app-chip [label]="t.name" [selected]="toneId() === t.id" (select)="choose(t.id)" />
      }
    </view>
  `,
  styles: `
    .row {
      flex-direction: row;
      flex-wrap: wrap;
      gap: 8px;
    }
  `,
})
export class TonePicker {
  /** Id del tono elegido. Enlace bidireccional. */
  readonly toneId = model.required<string>();

  protected readonly tones = TONES;
  private readonly engine = inject(AlarmEngineService);

  constructor() {
    inject(DestroyRef).onDestroy(() => void this.engine.stopPreview().catch(() => {}));
  }

  protected choose(id: string): void {
    this.toneId.set(id);
    void this.engine.previewTone(id).catch(() => {}); // sin audio nativo no pasa nada
  }
}

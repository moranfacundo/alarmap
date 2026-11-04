import { Component, model } from '@angular/core';
import { View } from '@ng-native/components';
import { Chip } from '../../../shared/components/chip.ts';
import { TONES } from '../domain/tones.ts';

/**
 * Selector de tono entre los tonos empaquetados.
 * La previsualización requiere reproducción nativa y llegará con el motor Android (docs/OPEN_DECISIONS.md).
 */
@Component({
  selector: 'app-tone-picker',
  imports: [Chip, View],
  template: `
    <view class="row">
      @for (t of tones; track t.id) {
        <app-chip [label]="t.name" [selected]="toneId() === t.id" (select)="toneId.set(t.id)" />
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
}

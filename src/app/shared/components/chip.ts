import { Component, input, output } from '@angular/core';
import { Pressable, Text } from '@ng-native/components';

/** Botón tipo "chip" seleccionable (formato horario, tonos, días...). */
@Component({
  selector: 'app-chip',
  imports: [Pressable, Text],
  template: `
    <pressable
      class="chip"
      [class.selected]="selected()"
      accessibilityRole="button"
      [accessibilityState]="{ selected: selected() }"
      [accessibilityLabel]="label()"
      (press)="select.emit()"
    >
      <text class="label" [class.selected-text]="selected()">{{ label() }}</text>
    </pressable>
  `,
  styles: `
    .chip {
      min-height: 40px;
      padding: 0 16px;
      align-items: center;
      justify-content: center;
      border-radius: 20px;
      border-width: 1px;
      border-color: var(--border);
      background-color: var(--bg);
    }
    .chip.selected {
      background-color: var(--accent);
      border-color: var(--accent);
    }
    .label {
      font-size: 14px;
      font-weight: 500;
    }
    .label.selected-text {
      color: var(--on-accent);
    }
  `,
})
export class Chip {
  readonly label = input.required<string>();
  readonly selected = input(false);
  readonly select = output<void>();
}

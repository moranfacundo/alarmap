import { Component, input, output } from '@angular/core';
import { Pressable, Text, View } from '@ng-native/components';

/** Badge compacto para un token (ej. "x1 Aciclovir"). Con `removable` muestra una ✕ para quitarlo. */
@Component({
  selector: 'app-tag-badge',
  imports: [Pressable, Text, View],
  template: `
    <view class="badge">
      <text class="label" [numberOfLines]="1">{{ label() }}</text>
      @if (removable()) {
        <pressable
          class="remove"
          accessibilityRole="button"
          [accessibilityLabel]="'Quitar ' + label()"
          (press)="remove.emit()"
        >
          <text class="remove-text">✕</text>
        </pressable>
      }
    </view>
  `,
  styles: `
    .badge {
      flex-direction: row;
      align-items: center;
      align-self: flex-start;
      min-height: 28px;
      padding: 0 10px;
      gap: 6px;
      border-radius: 14px;
      border-width: 1px;
      border-color: var(--border);
      background-color: var(--surface-alt);
    }
    .label {
      font-size: 13px;
      font-weight: 500;
    }
    .remove {
      min-width: 24px;
      min-height: 28px;
      align-items: center;
      justify-content: center;
    }
    .remove-text {
      font-size: 12px;
      color: var(--text-muted);
    }
  `,
})
export class TagBadge {
  readonly label = input.required<string>();
  readonly removable = input(false);
  readonly remove = output<void>();
}

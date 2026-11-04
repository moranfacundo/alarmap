import { Component, inject } from '@angular/core';
import { Pressable, SafeAreaView, ScrollView, Text, View } from '@ng-native/components';
import { AppInfo } from '@ng-native/expo/app-info';
import { Browser } from '@ng-native/expo/browser';
import { NativeNavigation } from '@ng-native/router';
import { APP_DESCRIPTION, APP_NAME, AUTHOR } from '../../../core/config/app-info.ts';
import { TopBar } from '../../../shared/components/top-bar.ts';

/** "Acerca de": datos de la app, versión y autoría con enlaces a redes. */
@Component({
  selector: 'app-about-page',
  imports: [Pressable, SafeAreaView, ScrollView, Text, TopBar, View],
  template: `
    <safe-area-view class="screen">
      <app-top-bar title="Acerca de" [showBack]="true" (backPress)="back()" />

      <scroll-view class="scroll">
        <view class="content">
          <view class="hero">
            <text class="name">{{ appName }}</text>
            <text class="desc">{{ description }}</text>
            <text class="version">Versión {{ version }}</text>
          </view>

          <view class="card">
            <text class="caption">Desarrollado por</text>
            <text class="author">{{ author.name }}</text>
            @for (link of author.links; track link.id) {
              <pressable
                class="link"
                accessibilityRole="link"
                [accessibilityLabel]="link.label"
                (press)="open(link.url)"
              >
                <text class="link-label">{{ link.label }}</text>
                <text class="link-url" [numberOfLines]="1">{{ link.url }}</text>
              </pressable>
            }
          </view>
        </view>
      </scroll-view>
    </safe-area-view>
  `,
  styles: `
    :host {
      flex: 1;
    }
    .screen {
      flex: 1;
      background-color: var(--bg);
    }
    .scroll {
      flex: 1;
    }
    .content {
      gap: 24px;
      padding: 8px 16px 32px;
    }
    .hero {
      align-items: center;
      gap: 6px;
      padding: 16px 0;
    }
    .name {
      font-size: 32px;
      font-weight: 700;
    }
    .desc {
      font-size: 15px;
      color: var(--text-muted);
      text-align: center;
    }
    .version {
      font-size: 13px;
      color: var(--text-muted);
    }
    .card {
      gap: 4px;
      padding: 20px;
      border-radius: 24px;
      background-color: var(--surface);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18);
    }
    .caption {
      font-size: 13px;
      color: var(--text-muted);
    }
    .author {
      font-size: 22px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .link {
      min-height: 52px;
      justify-content: center;
      gap: 2px;
      border-top-width: 1px;
      border-top-color: var(--border);
    }
    .link-label {
      font-size: 16px;
      font-weight: 500;
    }
    .link-url {
      font-size: 13px;
      color: var(--text-muted);
    }
  `,
})
export class AboutPage {
  private readonly nav = inject(NativeNavigation);
  private readonly browser = inject(Browser);

  protected readonly appName = APP_NAME;
  protected readonly description = APP_DESCRIPTION;
  protected readonly author = AUTHOR;

  protected readonly version = (() => {
    const info = inject(AppInfo);
    return `${info.version ?? 'desconocida'}${info.build ? ` (${info.build})` : ''}`;
  })();

  protected back(): void {
    this.nav.back();
  }

  /** Abre el enlace en el navegador integrado. Solo se permiten URLs `https`. */
  protected async open(url: string): Promise<void> {
    if (!url.startsWith('https://')) return;
    await this.browser.open(url);
  }
}

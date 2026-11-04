import type { Routes } from '@angular/router';
import { AlarmEditorPage } from './features/alarms/presentation/alarm-editor.page.ts';
import { AlarmListPage } from './features/alarms/presentation/alarm-list.page.ts';
import { AboutPage } from './features/settings/presentation/about.page.ts';
import { SettingsPage } from './features/settings/presentation/settings.page.ts';

/** Rutas de la app (pila nativa). `alarm/new` va antes de `alarm/:id` para que no se confundan. */
export const routes: Routes = [
  { path: '', component: AlarmListPage },
  { path: 'alarm/new', component: AlarmEditorPage },
  { path: 'alarm/:id', component: AlarmEditorPage },
  { path: 'settings', component: SettingsPage },
  { path: 'about', component: AboutPage },
];

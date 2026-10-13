import type { Block, TitleInfo } from './lib/docx'

export interface LabReport {
  /** Назва файлу без розширення; перед нею додається прізвище */
  file: string
  /** title = null — бланк без титульної сторінки; docTitle — назва у властивостях файлу */
  build(): Promise<{ title: TitleInfo | null; body: Block[]; docTitle?: string }>
}

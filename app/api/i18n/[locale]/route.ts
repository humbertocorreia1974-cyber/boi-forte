import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const DICT: Record<string, Record<string, string>> = {
  'pt-BR': { 'nav.fazendas': 'Fazendas', 'nav.animais': 'Animais', 'nav.gmd': 'GMD', 'nav.abate': 'Projeção de abate', 'nav.rotacao': 'Rotação', 'nav.alertas': 'Alertas', 'nav.relatorios': 'Relatórios', 'action.salvar': 'Salvar', 'action.cancelar': 'Cancelar' },
  en: { 'nav.fazendas': 'Farms', 'nav.animais': 'Animals', 'nav.gmd': 'ADG', 'nav.abate': 'Slaughter forecast', 'nav.rotacao': 'Rotation', 'nav.alertas': 'Alerts', 'nav.relatorios': 'Reports', 'action.salvar': 'Save', 'action.cancelar': 'Cancel' },
  es: { 'nav.fazendas': 'Estancias', 'nav.animais': 'Animales', 'nav.gmd': 'GDP', 'nav.abate': 'Proyección de faena', 'nav.rotacao': 'Rotación', 'nav.alertas': 'Alertas', 'nav.relatorios': 'Informes', 'action.salvar': 'Guardar', 'action.cancelar': 'Cancelar' },
  fr: { 'nav.fazendas': 'Fermes', 'nav.animais': 'Animaux', 'nav.gmd': 'GMQ', 'nav.abate': 'Prévision d’abattage', 'nav.rotacao': 'Rotation', 'nav.alertas': 'Alertes', 'nav.relatorios': 'Rapports', 'action.salvar': 'Enregistrer', 'action.cancelar': 'Annuler' },
  de: { 'nav.fazendas': 'Betriebe', 'nav.animais': 'Tiere', 'nav.gmd': 'TZG', 'nav.abate': 'Schlachtprognose', 'nav.rotacao': 'Rotation', 'nav.alertas': 'Warnungen', 'nav.relatorios': 'Berichte', 'action.salvar': 'Speichern', 'action.cancelar': 'Abbrechen' },
  it: { 'nav.fazendas': 'Aziende', 'nav.animais': 'Animali', 'nav.gmd': 'IMG', 'nav.abate': 'Previsione macellazione', 'nav.rotacao': 'Rotazione', 'nav.alertas': 'Avvisi', 'nav.relatorios': 'Report', 'action.salvar': 'Salva', 'action.cancelar': 'Annulla' },
  ja: { 'nav.fazendas': '農場', 'nav.animais': '家畜', 'nav.gmd': '日増体', 'nav.abate': '出荷予測', 'nav.rotacao': '輪換', 'nav.alertas': 'アラート', 'nav.relatorios': 'レポート', 'action.salvar': '保存', 'action.cancelar': 'キャンセル' },
  zh: { 'nav.fazendas': '牧场', 'nav.animais': '牲畜', 'nav.gmd': '日增重', 'nav.abate': '出栏预测', 'nav.rotacao': '轮牧', 'nav.alertas': '警报', 'nav.relatorios': '报表', 'action.salvar': '保存', 'action.cancelar': '取消' },
  ru: { 'nav.fazendas': 'Фермы', 'nav.animais': 'Животные', 'nav.gmd': 'СПП', 'nav.abate': 'Прогноз убоя', 'nav.rotacao': 'Ротация', 'nav.alertas': 'Оповещения', 'nav.relatorios': 'Отчёты', 'action.salvar': 'Сохранить', 'action.cancelar': 'Отмена' },
  ar: { 'nav.fazendas': 'المزارع', 'nav.animais': 'الحيوانات', 'nav.gmd': 'معدل النمو', 'nav.abate': 'توقع الذبح', 'nav.rotacao': 'التناوب', 'nav.alertas': 'التنبيهات', 'nav.relatorios': 'التقارير', 'action.salvar': 'حفظ', 'action.cancelar': 'إلغاء' },
  hi: { 'nav.fazendas': 'फार्म', 'nav.animais': 'पशु', 'nav.gmd': 'दैनिक वृद्धि', 'nav.abate': 'वध पूर्वानुमान', 'nav.rotacao': 'चक्रण', 'nav.alertas': 'अलर्ट', 'nav.relatorios': 'रिपोर्ट', 'action.salvar': 'सहेजें', 'action.cancelar': 'रद्द करें' },
  id: { 'nav.fazendas': 'Peternakan', 'nav.animais': 'Hewan', 'nav.gmd': 'PBBH', 'nav.abate': 'Perkiraan sembelih', 'nav.rotacao': 'Rotasi', 'nav.alertas': 'Peringatan', 'nav.relatorios': 'Laporan', 'action.salvar': 'Simpan', 'action.cancelar': 'Batal' },
  nl: { 'nav.fazendas': 'Bedrijven', 'nav.animais': 'Dieren', 'nav.gmd': 'DGV', 'nav.abate': 'Slachtprognose', 'nav.rotacao': 'Rotatie', 'nav.alertas': 'Meldingen', 'nav.relatorios': 'Rapporten', 'action.salvar': 'Opslaan', 'action.cancelar': 'Annuleren' },
  pl: { 'nav.fazendas': 'Gospodarstwa', 'nav.animais': 'Zwierzęta', 'nav.gmd': 'PDD', 'nav.abate': 'Prognoza uboju', 'nav.rotacao': 'Rotacja', 'nav.alertas': 'Alerty', 'nav.relatorios': 'Raporty', 'action.salvar': 'Zapisz', 'action.cancelar': 'Anuluj' },
  tr: { 'nav.fazendas': 'Çiftlikler', 'nav.animais': 'Hayvanlar', 'nav.gmd': 'GCAA', 'nav.abate': 'Kesim tahmini', 'nav.rotacao': 'Rotasyon', 'nav.alertas': 'Uyarılar', 'nav.relatorios': 'Raporlar', 'action.salvar': 'Kaydet', 'action.cancelar': 'İptal' },
  ko: { 'nav.fazendas': '농장', 'nav.animais': '가축', 'nav.gmd': '일당증체', 'nav.abate': '출하 예측', 'nav.rotacao': '윤환', 'nav.alertas': '알림', 'nav.relatorios': '보고서', 'action.salvar': '저장', 'action.cancelar': '취소' },
  th: { 'nav.fazendas': 'ฟาร์ม', 'nav.animais': 'สัตว์', 'nav.gmd': 'อัตราการเจริญเติบโต', 'nav.abate': 'คาดการณ์การฆ่า', 'nav.rotacao': 'การหมุนเวียน', 'nav.alertas': 'การแจ้งเตือน', 'nav.relatorios': 'รายงาน', 'action.salvar': 'บันทึก', 'action.cancelar': 'ยกเลิก' },
  vi: { 'nav.fazendas': 'Trang trại', 'nav.animais': 'Gia súc', 'nav.gmd': 'Tăng trọng ngày', 'nav.abate': 'Dự báo giết mổ', 'nav.rotacao': 'Luân chuyển', 'nav.alertas': 'Cảnh báo', 'nav.relatorios': 'Báo cáo', 'action.salvar': 'Lưu', 'action.cancelar': 'Hủy' },
};

export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const dict = DICT[locale];
  if (!dict) {
    return NextResponse.json({ error: 'Locale não suportado' }, { status: 404 });
  }
  return NextResponse.json({ locale, dict }, { headers: { 'Cache-Control': 'public, max-age=3600' } });
}

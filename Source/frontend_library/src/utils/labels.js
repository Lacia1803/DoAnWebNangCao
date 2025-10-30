// Vietnamese labels and helpers

export const categoryVN = {
  // Seeded categories -> Vietnamese display
  Fiction: 'Văn học',
  Mystery: 'Trinh thám',
  Fantasy: 'Giả tưởng',
  Science: 'Khoa học',
  History: 'Lịch sử',
  Biography: 'Tiểu sử',
  Technology: 'Công nghệ',
  Philosophy: 'Triết học',
  'Self-help': 'Kỹ năng sống',
  Business: 'Kinh doanh',
  Classics: 'Kinh điển',
  Psychology: 'Tâm lý học'
};

export function toCategoryVN(cat) {
  if (!cat) return '';
  return categoryVN[cat] || cat; // fallback to original if not mapped
}

export const statusVN = {
  borrowed: 'Đang mượn',
  returned: 'Đã trả',
  overdue: 'Quá hạn'
};

export function toStatusVN(s) {
  return statusVN[s] || s || '';
}

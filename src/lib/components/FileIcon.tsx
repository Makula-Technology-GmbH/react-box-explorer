import type { BoxNode } from '../types';

function getExtColor(ext: string): string {
  if (['pdf'].includes(ext)) return '#E53935';
  if (['doc', 'docx'].includes(ext)) return '#2196F3';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return '#4CAF50';
  if (['ppt', 'pptx'].includes(ext)) return '#FF9800';
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) return '#9C27B0';
  if (['mp4', 'mov', 'avi', 'webm'].includes(ext)) return '#F44336';
  if (['zip', 'rar', 'tar', 'gz'].includes(ext)) return '#795548';
  if (['js', 'ts', 'py', 'java', 'rb', 'go', 'rs'].includes(ext)) return '#607D8B';
  return '#8C8C8C';
}

export function FileIcon({
  item,
  size = 20,
  className,
}: {
  item: BoxNode;
  size?: number;
  className?: string;
}) {
  if (item.type === 'folder') {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
        <path d="M3 6h9.5l3 3H29v18H3z" fill="#2486FC" />
      </svg>
    );
  }

  const ext = item.extension?.toLowerCase() || '';
  const color = getExtColor(ext);

  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <path d="M6 2h12l8 8v20H6z" fill={color} opacity="0.15" />
      <path d="M6 2h12l8 8v20H6z" stroke={color} strokeWidth="1.5" fill="none" />
      <path d="M18 2v8h8" stroke={color} strokeWidth="1.5" fill="none" />
      {ext && (
        <text x="16" y="24" textAnchor="middle" fill={color} fontSize="7" fontWeight="600">
          {ext.toUpperCase().slice(0, 4)}
        </text>
      )}
    </svg>
  );
}

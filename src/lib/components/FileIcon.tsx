import type { BoxNode } from '../types';

/* ---- Fold corner paths ---- */
const FOLD_WHITE = "m19.286 3.286 5.01 5.009 1.412 1.412a1 1 0 0 1 .203.293H21a2 2 0 0 1-2-2V3.09a1 1 0 0 1 .286.196Z";
const FOLD_TINTED = "m19.286 3.286 6.422 6.421a.994.994 0 0 1 .203.293H21a2.001 2.001 0 0 1-1.995-1.85L19 8V3.09c.105.048.202.114.286.196Z";
const BODY = "M9 3h9.586a1 1 0 0 1 .707.293l6.415 6.414a1 1 0 0 1 .293.707V26A2.999 2.999 0 0 1 23 29H9a3 3 0 0 1-3-3V6a3 3 0 0 1 9-3Z";
const BODY_ROUNDED = "M9 3h9.586c.265 0 .52.105.707.293l6.415 6.414a1 1 0 0 1 .293.707V26A3.002 3.002 0 0 1 23 29H9a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Z";

type IconDef = {
  color: string;
  foldColor?: string;
  content?: React.ReactNode;
};

function DocBody({ color, foldColor, content, size }: IconDef & { size: number }) {
  const isRounded = !!(foldColor);
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" role="img">
      <path fill={color} d={isRounded ? BODY_ROUNDED : BODY} />
      <path
        fill={foldColor ?? 'white'}
        fillOpacity={foldColor ? 1 : 0.5}
        d={foldColor ? FOLD_TINTED : FOLD_WHITE}
      />
      {content}
    </svg>
  );
}

/* ---- Extension → icon mapping (mirrors Box's EXTENSIONS map) ---- */
function getIconDef(ext: string): IconDef {
  switch (true) {
    case ['pdf'].includes(ext):
      return {
        color: '#D0021B',
        content: (
          <path fill="white" d="M13.133 16.998c0 .354-.054.66-.162.918a1.744 1.744 0 0 1-1.044 1.012c-.222.08-.457.121-.693.122h-.62v2.322H9.2V15h1.98c.228 0 .457.033.688.099a1.655 1.655 0 0 1 1.09.945c.117.258.175.576.175.954Zm-1.35.027c0-.288-.069-.495-.207-.621a.72.72 0 0 0-.504-.189h-.459v1.665h.46a.664.664 0 0 0 .503-.22c.138-.148.207-.359.207-.635Zm6.854 1.179c0 .48-.052.915-.157 1.305-.106.39-.266.723-.482.999a2.14 2.14 0 0 1-.824.639c-.333.15-.727.225-1.183.225h-1.79V15h1.79c.456 0 .85.075 1.183.225.334.15.608.364.824.643.216.28.376.615.482 1.008.105.394.157.836.157 1.328Zm-1.449 0c0-.642-.11-1.126-.328-1.454-.22-.327-.503-.49-.85-.49h-.352v3.852h.351c.348 0 .631-.163.85-.49.22-.328.33-.8.33-1.418Zm3.961-1.899v1.296h1.521v1.233h-1.512v2.538H19.7V15h3.105v1.305H21.15Z" />
        ),
      };

    case ['doc', 'docx', 'docm', 'dot', 'dotx', 'odt', 'rtf'].includes(ext):
      return {
        color: '#185ABD',
        foldColor: '#8BACDE',
        content: (
          <path fill="white" d="M20.25 25a.748.748 0 0 0 .75-.75v-10.5a.748.748 0 0 0-.75-.75H12a.748.748 0 0 0-.75.75v1.5h-1.5A.748.748 0 0 0 9 16v6a.748.748 0 0 0 .75.75h1.5v1.5A.748.748 0 0 0 12 25h8.25Zm0-9.75H12v-1.5h8.25v1.5Zm0 3H16.5V16h3.75v2.25Zm-8.104 3.188h-1.26l-1.083-4.875h1.207l.55 2.8.61-2.8h1.184l.638 2.783.51-2.784h1.195l-1.078 4.875h-1.242l-.633-2.8-.598 2.8v.001Zm8.104-.188H16.5V19h3.75v2.25Zm0 3H12v-1.5h3.75a.748.748 0 0 0 .75-.75h3.75v2.25Z" />
        ),
      };

    case ['xls', 'xlsx', 'xlsm', 'xlsb', 'xlt', 'xltx', 'ods'].includes(ext):
      return {
        color: '#107C41',
        foldColor: '#87BDA0',
        content: (
          <path fill="white" d="M20.25 25a.748.748 0 0 0 .75-.75v-10.5a.748.748 0 0 0-.75-.75H12a.748.748 0 0 0-.75.75v1.5h-1.5A.748.748 0 0 0 9 16v6a.748.748 0 0 0 .75.75h1.5v1.5A.748.748 0 0 0 12 25h8.25Zm-4.5-9.75H12v-1.5h3.75v1.5Zm4.5 0H16.5v-1.5h3.75v1.5Zm0 3H16.5V16h3.75v2.25Zm-8.344 3.188h-1.511l1.582-2.45-1.442-2.425h1.518l.756 1.494.82-1.494h1.43l-1.483 2.42 1.518 2.454H13.6l-.838-1.564-.856 1.564v.001Zm8.344-.188H16.5V19h3.75v2.25Zm0 3H16.5V22h3.75v2.25Zm-4.5 0H12v-1.5h3.75v1.5Z" />
        ),
      };

    case ['csv', 'tsv'].includes(ext):
      return {
        color: '#107C41',
        foldColor: '#87BDA0',
        content: (
          <path fill="white" d="M20.25 25a.748.748 0 0 0 .75-.75v-10.5a.748.748 0 0 0-.75-.75H12a.748.748 0 0 0-.75.75v1.5h-1.5A.748.748 0 0 0 9 16v6a.748.748 0 0 0 .75.75h1.5v1.5A.748.748 0 0 0 12 25h8.25Zm-4.5-9.75H12v-1.5h3.75v1.5Zm4.5 0H16.5v-1.5h3.75v1.5Zm0 3H16.5V16h3.75v2.25Zm-8.344 3.188h-1.511l1.582-2.45-1.442-2.425h1.518l.756 1.494.82-1.494h1.43l-1.483 2.42 1.518 2.454H13.6l-.838-1.564-.856 1.564v.001Zm8.344-.188H16.5V19h3.75v2.25Zm0 3H16.5V22h3.75v2.25Zm-4.5 0H12v-1.5h3.75v1.5Z" />
        ),
      };

    case ['ppt', 'pptx', 'pptm', 'odp', 'pot', 'potx'].includes(ext):
      return {
        color: '#C43E1C',
        foldColor: '#E19E8D',
        content: (
          <path fill="white" d="M16 24a5.947 5.947 0 0 0 4.239-1.76 6.07 6.07 0 0 0 .94-1.214c.262-.443.465-.92.607-1.432A5.862 5.862 0 0 0 22 18a5.947 5.947 0 0 0-1.76-4.239 6.07 6.07 0 0 0-1.214-.94 5.894 5.894 0 0 0-1.432-.607A5.862 5.862 0 0 0 16 12c-.457 0-.904.05-1.342.152a6.123 6.123 0 0 0-1.257.44c-.4.191-.776.427-1.128.706-.351.28-.67.597-.955.952h-.568A.748.748 0 0 0 10 15v6a.748.748 0 0 0 .75.75h.568c.286.355.604.673.955.952.352.28.728.515 1.128.706.4.192.82.338 1.257.44.438.101.885.152 1.342.152Zm0-9.75h-3.668A5.186 5.186 0 0 1 16 12.75v1.5Zm5.197 3H17.5V15a.73.73 0 0 0-.219-.527.847.847 0 0 0-.241-.161.703.703 0 0 0-.29-.062v-1.447a5.086 5.086 0 0 1 1.617.512c.504.26.951.585 1.342.976.39.39.716.838.976 1.342.26.504.43 1.043.512 1.617Zm-7.869 3.188h-1.213v-4.875h1.887c.258 0 .495.03.712.093.217.063.402.16.557.29.154.131.275.297.363.498.088.202.132.439.132.712 0 .266-.047.503-.141.712-.094.21-.223.386-.387.53a1.688 1.688 0 0 1-.577.331c-.22.077-.458.115-.712.115h-.62v1.593Zm.527-2.655c.207 0 .369-.043.484-.129.115-.086.173-.24.173-.463 0-.214-.056-.36-.167-.439-.112-.078-.267-.117-.466-.117h-.55v1.148h.526ZM16 23.25a5.186 5.186 0 0 1-3.668-1.5h4.418a.748.748 0 0 0 .75-.75v-3.006h3.75c0 .485-.063.95-.188 1.395a5.251 5.251 0 0 1-1.353 2.32 5.258 5.258 0 0 1-2.317 1.353A5.155 5.155 0 0 1 16 23.25Z" />
        ),
      };

    case ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'tif', 'tiff', 'webp', 'heic', 'heif'].includes(ext):
      return {
        color: '#3FB87F',
        content: (
          <path fill="white" fillRule="evenodd" d="m14.754 18.128 3.102 3.204 1.327-1.625c.158-.193.415-.193.575 0l2.06 2.485c.37.446.159.808-.472.808H10.63c-.633 0-.82-.341-.414-.767l3.9-4.089a.444.444 0 0 1 .64-.016ZM17.5 14a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" clipRule="evenodd" />
        ),
      };

    case ['mp4', '3gp', '3g2', 'avi', 'flv', 'm4v', 'mkv', 'mov', 'mpeg', 'mpg', 'ogg', 'wmv', 'webm'].includes(ext):
      return {
        color: '#009AED',
        content: (
          <path fill="white" fillRule="evenodd" d="m19.723 18.973-5.914 3.957a.543.543 0 0 1-.809-.473v-7.914a.543.543 0 0 1 .809-.473l5.914 3.957a.544.544 0 0 1 0 .946Z" clipRule="evenodd" />
        ),
      };

    case ['aac', 'aif', 'aiff', 'flac', 'm4a', 'mp3', 'wav', 'wma', 'mid'].includes(ext):
      return {
        color: '#9F3FED',
        content: (
          <path fill="white" d="M18.75 17h-5.5a.25.25 0 0 0-.25.25v4.25a1.5 1.5 0 1 1-1.5-1.5.9.9 0 0 1 .5.1v-6.35a.75.75 0 0 1 .75-.75h6.5a.75.75 0 0 1 .75.75v7.75a1.5 1.5 0 1 1-1.5-1.5.9.9 0 0 1 .5.1v-2.85a.25.25 0 0 0-.25-.25Zm-5.5-1h5.5a.25.25 0 0 0 .25-.25V14.5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0-.5.5v1.25c0 .138.112.25.25.25Z" />
        ),
      };

    case ['zip', 'rar', 'tgz', 'tar', 'gz', '7z'].includes(ext):
      return {
        color: '#D3D3D3',
        content: (
          <path fill="#4E4E4E" d="M10 24h1v1h-1v-1Zm0-2h1v1h-1v-1Zm0-2h1v1h-1v-1Zm0-2h1v1h-1v-1Zm0-2h1v1h-1v-1Zm0-2h1v1h-1v-1Zm0-2h1v1h-1v-1Zm0-2h1v1h-1V8Zm1 15h1v1h-1v-1Zm0-2h1v1h-1v-1Zm0-2h1v1h-1v-1Zm0-2h1v1h-1v-1Zm0-2h1v1h-1v-1Zm0-2h1v1h-1v-1Zm0-2h1v1h-1V9Z" />
        ),
      };

    case ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'c', 'cpp', 'cs', 'html', 'css', 'php', 'rb', 'go', 'rs', 'sql', 'sh', 'yaml', 'yml', 'json', 'xml', 'md'].includes(ext):
      return {
        color: '#E33D55',
        content: (
          <path fill="white" d="M17.553 13.776a.5.5 0 0 1 .894.448l-4 8a.5.5 0 0 1-.894-.448l4-8Zm-4.83 1.808a.5.5 0 1 1 .554.832L10.901 18l2.376 1.584a.5.5 0 1 1-.554.832l-3-2a.5.5 0 0 1 0-.832l3-2Zm6.554 0 3 2a.5.5 0 0 1 0 .832l-3 2a.502.502 0 0 1-.778-.513.5.5 0 0 1 .224-.319L21.1 18l-2.376-1.584a.5.5 0 0 1 .554-.832Z" />
        ),
      };

    default:
      return { color: '#D3D3D3' };
  }
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
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" role="img" className={className}>
        <path
          fill="#FFD700"
          fillRule="evenodd"
          d="M6 6h6c2 0 1.5 2 4 2h10a3 3 0 0 1 3 3v13a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3Z"
          clipRule="evenodd"
        />
        <path
          fill="white"
          fillOpacity={0.5}
          fillRule="evenodd"
          d="M6 11h20a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V14a3 3 0 0 1 3-3Z"
          clipRule="evenodd"
        />
      </svg>
    );
  }

  const ext = item.extension?.toLowerCase() ?? '';
  const def = getIconDef(ext);

  return (
    <span className={className} style={{ display: 'inline-flex', flexShrink: 0 }}>
      <DocBody size={size} {...def} />
    </span>
  );
}

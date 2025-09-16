// TypeScript declarations for Iconify web components
declare namespace JSX {
  interface IntrinsicElements {
    'iconify-icon': {
      icon?: string;
      width?: string | number;
      height?: string | number;
      'inline'?: boolean;
      'flip'?: string;
      'rotate'?: string | number;
      'style'?: React.CSSProperties;
      'class'?: string;
      'className'?: string;
    };
  }
}
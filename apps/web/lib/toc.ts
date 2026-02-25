export interface TocItem {
  level: number;
  text: string;
  href: string;
}

export interface MobTocProps {
  tocs: TocItem[];
}

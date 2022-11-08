export interface PageSection {
  id: string;
  title: string;
  children?: Array<PageSection>;
}

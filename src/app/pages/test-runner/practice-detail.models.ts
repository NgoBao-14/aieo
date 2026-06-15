import { QuestionGroup } from '../../models/app.models';

export interface TemplateSegment {
  kind: 'html' | 'blank';
  value: string;
}

export interface HeadingChoice {
  value: string;
  text: string;
}

export interface PreparedGroup {
  raw: QuestionGroup;
  mode: 'template' | 'grid' | 'headings' | 'multi-select' | 'choice' | 'input';
  segments: TemplateSegment[];
  headingChoices: HeadingChoice[];
}

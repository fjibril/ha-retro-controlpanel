declare module '*.html' {
  import { TemplateResult } from 'lit';
  function template(this: any): TemplateResult;
  export default template;
}

declare module "*.png" {
const value: string;
export default value;
}
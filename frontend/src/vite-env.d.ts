/// <reference types="react" />
/// <reference types="react-dom" />
/// <reference types="vite/client" />

declare namespace React {
  interface FC<P = {}> {
    (props: P, context?: any): ReactElement<any, any> | null;
    displayName?: string;
    propTypes?: any;
    contextTypes?: any;
    defaultProps?: Partial<P>;
    memo?: any;
  }
}

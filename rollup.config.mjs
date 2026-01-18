import importLitHtml from 'rollup-plugin-import-lithtml';
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import nodeResolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import serve from "rollup-plugin-serve";
import livereload from "rollup-plugin-livereload";
//import ignore from "./rollup-plugins/rollup-ignore-plugin.js";
import image from '@rollup/plugin-image';
import { createFilter } from '@rollup/pluginutils';

/*
const IGNORED_FILES = [
  "@material/mwc-notched-outline/mwc-notched-outline.js",
  "@material/mwc-ripple/mwc-ripple.js",
  "@material/mwc-list/mwc-list.js",
  "@material/mwc-list/mwc-list-item.js",
  "@material/mwc-menu/mwc-menu.js",
  "@material/mwc-menu/mwc-menu-surface.js",
  "@material/mwc-icon/mwc-icon.js",
];
*/
const dev = process.env.ROLLUP_WATCH === 'true';
const live = process.env.LIVERELOAD === 'true';
const liveHost = process.env.LIVERELOAD_HOST || 'localhost';
const livePort = Number(process.env.LIVERELOAD_PORT || 35729);
const production = !dev;

const serveOptions = {
  contentBase: ["./dist"],
  host: "0.0.0.0",
  port: 4000,
  allowCrossOrigin: true,
  headers: {
    "Access-Control-Allow-Origin": "*",
  },
};

const plugins = [
  /*ignore({
    files: IGNORED_FILES.map((file) => require.resolve(file)),
  }),*/
  nodeResolve({
    browser: true,
    extensions: [".js", ".ts", ".mjs"],
    exportConditions: ['default', 'module', 'import'],
  }),
  importLitHtml(),
  image({
    // Images smaller than 10KB will be inlined as base64
    // Larger ones will be copied to output directory
    limit: 10000,  // bytes
    hash: true,    // add hash to filename for cache busting
    exclude: null,
    include: ['**/*.png', '**/*.jpg', '**/*.gif', '**/*.svg']
  }),
  typescript({
    // Ensure the plugin uses the local tsconfig so wildcard `.d.ts` files
    // (for example `src/types.d.ts` which declares `*.html`) are picked up.
    tsconfig: dev ? './tsconfig.dev.json' : './tsconfig.json',
    sourceMap: dev,           // Generate sourcemaps in dev
    inlineSources: dev,
    exclude: ["**/*.test.ts", "**/__tests__/**"],
  }),

  json(),
  commonjs(),
  ...(dev ? [
    serve(serveOptions),
    ...(live ? [livereload({ watch: 'dist', delay: 200, host: liveHost, port: livePort })] : []),
  ] : [terser()]),
];

// Exclude test files from the bundle
const testFilter = createFilter([
  '**/*.test.ts',
  '**/__tests__/**',
]);

export default [
  {
    input: "src/index.ts",
    output: {
      file: "dist/retro-controlpanel-card.js",
      format: "es",
      inlineDynamicImports: true,
      sourcemap: dev ? 'inline' : false,
      indent: dev ? '  ' : false,
    },
    plugins: [
      ...plugins,
      {
        name: 'exclude-tests',
        load(id) {
          if (testFilter(id)) {
            return { code: '', map: { mappings: '' } };
          }
        },
      },
    ],
    //do I need these modules? Check later before committing
    moduleContext: (id) => {
      const thisAsWindowForModules = [
        "node_modules/@formatjs/intl-utils/lib/src/diff.js",
        "node_modules/@formatjs/intl-utils/lib/src/resolve-locale.js",
      ];
      if (thisAsWindowForModules.some((id_) => id.trimRight().endsWith(id_))) {
        return "window";
      }
    },
  },
];
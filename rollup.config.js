import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';

const config = (format) => ({
  entry: 'src/interruptible.js',
  format,
  plugins: [
    resolve(),
    commonjs({
      include: "node_modules/**"
    }),
    babel({
      exclude: 'node_modules/**',
      runtimeHelpers: true,
    })
  ],
  dest: `dist/index.${format}.js`,
  moduleName: 'interruptible',
})

export default [
  config('cjs'),
  config('umd'),
  config('es'),
]

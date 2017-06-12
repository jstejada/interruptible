import babel from 'rollup-plugin-babel';

const config = (format) => ({
  entry: 'src/interruptible.js',
  format,
  plugins: [
    babel({
      exclude: 'node_modules/**',
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

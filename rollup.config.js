import babel from 'rollup-plugin-babel';
import pkg from './package.json'

export default {
	input: 'src/searchjs.js',
	output: {
		name: 'SEARCHJS',
		format: 'umd',
		banner: `/* @license searchjs.js v${pkg.version} */`
	},
	plugins: [babel({
		presets: [['es2015', {
			modules: false
		}],
			['env', {
				modules: false
			}]],
		plugins: [
			'external-helpers'
		],
	})]
};

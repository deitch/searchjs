import babel from 'rollup-plugin-babel';
import pkg from './package.json'

export default {
	input: 'src/searchjs.js',
	output: {
		file: pkg.main,
		name: 'SEARCHJS',
		format: 'umd',
		banner: `/* @license searchjs | (c) Searchjs Team and other contributors | https://github.com/deitch/searchjs */`
	},
	plugins: [babel({
		presets: [['@babel/preset-env', {
			modules: false
		}],
		],
	})]
};

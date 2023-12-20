import json from '@rollup/plugin-json'
import terser from '@rollup/plugin-terser'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import { readFileSync } from 'fs'
import typescript from '@rollup/plugin-typescript'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

const pkg = JSON.parse(readFileSync(path.join(__dirname, './package.json'), 'utf-8'))
const dependencies = (res) => {
	return Object.keys(res.dependencies || {})
}

const pkgdependencies = dependencies(pkg)

const generateBuildPathUrl = (url = '') => {
	return `dist/${url}`
}

export default {
	external: id => pkgdependencies.includes(id),
	input: 'src/index.ts',
	output: [
		{
			file: generateBuildPathUrl('index.cjs'),
			format: 'cjs',
			plugins: [terser()]
		},
		{
			file: generateBuildPathUrl('index.mjs'),
			format: 'es',
			name: 'version',
			plugins: [terser()]
		}
	],
	plugins: [
		nodeResolve({ preferBuiltins: true }),
		json(),
		typescript(),
		commonjs()
	]
}
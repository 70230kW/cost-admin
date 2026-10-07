import js from '@eslint/js';
import tseslint from 'typescript-eslint';
export default tseslint.config(
  { ignores: ['dist/**', 'dist-demo/**', 'node_modules/**'] },
  js.configs.recommended, ...tseslint.configs.recommended,
  { rules: { 'no-console': 'error', 'no-eval': 'error', 'no-new-func': 'error' } },
);

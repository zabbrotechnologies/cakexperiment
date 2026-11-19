import * as esbuild from 'esbuild';

async function build() {
  await esbuild.build({
    entryPoints: ['server/neonApi.ts'],
    bundle: true,
    platform: 'node',
    format: 'esm',
    banner: {
      js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);"
    },
    outfile: 'api/neonApiBundle.js'
  });
  console.log('neonApiBundle.js bundled successfully.');
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});

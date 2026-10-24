set -e
cd "$(dirname "$0")"
node build.mjs "$1"
npx esbuild stage.js --bundle --format=esm --platform=neutral --legal-comments=none --outfile=out.js --log-level=warning
npx prettier out.js > pretty.js
python3 - <<'PY'
s=open('pretty.js').read()
s=s.replace('          let y = H(await s.store.get("seen"));\n        }\n        async function b(','        }\n        async function b(')
open('pretty.js','w').write(s)
PY

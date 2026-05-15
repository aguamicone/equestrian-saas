const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function traverse(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            traverse(fullPath);
        } else if (fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let original = content;
            
            const replacements = [
                [/bg-slate-800 rounded-lg border border-slate-700 p-6/g, 'glass-card p-6'],
                [/bg-slate-800 rounded-lg border border-slate-700 overflow-hidden/g, 'glass-card overflow-hidden'],
                [/bg-slate-800 rounded-lg border border-slate-700/g, 'glass-card'],
                [/bg-slate-800 p-8 rounded-lg shadow-2xl w-full max-w-md border border-slate-700/g, 'glass-panel p-8 w-full max-w-md'],
                [/bg-slate-800 p-8 rounded-lg shadow-lg/g, 'glass-panel p-8'],
                [/bg-slate-800 border border-slate-700 p-4 rounded-xl flex items-center justify-between/g, 'glass-card p-4 flex items-center justify-between'],
                [/bg-slate-800 w-full max-w-lg rounded-xl border border-slate-700 shadow-2xl/g, 'glass-panel w-full max-w-lg'],
                [/bg-slate-800 p-4 rounded-xl border border-slate-700/g, 'glass-card p-4'],
            ];

            for (const [regex, replacement] of replacements) {
                content = content.replace(regex, replacement);
            }
            
            if (content !== original) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Cleaned up: ${fullPath}`);
            }
        }
    }
}

traverse(srcDir);

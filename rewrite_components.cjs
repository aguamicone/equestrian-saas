const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src/components');

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
                [/bg-slate-800 p-4 rounded-xl border border-slate-700/g, 'glass-card p-4'],
                [/bg-slate-800 p-4 rounded-2xl border border-slate-700/g, 'glass-card p-4'],
                [/bg-slate-800 rounded-xl overflow-hidden mb-6 border border-slate-700/g, 'glass-card mb-6'],
                [/bg-slate-800 rounded-xl overflow-hidden border border-slate-700/g, 'glass-card'],
                [/bg-slate-800 p-6 rounded-lg/g, 'glass-card p-6 !rounded-lg'],
                [/bg-slate-800 border border-slate-700/g, 'glass-card'],
                [/bg-slate-800 rounded-xl/g, 'glass-card'],
                [/bg-slate-800 p-4/g, 'glass-card p-4'],
                [/glass-card rounded-lg/g, 'glass-card !rounded-lg'],
            ];

            for (const [regex, replacement] of replacements) {
                content = content.replace(regex, replacement);
            }
            
            if (content !== original) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated Component: ${fullPath}`);
            }
        }
    }
}

traverse(srcDir);

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src/pages');

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
                // Clean exact common patterns first to avoid stray classes
                [/bg-slate-800 p-4 rounded-xl border border-slate-700/g, 'glass-card p-4'],
                [/bg-slate-800 p-4 rounded-2xl border border-slate-700/g, 'glass-card p-4'],
                [/bg-slate-800 p-5 rounded-2xl border border-gold-500\/30/g, 'glass-card p-5 border-gold-500/30'],
                [/bg-slate-800 rounded-xl overflow-hidden mb-6 border border-slate-700/g, 'glass-card mb-6'],
                [/bg-slate-800 rounded-xl overflow-hidden border border-slate-700/g, 'glass-card'],
                [/bg-slate-800 w-full max-w-md rounded-2xl p-6 border border-slate-700/g, 'glass-panel w-full max-w-md p-6'],
                [/bg-slate-800 w-full max-w-sm rounded-2xl p-6 border border-slate-700/g, 'glass-panel w-full max-w-sm p-6'],
                [/bg-slate-800 border border-slate-700 p-4 flex flex-col items-center/g, 'glass-card p-4 flex flex-col items-center'],
                [/bg-slate-800 border border-slate-700 p-4 rounded-xl/g, 'glass-card p-4'],
                [/bg-slate-800 border border-slate-700 p-6 rounded-xl/g, 'glass-card p-6'],
                [/bg-slate-800 p-6 rounded-lg mb-6 border border-slate-700/g, 'glass-card p-6 mb-6'],
                [/bg-slate-800 p-4 rounded-xl mb-6/g, 'glass-card p-4 mb-6'],
                [/bg-slate-800 p-4 rounded-xl border-l-[3px] border-gold-500/g, 'glass-card p-4 !border-l-4 !border-l-gold-500'],
                [/bg-slate-800 border border-slate-700/g, 'glass-card'],
                [/bg-slate-800 rounded-xl/g, 'glass-card'],
                [/bg-slate-800 p-4/g, 'glass-card p-4'],
                [/bg-slate-800 p-6/g, 'glass-card p-6'],
                
                // Specific inputs
                [/w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl p-3 focus:border-gold-500/g, 'input-field p-3'],
                
                // Fixes for double rounding
                [/glass-card rounded-lg/g, 'glass-card !rounded-lg'],
                [/glass-card rounded-2xl/g, 'glass-card'],
                [/glass-card rounded-xl/g, 'glass-card'],
            ];

            for (const [regex, replacement] of replacements) {
                content = content.replace(regex, replacement);
            }
            
            if (content !== original) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated: ${fullPath}`);
            }
        }
    }
}

traverse(srcDir);
console.log("Migration script completed.");

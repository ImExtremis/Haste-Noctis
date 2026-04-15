import fs from 'fs';
import path from 'path';

const searchParams = [
    { regex: /Haste Industries/g, replacement: 'Haste Industries' },
    { regex: /noctisstatic\.com/gi, replacement: 'static.noctis.app' },
    { regex: /noctisstatus\.com/gi, replacement: 'status.noctis.app' },
    { regex: /noctis\.gg/gi, replacement: 'noctis.gg' },
    { regex: /noctis\.app/gi, replacement: 'noctis.app' },
    { regex: /NOCTIS/g, replacement: 'NOCTIS' },
    { regex: /Noctis/g, replacement: 'Noctis' },
    { regex: /noctis/g, replacement: 'noctis' },
    { regex: /STELLAR/g, replacement: 'STELLAR' },
    { regex: /Stellar/g, replacement: 'Stellar' },
    { regex: /stellar/g, replacement: 'stellar' }
];

const ignoreDirs = new Set(['node_modules', '.git', 'dist', 'build', 'out', '.turbo', '.fleet', '.vscode', '.next', '.husky', 'pnpm-lock.yaml']);

const binaryExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', '.mp4', '.mp3', '.ogg', '.wav', '.pdf', '.woff', '.woff2', '.ttf', '.eot']);

function walkAndReplace(dir) {
    let list;
    try {
        list = fs.readdirSync(dir);
    } catch(e) {
        return;
    }

    for (const file of list) {
        if (ignoreDirs.has(file)) continue;

        const filepath = path.join(dir, file);
        let stat;
        try {
           stat = fs.lstatSync(filepath);
        } catch(e) { continue; }

        // process directories recursively
        if (stat.isDirectory()) {
            walkAndReplace(filepath);
            
            // post-order rename directory
            if (file.toLowerCase().includes('noctis') || file.toLowerCase().includes('stellar')) {
                let newFileName = file;
                newFileName = newFileName.replace(/noctis/g, 'noctis');
                newFileName = newFileName.replace(/Noctis/g, 'Noctis');
                newFileName = newFileName.replace(/NOCTIS/g, 'NOCTIS');
                newFileName = newFileName.replace(/stellar/g, 'stellar');
                newFileName = newFileName.replace(/Stellar/g, 'Stellar');
                
                const newFilePath = path.join(dir, newFileName);
                fs.renameSync(filepath, newFilePath);
                console.log(`Renamed directory: ${filepath} -> ${newFilePath}`);
            }

        } else if (stat.isFile()) {
            const ext = path.extname(file).toLowerCase();
            if (!binaryExtensions.has(ext)) {
                try {
                    const content = fs.readFileSync(filepath, 'utf8');

                    // Skip processing if it looks like a binary file mistakenly read as utf8 (has null bytes usually, though less reliable in JS, we just rely on extensions/contents)
                    if(content.indexOf('\0') !== -1 && !filepath.includes('NOCTIS_SPEC.md')) {
                        // ignore binary
                    } else {
                        let newContent = content;
                        
                        for (const { regex, replacement } of searchParams) {
                            newContent = newContent.replace(regex, replacement);
                        }
    
                        if (content !== newContent) {
                            fs.writeFileSync(filepath, newContent, 'utf8');
                        }
                    }

                } catch(e) {
                    console.error(`Failed to read/write ${filepath}: ${e.message}`);
                }
            }
            
            // Rename file if necessary
            if (file.toLowerCase().includes('noctis') || file.toLowerCase().includes('stellar')) {
                let newFileName = file;
                newFileName = newFileName.replace(/noctis/g, 'noctis');
                newFileName = newFileName.replace(/Noctis/g, 'Noctis');
                newFileName = newFileName.replace(/NOCTIS/g, 'NOCTIS');
                newFileName = newFileName.replace(/stellar/g, 'stellar');
                newFileName = newFileName.replace(/Stellar/g, 'Stellar');
                
                const newFilePath = path.join(dir, newFileName);
                fs.renameSync(filepath, newFilePath);
                console.log(`Renamed file: ${filepath} -> ${newFilePath}`);
            }
        }
    }
}

console.log("Starting rebrand replacement...");
walkAndReplace(".");
console.log("Rebrand complete.");

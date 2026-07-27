const fs = require('fs');
const path = require('path');

const walk = (dir, callback) => {
  fs.readdirSync(dir).forEach(file => {
    let fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath, callback);
    } else {
      if (fullPath.endsWith('.ts')) {
        callback(fullPath);
      }
    }
  });
};

const apiDir = path.join(__dirname, 'app', 'api');

walk(apiDir, (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  
  let modified = false;
  
  if (content.includes("req.headers.get('x-caller-user-id')") || content.includes('req.headers.get("x-caller-user-id")')) {
    // Add import if not present
    if (!content.includes('getCallerUserId')) {
      const importStmt = `import { getCallerUserId } from '@/lib/utils/getCallerUserId';\n`;
      // Insert after the first import or at the top
      content = importStmt + content;
    }
    
    // Replace all variations of getting the header
    content = content.replace(/req\.headers\.get\('x-caller-user-id'\)( \?\? '')?/g, 'await getCallerUserId(req)$1');
    content = content.replace(/req\.headers\.get\("x-caller-user-id"\)( \?\? '')?/g, 'await getCallerUserId(req)$1');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed', filePath);
  }
});

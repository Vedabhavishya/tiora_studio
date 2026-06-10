import * as fs from 'fs';
import * as path from 'path';

const adminDir = path.join(process.cwd(), 'src/app/api/admin');

function refactorFile(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(process.cwd(), filePath);
  
  console.log(`Refactoring ${relativePath}...`);

  // Special case: inventory/route.ts has no authentication check at all in HEAD
  if (filePath.endsWith('inventory/route.ts')) {
    if (!content.includes('verifyAdminRequest')) {
      // Add import
      content = 'import { verifyAdminRequest } from "@/utils/auth";\n' + content;
      // Add check at the start of GET
      content = content.replace(
        /export async function GET\(\) \{/,
        'export async function GET(request: Request) {\n  if (!await verifyAdminRequest(request)) {\n    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });\n  }'
      );
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`  Added protection to inventory/route.ts`);
    }
    return;
  }

  // 1. Replace cookies import with verifyAdminRequest
  // Matches: import { cookies } from "next/headers"; (with single or double quotes, and trailing semicolon optional)
  content = content.replace(/import\s*\{\s*cookies\s*\}\s*from\s*['"]next\/headers['"];?\r?\n?/g, '');
  if (!content.includes('import { verifyAdminRequest } from "@/utils/auth"')) {
    content = 'import { verifyAdminRequest } from "@/utils/auth";\n' + content;
  }

  // 2. Add request parameter to method headers that don't have it
  // GET(), POST(), PUT(), PATCH(), DELETE() -> GET(request: Request), etc.
  content = content.replace(/export async function GET\(\)/g, 'export async function GET(request: Request)');
  content = content.replace(/export async function POST\(\)/g, 'export async function POST(request: Request)');
  content = content.replace(/export async function PUT\(\)/g, 'export async function PUT(request: Request)');
  content = content.replace(/export async function PATCH\(\)/g, 'export async function PATCH(request: Request)');
  content = content.replace(/export async function DELETE\(\)/g, 'export async function DELETE(request: Request)');

  // 3. Replace the helper function definition
  // Matches: async function isAdmin() { ... } or async function isAuthenticated() { ... }
  const isAdminRegex = /async function isAdmin\(\)\s*\{[\s\S]*?return session === "9999999999";\r?\n?\}/g;
  const isAuthenticatedRegex = /async function isAuthenticated\(\)\s*\{[\s\S]*?return session === "9999999999";\r?\n?\}/g;

  if (isAdminRegex.test(content)) {
    content = content.replace(isAdminRegex, `async function isAdmin(request?: Request) {
  return !!(await verifyAdminRequest(request));
}`);
  } else if (isAuthenticatedRegex.test(content)) {
    content = content.replace(isAuthenticatedRegex, `async function isAuthenticated(request?: Request) {
  return !!(await verifyAdminRequest(request));
}`);
  }

  // 4. Update helper function calls passing req or request depending on context
  // Let's do this line by line or contextually
  // For each handler definition, check parameter name (req or request) and update calls within it
  const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
  for (const method of methods) {
    // Regex to capture the body of the function
    // We search for: export async function METHOD(param) { ... }
    const methodRegex = new RegExp(`(export async function ${method}\\(\\s*(\\w+)[\\s\\S]*?\\{)([\\s\\S]*?)(?=export async function|$)`, 'g');
    
    content = content.replace(methodRegex, (match, header, paramName, body) => {
      // Replace calls to helper in this body
      let newBody = body;
      if (paramName === 'req') {
        newBody = newBody.replace(/await\s+isAdmin\(\)/g, 'await isAdmin(req)');
        newBody = newBody.replace(/await\s+isAuthenticated\(\)/g, 'await isAuthenticated(req)');
      } else if (paramName === 'request') {
        newBody = newBody.replace(/await\s+isAdmin\(\)/g, 'await isAdmin(request)');
        newBody = newBody.replace(/await\s+isAuthenticated\(\)/g, 'await isAuthenticated(request)');
      }
      return header + newBody;
    });
  }

  fs.writeFileSync(filePath, content, 'utf8');
}

function walk(dir: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath);
    } else if (file.endsWith('.ts')) {
      refactorFile(fullPath);
    }
  }
}

walk(adminDir);
console.log('Refactoring complete!');

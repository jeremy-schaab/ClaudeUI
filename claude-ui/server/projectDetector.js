/**
 * Project Auto-Detection Module
 *
 * Detects project type and metadata from a filesystem path.
 * Supports detection for:
 * - Git repositories
 * - Node.js projects (npm, yarn, pnpm)
 * - .NET projects (C#, ASP.NET, Blazor)
 * - Python projects (pip, poetry, pipenv)
 * - Go projects
 * - General language detection by file extensions
 *
 * @module projectDetector
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Project type color mapping
 * Colors chosen to match official language/framework branding
 */
const PROJECT_TYPE_COLORS = {
  nodejs: '#68a063',      // Node.js green
  react: '#61dafb',       // React blue
  vue: '#42b883',         // Vue green
  angular: '#dd0031',     // Angular red
  nextjs: '#000000',      // Next.js black
  express: '#000000',     // Express black
  dotnet: '#512bd4',      // .NET purple
  blazor: '#512bd4',      // Blazor (same as .NET)
  aspnet: '#512bd4',      // ASP.NET (same as .NET)
  python: '#3776ab',      // Python blue
  django: '#0c4b33',      // Django dark green
  flask: '#000000',       // Flask black
  fastapi: '#009688',     // FastAPI teal
  go: '#00add8',          // Go cyan
  git: '#f05032',         // Git orange
  unknown: '#6366f1'      // Default indigo
};

/**
 * Safely check if a file exists
 * @param {string} filePath - Path to check
 * @returns {boolean} True if file exists
 */
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
  } catch (err) {
    return false;
  }
}

/**
 * Safely check if a directory exists
 * @param {string} dirPath - Path to check
 * @returns {boolean} True if directory exists
 */
function dirExists(dirPath) {
  try {
    return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  } catch (err) {
    return false;
  }
}

/**
 * Safely read and parse JSON file
 * @param {string} filePath - Path to JSON file
 * @returns {Object|null} Parsed JSON object or null if error
 */
function readJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    return null;
  }
}

/**
 * Safely read text file
 * @param {string} filePath - Path to file
 * @returns {string|null} File content or null if error
 */
function readTextFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    return null;
  }
}

/**
 * Execute git command safely
 * @param {string} command - Git command to execute
 * @param {string} cwd - Working directory
 * @returns {string|null} Command output or null if error
 */
function executeGitCommand(command, cwd) {
  try {
    return execSync(command, {
      cwd,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'] // Suppress stderr
    }).trim();
  } catch (err) {
    return null;
  }
}

/**
 * Detect Git repository information
 * @param {string} projectPath - Path to project directory
 * @returns {Object|null} Git metadata or null if not a git repo
 */
function detectGit(projectPath) {
  const gitDir = path.join(projectPath, '.git');
  if (!dirExists(gitDir)) {
    return null;
  }

  const remoteUrl = executeGitCommand('git config --get remote.origin.url', projectPath);

  // Extract project name from remote URL or use folder name
  let projectName = null;
  if (remoteUrl) {
    // Extract name from URLs like:
    // https://github.com/user/repo.git
    // git@github.com:user/repo.git
    const match = remoteUrl.match(/\/([^\/]+?)(\.git)?$/);
    if (match) {
      projectName = match[1];
    }
  }

  return {
    hasGit: true,
    gitRemote: remoteUrl,
    projectName: projectName
  };
}

/**
 * Detect Node.js project information
 * @param {string} projectPath - Path to project directory
 * @returns {Object|null} Node.js metadata or null if not a Node.js project
 */
function detectNodeJs(projectPath) {
  const packageJsonPath = path.join(projectPath, 'package.json');
  if (!fileExists(packageJsonPath)) {
    return null;
  }

  const packageJson = readJsonFile(packageJsonPath);
  if (!packageJson) {
    return null;
  }

  // Detect package manager
  let packageManager = 'npm'; // default
  if (fileExists(path.join(projectPath, 'yarn.lock'))) {
    packageManager = 'yarn';
  } else if (fileExists(path.join(projectPath, 'pnpm-lock.yaml'))) {
    packageManager = 'pnpm';
  }

  // Detect frameworks from dependencies
  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies
  };

  const frameworks = [];
  if (allDeps.react || allDeps['react-dom']) {
    frameworks.push('React');
  }
  if (allDeps.vue) {
    frameworks.push('Vue');
  }
  if (allDeps['@angular/core']) {
    frameworks.push('Angular');
  }
  if (allDeps.next) {
    frameworks.push('Next.js');
  }
  if (allDeps.express) {
    frameworks.push('Express');
  }
  if (allDeps.nestjs || allDeps['@nestjs/core']) {
    frameworks.push('NestJS');
  }
  if (allDeps.svelte) {
    frameworks.push('Svelte');
  }

  // Determine primary framework for color
  let primaryFramework = null;
  if (frameworks.includes('React')) primaryFramework = 'react';
  else if (frameworks.includes('Vue')) primaryFramework = 'vue';
  else if (frameworks.includes('Angular')) primaryFramework = 'angular';
  else if (frameworks.includes('Next.js')) primaryFramework = 'nextjs';

  return {
    projectType: 'nodejs',
    projectName: packageJson.name,
    version: packageJson.version,
    description: packageJson.description,
    packageManager,
    frameworks,
    primaryFramework,
    hasTypeScript: !!(allDeps.typescript)
  };
}

/**
 * Detect .NET project information
 * @param {string} projectPath - Path to project directory
 * @returns {Object|null} .NET metadata or null if not a .NET project
 */
function detectDotNet(projectPath) {
  // Look for .csproj or .sln files
  let files;
  try {
    files = fs.readdirSync(projectPath);
  } catch (err) {
    return null;
  }

  const csprojFiles = files.filter(f => f.endsWith('.csproj'));
  const slnFiles = files.filter(f => f.endsWith('.sln'));

  if (csprojFiles.length === 0 && slnFiles.length === 0) {
    return null;
  }

  let projectName = null;
  let targetFramework = null;
  let projectType = 'dotnet';
  const frameworks = [];

  // Parse first .csproj file found
  if (csprojFiles.length > 0) {
    const csprojPath = path.join(projectPath, csprojFiles[0]);
    const csprojContent = readTextFile(csprojPath);

    if (csprojContent) {
      projectName = csprojFiles[0].replace('.csproj', '');

      // Extract TargetFramework
      const tfMatch = csprojContent.match(/<TargetFramework>(.*?)<\/TargetFramework>/);
      if (tfMatch) {
        targetFramework = tfMatch[1];
      }

      // Detect project type
      if (csprojContent.includes('Microsoft.NET.Sdk.Web')) {
        frameworks.push('ASP.NET Core');
        projectType = 'aspnet';
      }
      if (csprojContent.includes('Microsoft.AspNetCore.Components.WebAssembly')) {
        frameworks.push('Blazor WebAssembly');
        projectType = 'blazor';
      }
      if (csprojContent.includes('Microsoft.AspNetCore.Components')) {
        frameworks.push('Blazor');
        projectType = 'blazor';
      }
      if (csprojContent.includes('Exe')) {
        frameworks.push('Console App');
      }
      if (csprojContent.includes('WinExe')) {
        frameworks.push('Windows App');
      }
    }
  }

  // If no project name from .csproj, try .sln
  if (!projectName && slnFiles.length > 0) {
    projectName = slnFiles[0].replace('.sln', '');
  }

  return {
    projectType,
    projectName,
    targetFramework,
    frameworks,
    hasSolution: slnFiles.length > 0,
    projectCount: csprojFiles.length
  };
}

/**
 * Detect Python project information
 * @param {string} projectPath - Path to project directory
 * @returns {Object|null} Python metadata or null if not a Python project
 */
function detectPython(projectPath) {
  const requirementsTxt = path.join(projectPath, 'requirements.txt');
  const pyprojectToml = path.join(projectPath, 'pyproject.toml');
  const setupPy = path.join(projectPath, 'setup.py');
  const pipfile = path.join(projectPath, 'Pipfile');

  const hasPythonConfig = fileExists(requirementsTxt) ||
                          fileExists(pyprojectToml) ||
                          fileExists(setupPy) ||
                          fileExists(pipfile);

  if (!hasPythonConfig) {
    return null;
  }

  let projectName = null;
  let packageManager = 'pip';
  const frameworks = [];

  // Try to extract name from pyproject.toml
  if (fileExists(pyprojectToml)) {
    const content = readTextFile(pyprojectToml);
    if (content) {
      const nameMatch = content.match(/name\s*=\s*["']([^"']+)["']/);
      if (nameMatch) {
        projectName = nameMatch[1];
      }
    }
    packageManager = 'poetry';
  }

  // Try to extract name from setup.py
  if (!projectName && fileExists(setupPy)) {
    const content = readTextFile(setupPy);
    if (content) {
      const nameMatch = content.match(/name\s*=\s*["']([^"']+)["']/);
      if (nameMatch) {
        projectName = nameMatch[1];
      }
    }
  }

  // Detect package manager
  if (fileExists(pipfile)) {
    packageManager = 'pipenv';
  }

  // Detect frameworks from requirements.txt
  if (fileExists(requirementsTxt)) {
    const content = readTextFile(requirementsTxt);
    if (content) {
      if (content.includes('django')) {
        frameworks.push('Django');
      }
      if (content.includes('flask')) {
        frameworks.push('Flask');
      }
      if (content.includes('fastapi')) {
        frameworks.push('FastAPI');
      }
    }
  }

  // Determine primary framework
  let primaryFramework = null;
  if (frameworks.includes('Django')) primaryFramework = 'django';
  else if (frameworks.includes('Flask')) primaryFramework = 'flask';
  else if (frameworks.includes('FastAPI')) primaryFramework = 'fastapi';

  return {
    projectType: 'python',
    projectName,
    packageManager,
    frameworks,
    primaryFramework
  };
}

/**
 * Detect Go project information
 * @param {string} projectPath - Path to project directory
 * @returns {Object|null} Go metadata or null if not a Go project
 */
function detectGo(projectPath) {
  const goModPath = path.join(projectPath, 'go.mod');
  if (!fileExists(goModPath)) {
    return null;
  }

  const content = readTextFile(goModPath);
  if (!content) {
    return null;
  }

  // Extract module name from first line: "module github.com/user/repo"
  const lines = content.split('\n');
  const moduleLine = lines.find(line => line.trim().startsWith('module '));
  let moduleName = null;

  if (moduleLine) {
    moduleName = moduleLine.replace('module', '').trim();
  }

  // Extract project name from module path
  let projectName = null;
  if (moduleName) {
    const parts = moduleName.split('/');
    projectName = parts[parts.length - 1];
  }

  return {
    projectType: 'go',
    projectName,
    moduleName
  };
}

/**
 * Count files by extension in project (max depth 2 to avoid deep traversal)
 * @param {string} projectPath - Path to project directory
 * @param {number} maxDepth - Maximum directory depth to scan
 * @returns {Object} Map of extension to count
 */
function countFilesByExtension(projectPath, maxDepth = 2) {
  const counts = {};

  function scanDir(dirPath, depth) {
    if (depth > maxDepth) return;

    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        // Skip node_modules, .git, and other common ignore directories
        if (entry.name === 'node_modules' ||
            entry.name === '.git' ||
            entry.name === '__pycache__' ||
            entry.name === 'venv' ||
            entry.name === 'env' ||
            entry.name === 'bin' ||
            entry.name === 'obj') {
          continue;
        }

        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          scanDir(fullPath, depth + 1);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (ext) {
            counts[ext] = (counts[ext] || 0) + 1;
          }
        }
      }
    } catch (err) {
      // Ignore permission errors
    }
  }

  scanDir(projectPath, 0);
  return counts;
}

/**
 * Detect primary language from file extensions
 * @param {Object} extensionCounts - Map of extension to count
 * @returns {string|null} Primary language name
 */
function detectPrimaryLanguage(extensionCounts) {
  // Language mapping by extension
  const languageMap = {
    '.ts': 'TypeScript',
    '.tsx': 'TypeScript',
    '.js': 'JavaScript',
    '.jsx': 'JavaScript',
    '.py': 'Python',
    '.cs': 'C#',
    '.go': 'Go',
    '.java': 'Java',
    '.rb': 'Ruby',
    '.php': 'PHP',
    '.cpp': 'C++',
    '.c': 'C',
    '.rs': 'Rust',
    '.swift': 'Swift',
    '.kt': 'Kotlin'
  };

  // Find most common language extension
  let maxCount = 0;
  let primaryLang = null;

  for (const [ext, count] of Object.entries(extensionCounts)) {
    const lang = languageMap[ext];
    if (lang && count > maxCount) {
      maxCount = count;
      primaryLang = lang;
    }
  }

  return primaryLang;
}

/**
 * Get all detected languages sorted by file count
 * @param {Object} extensionCounts - Map of extension to count
 * @returns {Array<string>} Array of language names
 */
function getAllLanguages(extensionCounts) {
  const languageMap = {
    '.ts': 'TypeScript',
    '.tsx': 'TypeScript',
    '.js': 'JavaScript',
    '.jsx': 'JavaScript',
    '.py': 'Python',
    '.cs': 'C#',
    '.go': 'Go',
    '.java': 'Java',
    '.rb': 'Ruby',
    '.php': 'PHP',
    '.cpp': 'C++',
    '.c': 'C',
    '.rs': 'Rust',
    '.swift': 'Swift',
    '.kt': 'Kotlin'
  };

  const langCounts = {};
  for (const [ext, count] of Object.entries(extensionCounts)) {
    const lang = languageMap[ext];
    if (lang) {
      langCounts[lang] = (langCounts[lang] || 0) + count;
    }
  }

  return Object.entries(langCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([lang]) => lang);
}

/**
 * Generate suggested tags based on detected project info
 * @param {Object} detection - Detection results
 * @returns {Array<string>} Array of suggested tags
 */
function generateSuggestedTags(detection) {
  const tags = [];

  // Add project type
  if (detection.projectType && detection.projectType !== 'unknown') {
    tags.push(detection.projectType);
  }

  // Add frameworks
  if (detection.metadata.frameworks && detection.metadata.frameworks.length > 0) {
    detection.metadata.frameworks.forEach(fw => {
      tags.push(fw.toLowerCase().replace(/\s+/g, '-'));
    });
  }

  // Add languages
  if (detection.metadata.mainLanguages && detection.metadata.mainLanguages.length > 0) {
    detection.metadata.mainLanguages.forEach(lang => {
      tags.push(lang.toLowerCase());
    });
  }

  // Add special categories
  if (detection.framework) {
    const fwLower = detection.framework.toLowerCase();
    if (['react', 'vue', 'angular', 'svelte'].includes(fwLower)) {
      tags.push('web');
      tags.push('frontend');
    }
    if (['express', 'nestjs', 'fastapi', 'django', 'flask'].includes(fwLower)) {
      tags.push('backend');
      tags.push('api');
    }
  }

  if (detection.metadata.hasGit) {
    tags.push('git');
  }

  // Remove duplicates and return
  return [...new Set(tags)];
}

/**
 * Main detection function - detects project type and metadata
 * @param {string} projectPath - Absolute path to project directory
 * @returns {Object} Detection result with project metadata
 */
function detectProject(projectPath) {
  // Validate path exists
  if (!dirExists(projectPath)) {
    return {
      detected: false,
      error: 'Project path does not exist or is not a directory'
    };
  }

  const result = {
    detected: true,
    name: null,
    projectType: 'unknown',
    language: null,
    framework: null,
    metadata: {
      hasGit: false,
      gitRemote: null,
      packageManager: null,
      mainLanguages: [],
      frameworks: []
    },
    suggestedColor: PROJECT_TYPE_COLORS.unknown,
    suggestedTags: []
  };

  // 1. Try Git detection (works for all project types)
  const gitInfo = detectGit(projectPath);
  if (gitInfo) {
    result.metadata.hasGit = true;
    result.metadata.gitRemote = gitInfo.gitRemote;
    if (gitInfo.projectName && !result.name) {
      result.name = gitInfo.projectName;
    }
  }

  // 2. Try Node.js detection
  const nodeInfo = detectNodeJs(projectPath);
  if (nodeInfo) {
    result.projectType = 'nodejs';
    result.name = nodeInfo.projectName || result.name;
    result.language = nodeInfo.hasTypeScript ? 'TypeScript' : 'JavaScript';
    result.metadata.packageManager = nodeInfo.packageManager;
    result.metadata.frameworks = nodeInfo.frameworks;

    if (nodeInfo.primaryFramework) {
      result.framework = nodeInfo.frameworks[0]; // Use full name
      result.suggestedColor = PROJECT_TYPE_COLORS[nodeInfo.primaryFramework];
    } else {
      result.suggestedColor = PROJECT_TYPE_COLORS.nodejs;
    }
  }

  // 3. Try .NET detection
  if (result.projectType === 'unknown') {
    const dotnetInfo = detectDotNet(projectPath);
    if (dotnetInfo) {
      result.projectType = dotnetInfo.projectType;
      result.name = dotnetInfo.projectName || result.name;
      result.language = 'C#';
      result.metadata.frameworks = dotnetInfo.frameworks;
      result.metadata.targetFramework = dotnetInfo.targetFramework;

      if (dotnetInfo.frameworks.length > 0) {
        result.framework = dotnetInfo.frameworks[0];
      }

      result.suggestedColor = PROJECT_TYPE_COLORS[dotnetInfo.projectType] || PROJECT_TYPE_COLORS.dotnet;
    }
  }

  // 4. Try Python detection
  if (result.projectType === 'unknown') {
    const pythonInfo = detectPython(projectPath);
    if (pythonInfo) {
      result.projectType = 'python';
      result.name = pythonInfo.projectName || result.name;
      result.language = 'Python';
      result.metadata.packageManager = pythonInfo.packageManager;
      result.metadata.frameworks = pythonInfo.frameworks;

      if (pythonInfo.primaryFramework) {
        result.framework = pythonInfo.frameworks[0];
        result.suggestedColor = PROJECT_TYPE_COLORS[pythonInfo.primaryFramework];
      } else {
        result.suggestedColor = PROJECT_TYPE_COLORS.python;
      }
    }
  }

  // 5. Try Go detection
  if (result.projectType === 'unknown') {
    const goInfo = detectGo(projectPath);
    if (goInfo) {
      result.projectType = 'go';
      result.name = goInfo.projectName || result.name;
      result.language = 'Go';
      result.metadata.moduleName = goInfo.moduleName;
      result.suggestedColor = PROJECT_TYPE_COLORS.go;
    }
  }

  // 6. General language detection if still unknown
  const extensionCounts = countFilesByExtension(projectPath);
  const primaryLanguage = detectPrimaryLanguage(extensionCounts);
  const allLanguages = getAllLanguages(extensionCounts);

  if (!result.language && primaryLanguage) {
    result.language = primaryLanguage;
  }

  result.metadata.mainLanguages = allLanguages;

  // 7. Fallback to folder name if no name detected
  if (!result.name) {
    result.name = path.basename(projectPath);
  }

  // 8. If still unknown but has Git, mark as git project
  if (result.projectType === 'unknown' && result.metadata.hasGit) {
    result.projectType = 'git';
    result.suggestedColor = PROJECT_TYPE_COLORS.git;
  }

  // 9. Generate suggested tags
  result.suggestedTags = generateSuggestedTags(result);

  return result;
}

module.exports = {
  detectProject,
  PROJECT_TYPE_COLORS
};

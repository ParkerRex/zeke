#!/usr/bin/env bash
set -euo pipefail

# Workspace Mode Switcher
# Switch between different IDE workspace configurations

show_help() {
    echo "🎯 ZEKE Workspace Mode Switcher"
    echo ""
    echo "Usage: bash scripts/workspace-mode.sh [mode]"
    echo ""
    echo "Modes:"
    echo "  focused     - Focus on apps/app and packages/supabase only"
    echo "  full        - Show all apps and packages (default)"
    echo "  frontend    - Focus on apps/app and design-system"
    echo "  backend     - Focus on apps/worker and packages/supabase"
    echo ""
    echo "Examples:"
    echo "  bash scripts/workspace-mode.sh focused"
    echo "  bash scripts/workspace-mode.sh full"
    echo ""
    echo "This script manages VS Code workspace settings to optimize your IDE"
    echo "for different types of development work."
}

backup_current_settings() {
    if [ -f ".vscode/settings.json" ]; then
        cp ".vscode/settings.json" ".vscode/settings.backup.json"
        echo "📁 Backed up current settings to .vscode/settings.backup.json"
    fi
}

set_focused_mode() {
    echo "🎯 Setting FOCUSED workspace mode..."
    echo "   Focus: apps/app + packages/supabase"

    backup_current_settings

    # Copy focused settings
    cp ".vscode/settings.focused.json" ".vscode/settings.json"

    echo "✅ Focused mode activated"
    echo "📂 Visible directories:"
    echo "   • apps/app (main application)"
    echo "   • packages/supabase (database layer)"
    echo "   • packages/design-system (UI components)"
    echo "   • packages/auth (authentication)"
    echo ""
    echo "🚫 Hidden directories:"
    echo "   • apps/web, apps/worker"
    echo "   • Most packages (cms, email, observability, etc.)"
    echo ""
    echo "💡 Open VS Code with: code zeke-focused.code-workspace"
}

set_full_mode() {
    echo "🌍 Setting FULL workspace mode..."
    echo "   Focus: All apps and packages visible"

    backup_current_settings

    # Create minimal settings for full mode
    cat > ".vscode/settings.json" << 'EOF'
{
  "// FULL WORKSPACE SETTINGS": "All apps and packages visible",

  "files.exclude": {
    "**/node_modules": true,
    "**/.git": true,
    "**/.DS_Store": true,
    "**/.next": true,
    "**/.turbo": true,
    "**/dist": true,
    "**/build": true,
    "**/.cache": true
  },

  "search.exclude": {
    "**/node_modules": true,
    "**/.next": true,
    "**/.turbo": true,
    "**/dist": true,
    "**/build": true,
    "**/.cache": true
  },

  "files.watcherExclude": {
    "**/node_modules/**": true,
    "**/.git/**": true,
    "**/.next/**": true,
    "**/.turbo/**": true,
    "**/dist/**": true,
    "**/build/**": true,
    "**/.cache/**": true
  },

  "typescript.preferences.includePackageJsonAutoImports": "on",
  "eslint.workingDirectories": ["."],
  "terminal.integrated.cwd": "./",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
EOF

    echo "✅ Full mode activated"
    echo "📂 All directories are now visible"
    echo ""
    echo "💡 Open VS Code normally: code ."
}

set_frontend_mode() {
    echo "🎨 Setting FRONTEND workspace mode..."
    echo "   Focus: apps/app + design-system"

    backup_current_settings

    # Create frontend-focused settings
    cat > ".vscode/settings.json" << 'EOF'
{
  "// FRONTEND WORKSPACE SETTINGS": "Focus on UI development",

  "files.exclude": {
    "**/node_modules": true,
    "**/.git": true,
    "**/.DS_Store": true,
    "**/.next": true,
    "**/.turbo": true,
    "**/dist": true,
    "**/build": true,
    "**/.cache": true,

    "apps/web": true,
    "apps/worker": true,

    "apps/api": true,
    "packages/cms": true,
    "packages/email": true,
    "packages/observability": true,
    "packages/rate-limit": true,
    "packages/security": true,
    "packages/testing": true,
    "packages/typescript-config": true
  },

  "eslint.workingDirectories": [
    "apps/app",
    "packages/design-system",
    "packages/auth"
  ],

  "terminal.integrated.cwd": "apps/app",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
EOF

    echo "✅ Frontend mode activated"
    echo "📂 Visible: apps/app, packages/design-system, packages/auth"
}

set_backend_mode() {
    echo "⚙️ Setting BACKEND workspace mode..."
    echo "   Focus: apps/worker + packages/supabase"

    backup_current_settings

    # Create backend-focused settings
    cat > ".vscode/settings.json" << 'EOF'
{
  "// BACKEND WORKSPACE SETTINGS": "Focus on backend development",

  "files.exclude": {
    "**/node_modules": true,
    "**/.git": true,
    "**/.DS_Store": true,
    "**/.next": true,
    "**/.turbo": true,
    "**/dist": true,
    "**/build": true,
    "**/.cache": true,

    "apps/web": true,

    "packages/cms": true,
    "packages/design-system": true,
    "packages/email": true,
    "packages/rate-limit": true,
    "packages/testing": true,
    "packages/typescript-config": true
  },

  "eslint.workingDirectories": [
    "apps/worker",
    "apps/app",
    "packages/supabase",
    "packages/auth"
  ],

  "terminal.integrated.cwd": "apps/worker",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
EOF

    echo "✅ Backend mode activated"
    echo "📂 Visible: apps/worker, apps/app, packages/supabase"
}

restore_backup() {
    if [ -f ".vscode/settings.backup.json" ]; then
        cp ".vscode/settings.backup.json" ".vscode/settings.json"
        echo "🔄 Restored settings from backup"
    else
        echo "❌ No backup found"
    fi
}

# Main logic
case "${1:-help}" in
    "focused")
        set_focused_mode
        ;;
    "full")
        set_full_mode
        ;;
    "frontend")
        set_frontend_mode
        ;;
    "backend")
        set_backend_mode
        ;;
    "restore")
        restore_backup
        ;;
    "help"|"-h"|"--help")
        show_help
        exit 0
        ;;
    *)
        echo "❌ Unknown mode: $1"
        show_help
        exit 1
        ;;
esac

echo ""
echo "🔄 Restart VS Code to apply changes"
echo "💡 Run 'bash scripts/workspace-mode.sh help' to see all options"

#!/bin/bash

# Database Restore Script for TalentWhiz.ai
# Usage: ./scripts/restore_database.sh

echo "🔄 Starting database restore process..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    exit 1
fi

# Check if backup files exist
if [ ! -f "database_backup.sql" ]; then
    echo "❌ Error: database_backup.sql not found"
    echo "Please ensure the backup file is in the root directory"
    exit 1
fi

echo "📊 Restoring complete database (structure + data)..."
psql $DATABASE_URL < database_backup.sql

if [ $? -eq 0 ]; then
    echo "✅ Database restored successfully!"
    echo "🎉 TalentWhiz.ai database is ready to use"
else
    echo "❌ Error: Database restore failed"
    exit 1
fi

echo "🚀 You can now start the application with: npm run dev"
import { execSync } from 'child_process';

try {
  console.log('🔄 Checking Git status...');
  
  // Configure git if not already set (safety fallback)
  try {
    execSync('git config user.name', { stdio: 'ignore' });
  } catch {
    console.log('👤 Setting git user.name...');
    execSync('git config user.name "yuldoshbek"', { stdio: 'inherit' });
  }
  
  try {
    execSync('git config user.email', { stdio: 'ignore' });
  } catch {
    console.log('✉️ Setting git user.email...');
    execSync('git config user.email "yuldoshbek@users.noreply.github.com"', { stdio: 'inherit' });
  }

  // Stage all changes
  console.log('➕ Staging changes...');
  execSync('git add -A', { stdio: 'inherit' });
  
  // Check if there are changes to commit
  const status = execSync('git status --porcelain').toString().trim();
  if (!status) {
    console.log('✅ No changes to commit. Repository is clean.');
    process.exit(0);
  }
  
  const timestamp = new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Tashkent' });
  const commitMessage = `Auto-sync: ${timestamp}`;
  
  console.log(`💾 Committing changes: "${commitMessage}"...`);
  execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
  
  console.log('🚀 Pushing to remote main branch...');
  execSync('git push origin main', { stdio: 'inherit' });
  
  console.log('🎉 Git synchronization complete!');
} catch (error) {
  console.error('❌ Error during git synchronization:', error.message);
  process.exit(1);
}

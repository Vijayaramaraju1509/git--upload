// const express = require('express');
// const { exec } = require('child_process');

// const app = express();
// const port = 3000;

// app.use(express.json());

// app.post('/generate-script', async (req, res) => {
//   const { deviceName, url } = req.body;

//   if (!deviceName || !url) {
//     return res.status(400).json({
//       error: 'Both "deviceName" and "url" must be provided in request body'
//     });
//   }

//   const command = `npx playwright codegen --device="${deviceName}" --target=javascript ${url}`;

//   // Launch codegen interactively and capture output
//   const child = exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
//     if (error) {
//       console.error('Error:', error.message);
//       return res.status(500).json({ error: 'Failed to generate script' });
//     }

//     res.json({
//       message: 'Script generated successfully',
//       device: deviceName,
//       url: url,
//       script: stdout
//     });
//   });

//   // Optional: server logging
//   child.stdout?.pipe(process.stdout);
//   child.stderr?.pipe(process.stderr);
// });

// app.listen(port, () => {
//   console.log(`🚀 Server is running at http://localhost:${port}`);
// });



const express = require('express');
const { exec, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

app.use(express.json());

// 🔧 Update this path to your actual Git repo
const REPO_PATH = path.join(__dirname, "scripts-repo");
const SCRIPTS_DIR = path.join(REPO_PATH, "scripts");

app.post('/generate-script', (req, res) => {
  const { deviceName, url, filename } = req.body;

  if (!deviceName || !url || !filename) {
    return res.status(400).json({
      error: 'Fields "deviceName", "url", and "filename" are required.'
    });
  }

  const command = `npx playwright codegen --device="${deviceName}" --target=javascript ${url}`;

  const child = exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout) => {
    if (error) {
      console.error('Error:', error.message);
      return res.status(500).json({ error: 'Failed to generate script' });
    }

    try {
      // Save script to file
      const filePath = path.join(SCRIPTS_DIR, filename);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, stdout);

      // Commit and push to GitHub
      execSync(`git add .`, { cwd: REPO_PATH });
      execSync(`git commit -m "Add script: ${filename}"`, { cwd: REPO_PATH });
      execSync(`git push origin main`, { cwd: REPO_PATH });

      return res.json({
        message: '✅ Script saved and pushed to GitHub!',
        filename,
        repoPath: filePath,
      });
    } catch (err) {
      console.error("Git push failed:", err);
      return res.status(500).json({ error: 'Failed to push to GitHub' });
    }
  });

  // Optional logs
  child.stdout?.pipe(process.stdout);
  child.stderr?.pipe(process.stderr);
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});

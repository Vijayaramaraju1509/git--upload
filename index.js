const express = require('express');
const { exec } = require('child_process');

const app = express();
const port = 3000;

app.use(express.json());

app.post('/generate-script', async (req, res) => {
  const { deviceName, url } = req.body;

  if (!deviceName || !url) {
    return res.status(400).json({
      error: 'Both "deviceName" and "url" must be provided in request body'
    });
  }

  const command = `npx playwright codegen --device="${deviceName}" --target=javascript ${url}`;

  // Launch codegen interactively and capture output
  const child = exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
    if (error) {
      console.error('Error:', error.message);
      return res.status(500).json({ error: 'Failed to generate script' });
    }

    res.json({
      message: 'Script generated successfully',
      device: deviceName,
      url: url,
      script: stdout
    });
  });

  // Optional: server logging
  child.stdout?.pipe(process.stdout);
  child.stderr?.pipe(process.stderr);
});

app.listen(port, () => {
  console.log(`🚀 Server is running at http://localhost:${port}`);
});

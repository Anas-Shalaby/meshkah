import { createCanvas, loadImage, registerFont } from "canvas";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateSocialToken() {
  const size = 1200;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  // White background with subtle gradient
  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size * 0.8
  );
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(0.7, "#f8fafc");
  gradient.addColorStop(1, "#f1f5f9");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Black network effect
  ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
  ctx.lineWidth = 1;
  const gridSize = 40;
  for (let i = 0; i < size; i += gridSize) {
    for (let j = 0; j < size; j += gridSize) {
      if (Math.random() > 0.3) {
        ctx.beginPath();
        ctx.moveTo(i, j);
        ctx.lineTo(i + gridSize, j + gridSize);
        ctx.stroke();
      }
      if (Math.random() > 0.3) {
        ctx.beginPath();
        ctx.moveTo(i + gridSize, j);
        ctx.lineTo(i, j + gridSize);
        ctx.stroke();
      }
    }
  }

  // Enhanced gradient with more white tones

  // Create multiple icon instances with different sizes and positions
  const iconPositions = [];
  const numIcons = 15;
  const radius = size * 0.35;

  // Add center icon
  iconPositions.push({
    path: "./public/icons/favicon.svg",
    x: size / 2,
    y: size / 2,
    scale: 0.3,
    rotation: 0,
    alpha: 0.9,
  });

  // Enhanced pattern
  ctx.fillStyle = "#ffffff08";

  // Draw icons with enhanced effects
  for (const icon of iconPositions) {
    try {
      const img = await loadImage(icon.path);
      const iconSize = size * icon.scale;
      ctx.save();
      ctx.translate(icon.x, icon.y);
      ctx.rotate(icon.rotation);
      ctx.globalAlpha = icon.alpha;

      // Add glow to icons
      ctx.shadowColor = "#10b981";
      ctx.shadowBlur = 20;
      ctx.drawImage(img, -iconSize / 2, -iconSize / 2, iconSize, iconSize);

      ctx.restore();
    } catch (err) {
      console.error(`Failed to load icon: ${icon.path}`);
    }
  }

  // Bottom text styling
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.font = "bold 100px Amiri";
  const text = "مشكاة الأحاديث";

  // Text with shadow
  ctx.shadowColor = "#000000";
  ctx.shadowBlur = 35;
  ctx.fillStyle = "#000000";
  ctx.fillText(text, size / 2, size - 100);

  // Text border
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(0, 0, 0, 0.6)";
  ctx.lineWidth = 2;
  ctx.strokeText(text, size / 2, size - 100);

  // Add outer ring with white highlight
  ctx.shadowColor = "#ffffff";
  ctx.shadowBlur = 50;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.45, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Add final white highlights
  // for (let i = 0; i < 3; i++) {
  //   ctx.shadowColor = "#ffffff";
  //   ctx.shadowBlur = 30;
  //   ctx.beginPath();
  //   ctx.arc(
  //     size / 2 + Math.cos((i * Math.PI * 2) / 3) * 50,
  //     size / 2 + Math.sin((i * Math.PI * 2) / 3) * 50,
  //     10,
  //     0,
  //     Math.PI * 2
  //   );
  //   ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  //   ctx.fill();
  // }

  // Save the image
  const buffer = canvas.toBuffer("image/png");
  const outputPath = path.join(__dirname, "public", "social-token.png");
  fs.writeFileSync(outputPath, buffer);
  console.log(`Social token generated at: ${outputPath}`);
}

generateSocialToken().catch(console.error);
